'use client';

import * as stylex from '@stylexjs/stylex';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { button } from '@/components/styles';
import { MUSIC } from '@/lib/site';

const LOOP_SECONDS = 90;
const CROSSFADE_SECONDS = 4;
const RAMP_SECONDS = 0.8;
const VOLUME = 0.6;
const LOOKAHEAD_SECONDS = 2;
const SCHEDULER_MS = 500;
const CURVE_STEPS = 64;
const STORAGE_KEY = 'music';
const ROOM_QUERY = '(min-width: 30rem)';
const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchend', 'click'];

export function equalPowerCurves(steps: number) {
  const fadeIn = new Float32Array(steps);
  const fadeOut = new Float32Array(steps);
  for (let step = 0; step < steps; step++) {
    const angle = (step / (steps - 1)) * (Math.PI / 2);
    fadeIn[step] = Math.sin(angle);
    fadeOut[step] = Math.cos(angle);
  }
  return { fadeIn, fadeOut };
}

const { fadeIn, fadeOut } = equalPowerCurves(CURVE_STEPS);

type Engine = {
  context: AudioContext;
  master: GainNode;
  buffer: Promise<AudioBuffer | undefined>;
  nextStart: number;
  timer: number;
};

let engine: Engine | undefined;
let wanted: boolean | undefined;
const listeners = new Set<() => void>();

function readChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    if (error instanceof DOMException) return null;
    throw error;
  }
}

function saveChoice(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

function getWanted() {
  wanted ??= readChoice() !== 'off';
  return wanted;
}

function setWanted(on: boolean) {
  wanted = on;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function audible() {
  return getWanted() && !document.hidden && matchMedia(ROOM_QUERY).matches;
}

async function loadTrack(context: AudioContext) {
  try {
    const response = await fetch(MUSIC.src, { priority: 'low' });
    if (!response.ok) {
      throw new Error(`${MUSIC.src}: HTTP ${response.status}`);
    }
    return await context.decodeAudioData(await response.arrayBuffer());
  } catch (error) {
    reportError(error);
    setWanted(false);
    return undefined;
  }
}

function ensureEngine() {
  if (engine) return engine;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const unlock = (event: Event) => {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-music-toggle]')
    ) {
      return;
    }
    if (audible()) void context.resume();
  };
  for (const type of UNLOCK_EVENTS) {
    addEventListener(type, unlock, { capture: true, passive: true });
  }
  context.addEventListener('statechange', () => {
    if (context.state === 'running') {
      for (const type of UNLOCK_EVENTS) {
        removeEventListener(type, unlock, { capture: true });
      }
    }
    void sync();
  });
  engine = {
    context,
    master,
    buffer: loadTrack(context),
    nextStart: 0,
    timer: 0,
  };
  return engine;
}

function playCycle(
  { context, master }: Engine,
  buffer: AudioBuffer,
  start: number,
) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.setValueCurveAtTime(fadeIn, start, CROSSFADE_SECONDS);
  gain.gain.setValueCurveAtTime(
    fadeOut,
    start + LOOP_SECONDS - CROSSFADE_SECONDS,
    CROSSFADE_SECONDS,
  );
  source.connect(gain).connect(master);
  source.addEventListener('ended', () => gain.disconnect());
  source.start(start, 0, LOOP_SECONDS);
}

function startScheduler(current: Engine, buffer: AudioBuffer) {
  if (current.timer) return;
  current.nextStart = Math.max(
    current.nextStart,
    current.context.currentTime + 0.05,
  );
  const schedule = () => {
    while (
      current.nextStart - current.context.currentTime <
      LOOKAHEAD_SECONDS
    ) {
      playCycle(current, buffer, current.nextStart);
      current.nextStart += LOOP_SECONDS - CROSSFADE_SECONDS;
    }
  };
  schedule();
  current.timer = window.setInterval(schedule, SCHEDULER_MS);
}

function rampTo({ context, master }: Engine, level: number) {
  const now = context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(level, now + RAMP_SECONDS);
}

function pause(current: Engine) {
  window.clearInterval(current.timer);
  current.timer = 0;
  if (current.context.state !== 'running') return;
  rampTo(current, 0);
  window.setTimeout(() => {
    if (!audible()) void current.context.suspend();
  }, RAMP_SECONDS * 1000);
}

async function sync() {
  if (!audible()) {
    if (engine) pause(engine);
    return;
  }
  const current = ensureEngine();
  if (current.context.state === 'suspended') void current.context.resume();
  const buffer = await current.buffer;
  if (!buffer || current.context.state !== 'running' || !audible()) return;
  startScheduler(current, buffer);
  rampTo(current, VOLUME);
}

function toggle() {
  const on = !getWanted();
  saveChoice(on);
  setWanted(on);
  if (on && engine) void engine.context.resume();
  void sync();
}

export function MusicToggle() {
  const on = useSyncExternalStore(subscribe, getWanted, () => true);
  useEffect(() => {
    const room = matchMedia(ROOM_QUERY);
    const update = () => void sync();
    const begin = () => {
      update();
      document.addEventListener('visibilitychange', update);
      room.addEventListener('change', update);
    };
    if (document.readyState === 'complete') {
      begin();
    } else {
      addEventListener('load', begin, { once: true });
    }
    return () => {
      removeEventListener('load', begin);
      document.removeEventListener('visibilitychange', update);
      room.removeEventListener('change', update);
    };
  }, []);
  return (
    <button
      type="button"
      data-music-toggle
      aria-label="Background music"
      aria-pressed={on}
      title={`${MUSIC.title} by ${MUSIC.artist}`}
      onClick={toggle}
      {...stylex.props(button.base, button.ghost, styles.toggle)}
    >
      {on ? (
        <Volume2 aria-hidden {...stylex.props(styles.icon)} />
      ) : (
        <VolumeX aria-hidden {...stylex.props(styles.icon)} />
      )}
    </button>
  );
}

const styles = stylex.create({
  toggle: {
    display: { default: 'none', '@media (min-width: 30rem)': 'inline-flex' },
    width: 40,
    height: 40,
    padding: 0,
  },
  icon: {
    width: 18,
    height: 18,
  },
});
