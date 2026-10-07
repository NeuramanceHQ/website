import { expect, it } from 'vitest';
import { equalPowerCurves } from './music';

it('crossfades from silence to full volume at constant combined power', () => {
  const { fadeIn, fadeOut } = equalPowerCurves(64);
  expect([fadeIn[0], fadeIn[63], fadeOut[0]]).toEqual([0, 1, 1]);
  expect(fadeOut[63]).toBeCloseTo(0, 6);
  for (let step = 0; step < 64; step++) {
    expect(fadeIn[step] ** 2 + fadeOut[step] ** 2).toBeCloseTo(1, 6);
  }
});
