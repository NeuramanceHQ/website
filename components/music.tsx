'use client';

import * as stylex from '@stylexjs/stylex';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { button } from '@/components/styles';
import { MUSIC } from '@/lib/site';

const CROSSFADE_SECONDS = 4;
const RAMP_SECONDS = 0.8;
const VOLUME = 0.6;
const LOAD_TIMEOUT_MS = 60_000;
const LOAD_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const STORAGE_KEY = 'music';
const ROOM_QUERY = '(min-width: 30rem)';
const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchend', 'click'];

export function bakeCrossfade(samples: Float32Array, fadeLength: number) {
  const tail = samples.length - fadeLength;
  for (let index = 0; index < fadeLength; index++) {
    const angle = (index / fadeLength) * (Math.PI / 2);
    samples[tail + index] =
      samples[tail + index] * Math.cos(angle) +
      samples[index] * Math.sin(angle);
  }
}

type Engine = {
  context: AudioContext;
  master: GainNode;
  buffer?: Promise<AudioBuffer | undefined>;
  source?: AudioBufferSourceNode;
  suspendTimer: number;
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

function transient(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof DOMException && error.name === 'TimeoutError')
  );
}

async function fetchTrack() {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(MUSIC.src, {
        priority: 'low',
        signal: AbortSignal.timeout(LOAD_TIMEOUT_MS),
      });
      if (response.ok) return await response.arrayBuffer();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === LOAD_ATTEMPTS) {
        throw new Error(`${MUSIC.src}: HTTP ${response.status}`);
      }
    } catch (error) {
      if (!transient(error) || attempt === LOAD_ATTEMPTS) throw error;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY_MS * 2 ** (attempt - 1)),
    );
  }
}

async function loadTrack(context: AudioContext) {
  try {
    const buffer = await context.decodeAudioData(await fetchTrack());
    if (buffer.duration <= 2 * CROSSFADE_SECONDS) {
      throw new Error(`${MUSIC.src}: ${buffer.duration}s is too short to loop`);
    }
    const fadeLength = Math.round(CROSSFADE_SECONDS * buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      bakeCrossfade(buffer.getChannelData(channel), fadeLength);
    }
    return buffer;
  } catch (error) {
    reportError(error);
    return undefined;
  }
}

function ensureEngine() {
  if (engine) return engine;
  const context = new AudioContext({ latencyHint: 'playback' });
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
  context.addEventListener('statechange', () => void sync());
  engine = { context, master, suspendTimer: 0 };
  return engine;
}

function rampTo({ context, master }: Engine, level: number) {
  const now = context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(level, now + RAMP_SECONDS);
}

function pause(current: Engine) {
  if (current.context.state !== 'running' || current.suspendTimer) return;
  rampTo(current, 0);
  current.suspendTimer = window.setTimeout(() => {
    current.suspendTimer = 0;
    if (!audible()) void current.context.suspend();
  }, RAMP_SECONDS * 1000);
}

async function sync() {
  if (!audible()) {
    if (engine) pause(engine);
    return;
  }
  const current = ensureEngine();
  window.clearTimeout(current.suspendTimer);
  current.suspendTimer = 0;
  if (current.context.state === 'suspended') void current.context.resume();
  current.buffer ??= loadTrack(current.context);
  const buffer = await current.buffer;
  if (!buffer) {
    current.buffer = undefined;
    setWanted(false);
    pause(current);
    return;
  }
  if (current.context.state !== 'running' || !audible()) return;
  if (!current.source) {
    const source = current.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = CROSSFADE_SECONDS;
    source.loopEnd = buffer.duration;
    source.connect(current.master);
    source.start();
    current.source = source;
  }
  rampTo(current, VOLUME);
}

function toggle() {
  if (getWanted() && engine?.context.state === 'suspended' && audible()) {
    void engine.context.resume();
    return;
  }
  const on = !getWanted();
  saveChoice(on);
  setWanted(on);
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
