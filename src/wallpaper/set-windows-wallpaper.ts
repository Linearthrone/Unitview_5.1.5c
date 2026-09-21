import { execFile } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Apply an image as the Windows desktop wallpaper via SystemParametersInfo.
 * No-op on non-Windows platforms (returns applied: false).
 */
export async function setWindowsWallpaper(imagePath: string): Promise<{ applied: boolean }> {
  if (process.platform !== 'win32') {
    return { applied: false };
  }

  const normalized = path.resolve(imagePath);
  const escaped = normalized.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    'Add-Type @"',
    'using System.Runtime.InteropServices;',
    'public class NativeWallpaper {',
    '  [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]',
    '  public static extern bool SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);',
    '}',
    '"@',
    `$ok = [NativeWallpaper]::SystemParametersInfo(20, 0, '${escaped}', 3)`,
    'if (-not $ok) { throw "SystemParametersInfo failed" }',
    "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name WallpaperStyle -Value 10",
    "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name TileWallpaper -Value 0",
  ].join('\n');

  await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { windowsHide: true, timeout: 20000, maxBuffer: 1024 * 1024 }
  );

  return { applied: true };
}

/** Read the current user wallpaper path from the registry (Windows only). */
export async function getWindowsWallpaperPath(): Promise<string | null> {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        "(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name WallPaper -ErrorAction SilentlyContinue).WallPaper",
      ],
      { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 }
    );
    const value = stdout.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function clampWallpaperIntervalMs(intervalMs: number | undefined): number {
  const fallback = 10_000;
  if (typeof intervalMs !== 'number' || !Number.isFinite(intervalMs)) {
    return fallback;
  }
  return Math.min(60_000, Math.max(5_000, Math.round(intervalMs)));
}
