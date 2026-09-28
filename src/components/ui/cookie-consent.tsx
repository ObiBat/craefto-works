"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_COOKIE_NAME = "craefto_cookie_consent";
const CONSENT_VERSION = "1.0";

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

// Saved preferences for the current consent version, if any (client only).
function readSavedPreferences(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_COOKIE_NAME) || "null");
    return saved?.version === CONSENT_VERSION ? saved.preferences : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => readSavedPreferences() ?? defaultPreferences);

  // Check for existing consent on mount
  // No consent for the current version yet: ask, after a short delay.
  useEffect(() => {
    if (readSavedPreferences()) return;
    const timer = setTimeout(() => setShowBanner(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for openCookiePreferences event from footer
  useEffect(() => {
    const handleOpenPreferences = () => {
      setShowPreferences(true);
      setShowBanner(false);
    };

    window.addEventListener("openCookiePreferences", handleOpenPreferences);
    return () => window.removeEventListener("openCookiePreferences", handleOpenPreferences);
  }, []);

  const saveConsent = useCallback((consent: ConsentPreferences) => {
    const consentData = {
      version: CONSENT_VERSION,
      preferences: consent,
      timestamp: Date.now(),
    };

    localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(consentData));

    // Set cookie for potential server-side access
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consentData))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    setPreferences(consent);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  }, [saveConsent]);

  const saveCurrentPreferences = useCallback(() => {
    saveConsent(preferences);
  }, [preferences, saveConsent]);

  return (
    <>
      {/* Cookie Banner */}
      <AnimatePresence>
        {showBanner && !showPreferences && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
            role="dialog"
            aria-label="Cookie consent"
            aria-modal="true"
          >
            <div className="max-w-4xl mx-auto bg-[hsl(var(--color-background))] rounded-2xl shadow-2xl border border-[hsl(var(--color-border))] p-6 sm:p-8">
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">We value your privacy</h2>
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                    We use cookies to enhance your browsing experience and analyze site traffic.
                    You can choose to accept all cookies or customize your preferences.{" "}
                    <Link href="/privacy" className="underline hover:text-[hsl(var(--color-foreground))]">
                      Read our Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Buttons - Visual Parity (GDPR 2025 requirement) */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))] rounded-full font-medium text-sm hover:bg-[hsl(var(--color-border))] transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => {
                      setShowPreferences(true);
                      setShowBanner(false);
                    }}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))] rounded-full font-medium text-sm hover:bg-[hsl(var(--color-border))] transition-colors"
                  >
                    Customize
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {showPreferences && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPreferences(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-lg sm:w-full max-h-[90vh] overflow-hidden"
              role="dialog"
              aria-label="Cookie preferences"
              aria-modal="true"
            >
              <div className="bg-[hsl(var(--color-background))] rounded-2xl shadow-2xl border border-[hsl(var(--color-border))] h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[hsl(var(--color-border))]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Cookie Preferences</h2>
                    <button
                      onClick={() => setShowPreferences(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[hsl(var(--color-background-muted))] transition-colors"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-2">
                    Manage your cookie preferences. Necessary cookies cannot be disabled as they are essential for the website to function.
                  </p>
                </div>

                {/* Cookie Categories */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Necessary */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">Strictly Necessary</h3>
                        <span className="text-xs px-2 py-0.5 bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))] rounded-full">
                          Always on
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                        Essential for the website to function properly. These cookies enable basic features like page navigation and secure areas.
                      </p>
                    </div>
                    <div className="shrink-0 mt-1">
                      <div className="w-12 h-7 bg-[hsl(var(--color-accent))] rounded-full relative opacity-60 cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Functional */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Functional</h3>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                        Remember your preferences and settings to provide a more personalized experience.
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, functional: !p.functional }))}
                      className="shrink-0 mt-1"
                      role="switch"
                      aria-checked={preferences.functional}
                    >
                      <div className={`w-12 h-7 rounded-full relative transition-colors ${
                        preferences.functional ? "bg-[hsl(var(--color-accent))]" : "bg-[hsl(var(--color-border-strong))]"
                      }`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.functional ? "right-1" : "left-1"
                        }`} />
                      </div>
                    </button>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Analytics</h3>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                        Help us understand how visitors interact with our website by collecting anonymous usage data.
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                      className="shrink-0 mt-1"
                      role="switch"
                      aria-checked={preferences.analytics}
                    >
                      <div className={`w-12 h-7 rounded-full relative transition-colors ${
                        preferences.analytics ? "bg-[hsl(var(--color-accent))]" : "bg-[hsl(var(--color-border-strong))]"
                      }`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.analytics ? "right-1" : "left-1"
                        }`} />
                      </div>
                    </button>
                  </div>

                  {/* Marketing */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Marketing</h3>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                        Used to deliver personalized advertisements and measure the effectiveness of ad campaigns.
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                      className="shrink-0 mt-1"
                      role="switch"
                      aria-checked={preferences.marketing}
                    >
                      <div className={`w-12 h-7 rounded-full relative transition-colors ${
                        preferences.marketing ? "bg-[hsl(var(--color-accent))]" : "bg-[hsl(var(--color-border-strong))]"
                      }`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.marketing ? "right-1" : "left-1"
                        }`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[hsl(var(--color-border))] flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))] rounded-full font-medium text-sm hover:bg-[hsl(var(--color-border))] transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={saveCurrentPreferences}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
