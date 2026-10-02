import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { colors, fonts } from '@/lib/tokens.stylex';

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const CLOUDS = [
  {
    left: '-10%',
    top: '15%',
    width: '62%',
    height: '12%',
    opacity: 0.7,
    seconds: 80,
  },
  {
    left: '50%',
    top: '8%',
    width: '46%',
    height: '8%',
    opacity: 0.5,
    seconds: 110,
  },
  {
    left: '18%',
    top: '31%',
    width: '78%',
    height: '10%',
    opacity: 0.55,
    seconds: 140,
  },
  {
    left: '-6%',
    top: '44%',
    width: '44%',
    height: '7%',
    opacity: 0.45,
    seconds: 95,
  },
  {
    left: '66%',
    top: '49%',
    width: '36%',
    height: '6%',
    opacity: 0.5,
    seconds: 125,
  },
];

const WINDOWS = [
  [280, 156],
  [286, 156],
  [292, 156],
  [280, 166],
  [298, 166],
  [310, 174],
  [326, 178],
  [336, 182],
  [236, 180],
  [18, 170],
  [158, 184],
];

const BEACONS = [
  { left: '75.6%', top: '19.8%', size: '0.75%', delay: '0s' },
  { left: '10%', top: '46.7%', size: '0.55%', delay: '-1.3s' },
];

const STREAKS = [
  {
    left: '71.25%',
    width: '0.4%',
    height: '13.3%',
    color: colors.lamp,
    opacity: 0.75,
    delay: '0s',
  },
  {
    left: '74.6%',
    width: '0.4%',
    height: '11.3%',
    color: colors.lamp,
    opacity: 0.75,
    delay: '-1.2s',
  },
  {
    left: '81.75%',
    width: '0.35%',
    height: '9.3%',
    color: colors.lamp,
    opacity: 0.75,
    delay: '-2s',
  },
  {
    left: '64.25%',
    width: '0.6%',
    height: '10%',
    color: colors.neon,
    opacity: 0.3,
    delay: '-0.6s',
  },
  {
    left: '75.4%',
    width: '0.35%',
    height: '18.7%',
    color: colors.beacon,
    opacity: 0.35,
    delay: '-1.8s',
  },
];

const SKYLINE = [
  'M0 189h400v4H0z',
  'M14 193v-30h3v-4h4v4h3v30z',
  'M30 193l9-44h2l9 44h-3l-7-34-7 34z',
  'M24 150h44v3H24zM60 150l2-6h3l-1 6zM38 141h6v9h-6z',
  'M58 193l6-40h2l6 40h-3l-4-30-4 30z',
  'M118 193l5-46h2l5 46h-2l-4-38-4 38zM114 156h20v1.5h-20zM116 164h16v1.5h-16z',
  'M146 193v-17a15 6 0 0 1 30 0v17zM180 193v-13a12 5 0 0 1 24 0v13zM206 193v-9h22v9z',
  'M230 193v-28l11-7v7l11-7v7l11-7v7l11-7v35z',
  'M276 193v-44h44v44zM282 149v-6h32v6zM298.5 143L300 60h4.6l1.5 83zM309 143l.8-38h3.6l.8 38z',
  'M320 193v-24h30v24zM350 193v-14h26v14zM376 193v-9h24v9zM262 165l26-18h3l-26 18z',
].join('');

export function Broadcast({ children }: { children: ReactNode }) {
  return (
    <figure {...stylex.props(styles.screen)}>
      <div aria-hidden {...stylex.props(styles.layer, styles.sky)} />
      {CLOUDS.map((cloud) => (
        <div
          key={cloud.left + cloud.top}
          aria-hidden
          {...stylex.props(styles.cloud(cloud))}
        />
      ))}
      <div aria-hidden {...stylex.props(styles.plume)} />
      <svg
        aria-hidden
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        {...stylex.props(styles.layer)}
      >
        <defs>
          <filter id="glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <filter id="soft">
            <feGaussianBlur stdDeviation="1.6 0.8" />
          </filter>
          <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef2ff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#eef2ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          fill="#3d4bbb"
          opacity="0.8"
          d="M0 189C30 186 60 187 90 185C120 184 150 186 170 185L190 186L215 184L240 186C270 185 300 187 330 185C360 184 380 186 400 185V191H0Z"
        />
        <path
          fill="#2a3596"
          opacity="0.9"
          d="M84 191v-8h10v8zM96 191v-12h4v-3h3v15zM196 191v-7h8v7zM340 191v-10h10v10zM362 191v-6h12v6z"
        />
        <path fill={colors.silhouette} d={SKYLINE} />
        <rect
          x="250"
          y="168"
          width="20"
          height="7"
          fill={colors.silhouette}
          stroke="#4d6bff"
          strokeWidth="0.6"
        />
        <text
          x="260"
          y="173.4"
          filter="url(#glow)"
          {...stylex.props(styles.sign)}
        >
          神念
        </text>
        <text x="260" y="173.4" {...stylex.props(styles.sign, styles.signCore)}>
          神念
        </text>
        <g fill={colors.lamp} filter="url(#glow)">
          {WINDOWS.map(([x, y]) => (
            <rect key={`${x},${y}`} x={x} y={y} width="3" height="1.2" />
          ))}
        </g>
        <path
          d={SKYLINE}
          fill="#0c1240"
          opacity="0.38"
          filter="url(#soft)"
          transform="translate(0 386) scale(1 -1)"
        />
        <rect x="120" y="193.5" width="200" height="1.2" fill="url(#horizon)" />
        <g fill={colors.frost} filter="url(#glow)" opacity="0.85">
          <ellipse cx="96" cy="188.6" rx="46" ry="0.45" />
          <ellipse cx="96" cy="188.6" rx="0.45" ry="9" />
          <ellipse
            cx="96"
            cy="188.6"
            rx="14"
            ry="0.35"
            transform="rotate(28 96 188.6)"
            opacity="0.5"
          />
          <ellipse
            cx="96"
            cy="188.6"
            rx="14"
            ry="0.35"
            transform="rotate(-28 96 188.6)"
            opacity="0.5"
          />
          <circle cx="96" cy="188.6" r="2.4" />
        </g>
        <circle cx="96" cy="188.6" r="1" fill="#fff" />
        <path
          stroke="#d6ddff"
          strokeOpacity="0.16"
          strokeWidth="0.45"
          d="M40 204h80M190 210h120M70 222h160M250 232h110M20 246h140M180 260h170M60 278h200M10 292h120"
        />
      </svg>
      {BEACONS.map((beacon) => (
        <div
          key={beacon.left}
          aria-hidden
          {...stylex.props(styles.beacon(beacon))}
        />
      ))}
      {STREAKS.map((streak) => (
        <div
          key={streak.left}
          aria-hidden
          {...stylex.props(styles.streak(streak))}
        />
      ))}
      <div aria-hidden {...stylex.props(styles.layer, styles.bloom)} />
      <figcaption {...stylex.props(styles.caption)}>{children}</figcaption>
      <span aria-hidden {...stylex.props(styles.osd, styles.topLeft)}>
        CH 01
      </span>
      <span aria-hidden {...stylex.props(styles.osd, styles.topRight)}>
        ▶ PLAY
      </span>
      <span aria-hidden {...stylex.props(styles.osd, styles.bottomRight)}>
        30.27°N 97.74°W
      </span>
      <div aria-hidden {...stylex.props(styles.band)} />
      <div aria-hidden {...stylex.props(styles.layer, styles.scanlines)} />
      <div aria-hidden {...stylex.props(styles.grain)} />
      <div aria-hidden {...stylex.props(styles.layer, styles.vignette)} />
    </figure>
  );
}

const drift = stylex.keyframes({ to: { transform: 'translateX(9%)' } });

const billow = stylex.keyframes({
  to: { transform: 'translateX(4%) scaleX(1.12) skewX(-6deg)' },
});

const blink = stylex.keyframes({ '50%': { opacity: 0.1 } });

const mirror = stylex.keyframes({
  '0%': { transform: 'none' },
  '97%': { transform: 'scaleX(-1)' },
  '98%': { transform: 'none' },
});

const ripple = stylex.keyframes({
  to: { transform: 'scaleX(1.6)', opacity: 0.55 },
});

const roll = stylex.keyframes({
  '0%': { transform: 'translateY(0)' },
  '55%, 100%': { transform: 'translateY(1250%)' },
});

const noise = stylex.keyframes({
  '0%': { transform: 'translate(0, 0)' },
  '20%': { transform: 'translate(-6%, 3%)' },
  '40%': { transform: 'translate(4%, -5%)' },
  '60%': { transform: 'translate(-3%, -2%)' },
  '80%': { transform: 'translate(5%, 4%)' },
});

const styles = stylex.create({
  screen: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    overflow: 'hidden',
    isolation: 'isolate',
    containerType: 'inline-size',
    backgroundColor: colors.night,
    borderRadius: 4,
    boxShadow:
      '0 0 0 1px rgb(255 255 255 / 0.08), 0 30px 80px -20px rgb(54 70 217 / 0.35), 0 0 160px -40px rgb(109 124 240 / 0.35)',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  sky: {
    backgroundImage:
      'linear-gradient(180deg, #0a1048 0%, #1c2890 26%, #3f50d8 46%, #7d8ef4 57%, #c4cfff 63.6%, #e9eeff 64%, #5462dc 64.1%, #3442b8 68%, #202c8c 80%, #111860 100%)',
  },
  cloud: (cloud: (typeof CLOUDS)[number]) => ({
    position: 'absolute',
    left: cloud.left,
    top: cloud.top,
    width: cloud.width,
    height: cloud.height,
    opacity: cloud.opacity,
    borderRadius: '50%',
    filter: 'blur(10px)',
    backgroundImage:
      'radial-gradient(closest-side, #c3cbff, #8f9cf5 50%, #6f7ee8 75%, transparent)',
    animationName: drift,
    animationDuration: `${cloud.seconds}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  }),
  plume: {
    position: 'absolute',
    left: '73.5%',
    top: '13%',
    width: '26%',
    height: '16%',
    opacity: 0.42,
    filter: 'blur(9px)',
    backgroundImage:
      'radial-gradient(40% 55% at 12% 70%, #e6ebff, transparent 70%), radial-gradient(45% 50% at 45% 45%, #cdd5ff, transparent 70%), radial-gradient(40% 45% at 80% 30%, #b4c0ff, transparent 70%)',
    transformOrigin: '0 100%',
    animationName: billow,
    animationDuration: '14s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  },
  sign: {
    fontFamily: '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif',
    fontSize: 5,
    fontWeight: 700,
    textAnchor: 'middle',
    fill: colors.neon,
  },
  signCore: {
    fill: '#d8fff0',
  },
  beacon: (beacon: (typeof BEACONS)[number]) => ({
    position: 'absolute',
    left: beacon.left,
    top: beacon.top,
    width: beacon.size,
    aspectRatio: '1',
    translate: '-50% -50%',
    borderRadius: '50%',
    backgroundColor: colors.beacon,
    boxShadow: `0 0 0.6cqi 0.15cqi ${colors.beacon}`,
    animationName: blink,
    animationDuration: '2.6s',
    animationIterationCount: 'infinite',
    animationDelay: beacon.delay,
  }),
  streak: (streak: (typeof STREAKS)[number]) => ({
    position: 'absolute',
    left: streak.left,
    top: '64.7%',
    width: streak.width,
    height: streak.height,
    opacity: streak.opacity,
    backgroundImage: `linear-gradient(${streak.color}, transparent)`,
    animationName: ripple,
    animationDuration: '3.2s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationDelay: streak.delay,
  }),
  bloom: {
    backgroundImage:
      'radial-gradient(60% 18% at 50% 64%, rgb(220 228 255 / 0.22), transparent 70%)',
  },
  caption: {
    position: 'absolute',
    top: '41%',
    right: 0,
    left: 0,
    paddingInline: '6%',
    textAlign: 'center',
    textWrap: 'balance',
    fontSize: '6.25cqi',
    lineHeight: 1.04,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#fff',
    textShadow:
      '-1.2px 0 0 rgb(255 70 110 / 0.45), 1.2px 0 0 rgb(70 210 255 / 0.45), 0 2px 2px rgb(0 0 30 / 0.9), 0 0 24px rgb(180 195 255 / 0.5)',
    animationName: mirror,
    animationDuration: '11s',
    animationDelay: '4s',
    animationTimingFunction: 'steps(1, end)',
    animationIterationCount: 'infinite',
  },
  osd: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 'max(9px, 1.6cqi)',
    lineHeight: 1,
    letterSpacing: '0.04em',
    color: '#fff',
    textShadow: '0 1px 2px rgb(0 0 0 / 0.8), 0 0 8px rgb(184 198 255 / 0.4)',
  },
  topLeft: {
    top: '5.5%',
    left: '4.5%',
  },
  topRight: {
    top: '5.5%',
    right: '4.5%',
  },
  bottomRight: {
    right: '4.5%',
    bottom: '6%',
  },
  band: {
    position: 'absolute',
    top: '-9%',
    left: 0,
    width: '100%',
    height: '9%',
    backgroundImage:
      'linear-gradient(180deg, transparent, rgb(210 220 255 / 0.07) 40%, rgb(255 255 255 / 0.14) 50%, rgb(210 220 255 / 0.07) 60%, transparent)',
    animationName: roll,
    animationDuration: '11s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  scanlines: {
    backgroundImage:
      'repeating-linear-gradient(180deg, rgb(0 0 16 / 0.28) 0 1px, transparent 1px 3px)',
  },
  grain: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    opacity: 0.18,
    mixBlendMode: 'overlay',
    backgroundImage: GRAIN,
    animationName: noise,
    animationDuration: '0.8s',
    animationTimingFunction: 'steps(5)',
    animationIterationCount: 'infinite',
  },
  vignette: {
    backgroundImage:
      'radial-gradient(115% 95% at 50% 46%, transparent 58%, rgb(0 0 12 / 0.6) 100%)',
  },
});
