type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(value: boolean) => void>();

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function notify() {
  listeners.forEach((listener) => listener(canInstall()));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    if (isIOS()) return;
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function canInstall() {
  return Boolean(deferredPrompt);
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  return choice.outcome === "accepted";
}

export function listenInstallPrompt(callback: (value: boolean) => void) {
  listeners.add(callback);
  callback(canInstall());
  return () => {
    listeners.delete(callback);
  };
}
