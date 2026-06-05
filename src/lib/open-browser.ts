import { spawn } from 'child_process';

/**
 * Best-effort launch of a URL in the host's default browser. Only meaningful
 * when the server runs on the user's own machine (the usual local-dev case for
 * this app); in a headless/remote deployment it simply no-ops and callers
 * should fall back to the returned URL. Never throws.
 */
export function openInBrowser(url: string): boolean {
  try {
    const platform = process.platform;
    const [cmd, args] =
      platform === 'darwin' ? ['open', [url]] as const :
      platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] as const :
      ['xdg-open', [url]] as const;
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {}); // missing launcher (e.g. headless) — ignore
    child.unref();
    return true;
  } catch {
    return false;
  }
}
