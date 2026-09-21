import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampWallpaperIntervalMs } from './set-windows-wallpaper';

test('clampWallpaperIntervalMs defaults and bounds', () => {
  assert.equal(clampWallpaperIntervalMs(undefined), 10_000);
  assert.equal(clampWallpaperIntervalMs(Number.NaN), 10_000);
  assert.equal(clampWallpaperIntervalMs(1_000), 5_000);
  assert.equal(clampWallpaperIntervalMs(120_000), 60_000);
  assert.equal(clampWallpaperIntervalMs(15_500), 15_500);
});
