/**
 * Cloudflare Turnstile (requirement.md §6.1, §17): a token proves a human before an account is
 * created. Rendered invisibly; Cloudflare shows a small check only when it needs one.
 */
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')));
    s.onerror = () => {
      loading = null;
      reject(new Error('Could not load the bot check. Check your connection and try again.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Gets one Turnstile token (single use). The widget lives in a fixed corner while it runs. */
export async function getTurnstileToken(siteKey: string): Promise<string> {
  const api = await loadScript();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:60';
  document.body.appendChild(host);
  try {
    return await new Promise<string>((resolve, reject) => {
      const id = api.render(host, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        callback: (token: string) => resolve(token),
        'error-callback': () => reject(new Error('The bot check failed. Please try again.')),
        'expired-callback': () => reject(new Error('The bot check expired. Please try again.')),
      });
      void id;
    });
  } finally {
    host.remove();
  }
}
