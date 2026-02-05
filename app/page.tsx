/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const DEFAULT_EXPO_URL = "exp://exp.host/@dvargas92495/squad-party";
const STORAGE_KEY = "squadparty_expo_url";

export default function Home() {
  const [expoUrl, setExpoUrl] = useState(DEFAULT_EXPO_URL);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params for dynamic URL
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");

    if (urlParam) {
      localStorage.setItem(STORAGE_KEY, urlParam);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      setExpoUrl(urlParam);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setExpoUrl(stored);
    }
  }, []);

  useEffect(() => {
    QRCode.toDataURL(expoUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#FFFFFF",
        light: "#16213E",
      },
    }).then(setQrDataUrl);
  }, [expoUrl]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-coral to-yellow bg-clip-text text-transparent">
          Squad Party
        </h1>
        <p className="text-text-secondary text-lg mb-12">
          Party games with your squad
        </p>

        <div className="bg-charcoal rounded-2xl p-6 mb-6">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-lg"
            />
          )}
          <p className="text-text-secondary text-sm mt-3">Scan with Expo Go</p>
        </div>

        <a
          href={expoUrl}
          className="inline-block bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-lg px-12 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] active:opacity-90 transition-all"
        >
          Open in Expo Go
        </a>

        <div className="mt-8 text-text-secondary text-sm">
          <p>Don&apos;t have Expo Go?</p>
          <p className="mt-1">
            <a
              href="https://apps.apple.com/app/expo-go/id982107779"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow hover:underline"
            >
              iOS App Store
            </a>
            {" · "}
            <a
              href="https://play.google.com/store/apps/details?id=host.exp.exponent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow hover:underline"
            >
              Google Play
            </a>
          </p>
        </div>

        <div className="mt-6 p-3 bg-white/5 rounded-lg">
          <code className="text-xs text-text-secondary break-all">
            {expoUrl}
          </code>
        </div>
      </div>
    </main>
  );
}
