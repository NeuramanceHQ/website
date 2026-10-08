'use client';

import * as stylex from '@stylexjs/stylex';
import Script from 'next/script';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { preconnect, preload } from 'react-dom';

const PLAYING = 1;
const REVEAL_DELAY_MS = 3500;
const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const PLAYER_WIDTH = 640;
const COVER_WIDTH = 'max(100vw * 4 / 3, 100lvh * 16 / 9)';
const COVER_SCALE = `tan(atan2(${COVER_WIDTH}, ${PLAYER_WIDTH}px))`;

type Player = {
  destroy: () => void;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  unloadModule?: (module: string) => void;
};

type PlayerOptions = {
  videoId: string;
  width: string;
  height: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: { target: Player }) => void;
    onStateChange: (event: { target: Player; data: number }) => void;
  };
};

declare global {
  interface Window {
    YT?: {
      Player?: new (element: HTMLElement, options: PlayerOptions) => Player;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const subscribe = (change: () => void) => {
  const query = window.matchMedia(MOTION_OK);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function VideoBackground({ videoId }: { videoId: string }) {
  const poster = `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`;
  preload(poster, { as: 'image' });
  preconnect('https://www.youtube.com');
  const motionOk = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOTION_OK).matches,
    () => false,
  );
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!motionOk || !element) return;
    let player: Player | undefined;
    let ready: Player | undefined;
    let reveal: ReturnType<typeof setTimeout> | undefined;
    const followTab = () =>
      document.hidden ? ready?.pauseVideo() : ready?.playVideo();
    const create = () => {
      const YouTubePlayer = window.YT?.Player;
      if (!YouTubePlayer) return;
      const host = document.createElement('div');
      element.replaceChildren(host);
      player = new YouTubePlayer(host, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onReady: ({ target }) => {
            ready = target;
            target.mute();
            followTab();
          },
          onStateChange: ({ target, data }) => {
            clearTimeout(reveal);
            if (data !== PLAYING) {
              setVisible(false);
              return;
            }
            target.unloadModule?.('captions');
            reveal = setTimeout(() => setVisible(true), REVEAL_DELAY_MS);
          },
        },
      });
    };
    if (window.YT?.Player) create();
    else window.onYouTubeIframeAPIReady = create;
    document.addEventListener('visibilitychange', followTab);
    return () => {
      document.removeEventListener('visibilitychange', followTab);
      clearTimeout(reveal);
      window.onYouTubeIframeAPIReady = undefined;
      player?.destroy();
      element.replaceChildren();
      setVisible(false);
    };
  }, [motionOk, videoId]);

  return (
    <div aria-hidden inert {...stylex.props(styles.layer)}>
      <div {...stylex.props(styles.frame, styles.poster(`url(${poster})`))}>
        <div
          ref={container}
          {...stylex.props(styles.player, visible && styles.visible)}
        />
      </div>
      {motionOk && <Script src="https://www.youtube.com/iframe_api" />}
    </div>
  );
}

const styles = stylex.create({
  layer: {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: -1,
    width: '100vw',
    height: '100lvh',
    overflow: 'hidden',
    pointerEvents: 'none',
    opacity: 0.18,
  },
  frame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: PLAYER_WIDTH,
    height: (PLAYER_WIDTH * 9) / 16,
    translate: '-50% -50%',
    scale: `calc(${COVER_SCALE} * 1.02)`,
    backgroundSize: '100% 100%',
  },
  poster: (image: string) => ({
    backgroundImage: image,
  }),
  player: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease-out',
  },
  visible: {
    opacity: 1,
    transitionDuration: '0.8s',
  },
});
