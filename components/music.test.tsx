import { expect, it } from 'vitest';
import { bakeCrossfade } from './music';

const FADE = 8;
const LENGTH = 32;

function weights(head: number, tail: number) {
  const samples = new Float32Array(LENGTH);
  samples.fill(head, 0, FADE);
  samples.fill(tail, LENGTH - FADE);
  bakeCrossfade(samples, FADE);
  return Array.from(samples.subarray(LENGTH - FADE));
}

it('blends the loop head into the tail at constant combined power', () => {
  const tailWeights = weights(0, 1);
  const headWeights = weights(1, 0);
  expect(tailWeights[0]).toBe(1);
  expect(headWeights[0]).toBe(0);
  for (let index = 0; index < FADE; index++) {
    expect(tailWeights[index] ** 2 + headWeights[index] ** 2).toBeCloseTo(1, 6);
  }
  for (let index = 1; index < FADE; index++) {
    expect(tailWeights[index]).toBeLessThan(tailWeights[index - 1]);
    expect(headWeights[index]).toBeGreaterThan(headWeights[index - 1]);
  }
  expect(headWeights[FADE - 1]).toBeGreaterThan(0.95);
});

it('leaves everything outside the tail untouched', () => {
  const samples = Float32Array.from({ length: LENGTH }, (_, index) => index);
  bakeCrossfade(samples, FADE);
  for (let index = 0; index < LENGTH - FADE; index++) {
    expect(samples[index]).toBe(index);
  }
});
