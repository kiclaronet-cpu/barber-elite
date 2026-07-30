"use client";

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) =>
          console.log("SW registered:", reg.scope)
        )
        .catch((err) =>
          console.error("SW registration failed:", err)
        );
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowInstall(true);
    };

    const handleInstalled = () => {
      setShowInstall(false);
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (installed) return null;

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-lg">
        <p className="text-sm text-zinc-200">
          Instale o <span className="font-semibold text-amber-400">Barber Elite</span> para melhor experi&ecirc;ncia
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInstall(false)}
            className="rounded px-3 py-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Agora n&atilde;o
          </button>
          <button
            onClick={handleInstallClick}
            className="rounded bg-amber-500 px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-amber-400"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}
