"use client";

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosDismissed, setIosDismissed] = useState(false);

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

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (iOS) {
      setIsIOS(true);
      setShowInstall(true);
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

  const handleDismiss = () => {
    setShowInstall(false);
    if (isIOS) setIosDismissed(true);
  };

  if (installed || (isIOS && iosDismissed)) return null;

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-lg">
        <p className="text-sm text-zinc-200">
          {isIOS ? (
            <>
              Toque em <span className="font-semibold text-amber-400">Compartilhar</span>{" "}
              <svg className="inline w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v13M7 8l5-5 5 5M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>{" "}
              e em <span className="font-semibold text-amber-400">Adicionar à Tela de Início</span> para instalar
            </>
          ) : (
            <>
              Instale o <span className="font-semibold text-amber-400">Barber Elite</span> para melhor experi&ecirc;ncia
            </>
          )}
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="rounded px-3 py-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Agora n&atilde;o
          </button>
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="rounded bg-amber-500 px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-amber-400"
            >
              Instalar
            </button>
          )}
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
