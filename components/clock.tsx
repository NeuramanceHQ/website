'use client';

import { useSyncExternalStore, type ComponentProps } from 'react';

const AUSTIN = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
});

const subscribe = (tick: () => void) => {
  const interval = setInterval(tick, 1000);
  return () => clearInterval(interval);
};

const now = () => AUSTIN.format(Math.floor(Date.now() / 1000) * 1000);

const unknown = () => '--:--:-- CT';

export function Clock(props: Omit<ComponentProps<'span'>, 'children'>) {
  return (
    <span {...props}>{useSyncExternalStore(subscribe, now, unknown)}</span>
  );
}
