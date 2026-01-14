
// src/components/AuthCallback.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle, Smartphone, Monitor } from "lucide-react";
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';

/**
 * Handles Supabase email verify + password recovery callbacks for SPA apps that
 * do not use URL-based routing.
 *
 * MOBILE FIX: Added manual "Continue" button to prevent session loss from
 * auto-redirects happening before localStorage persists on mobile in-app browsers.
 *
 * Supported callback formats:
 * - PKCE:     https://site/?code=...&type=signup|recovery
 * - Implicit: https://site/#access_token=...&refresh_token=...&type=signup|recovery
 */
export default function AuthCallback({ onDone, onError }) {
  // States: "loading", "ready", "error", "mobile_warning"
  const [status, setStatus] = useState({ state: "loading", message: "Completing sign-in…" });
  const [nextScreen, setNextScreen] = useState("profile");
  const processedRef = useRef(false);

  // Detect if likely mobile in-app browser (WebView)
  const isMobileInAppBrowser = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // Common in-app browser indicators
    return (
      /FBAN|FBAV|Instagram|Twitter|Line|WhatsApp|Snapchat/i.test(ua) ||
      // Gmail app on iOS/Android
      /GSA|Gmail/i.test(ua) ||
      // Generic WebView indicators
      (/wv|WebView/i.test(ua) && /Mobile/i.test(ua))
    );
  }, []);

  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  const parsed = useMemo(() => {
    const url = new URL(window.location.href);
    const query = url.searchParams;

    const hash = (url.hash || "").startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);

    const code = query.get("code");
    const type = query.get("type") || hashParams.get("type") || null;

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    
    // Check for error params from Supabase
    const error = query.get("error") || hashParams.get("error");
    const errorDescription = query.get("error_description") || hashParams.get("error_description");

    return { code, type, accessToken, refreshToken, error, errorDescription };
  }, []);

  const cleanUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleContinue = () => {
    cleanUrl();
    onDone(nextScreen);
  };

  useEffect(() => {
    // Prevent double processing in React strict mode
    if (processedRef.current) return;
    processedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        // Check for error params first (e.g., expired link)
        if (parsed.error) {
          const errorMsg = parsed.errorDescription 
            ? decodeURIComponent(parsed.errorDescription).replace(/\+/g, ' ')
            : "The link is invalid or has expired.";
          setStatus({ state: "error", message: errorMsg });
          cleanUrl();
          return;
        }

        setStatus({ state: "loading", message: "Securing your session…" });

        // Try PKCE code exchange first
        if (parsed.code) {
          console.log("[AuthCallback] Exchanging PKCE code...");
          const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
          if (error) {
            console.error("[AuthCallback] Code exchange error:", error);
            // Check for specific PKCE errors that indicate cross-browser issue
            if (error.message?.includes('flow state') || error.message?.includes('PKCE')) {
              throw new Error(
                "This link was opened in a different browser than where you started. " +
                "Please open this link in your main browser (Safari/Chrome), or request a new link."
              );
            }
            throw error;
          }
        }

        // Fallback to implicit flow (hash fragment tokens)
        if (!parsed.code && parsed.accessToken && parsed.refreshToken) {
          console.log("[AuthCallback] Setting session from hash tokens...");
          const { error } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          });
          if (error) throw error;
        }

        // Small delay to ensure localStorage is written (critical for mobile)
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data?.session ?? null;
        const callbackType = (parsed.type || "").toLowerCase();

        if (cancelled) return;

        // Determine next screen
        let targetScreen = "profile";
        if (callbackType === "recovery") {
          targetScreen = "reset_password";
        }
        setNextScreen(targetScreen);

        // Success! But handle mobile differently
        if (session?.user) {
          // On mobile in-app browsers, show a "Continue" button instead of auto-redirect
          // This gives localStorage time to persist and shows a clear action
          if (isMobileInAppBrowser) {
            setStatus({ 
              state: "mobile_warning", 
              message: "You're viewing this in an email app. For the best experience, open this link in Safari or Chrome." 
            });
          } else if (isMobile) {
            // Mobile but main browser - still show continue button for safety
            setStatus({ state: "ready", message: "Authentication successful!" });
          } else {
            // Desktop - auto redirect after short delay
            setStatus({ state: "ready", message: "Success! Redirecting…" });
            setTimeout(() => {
              if (!cancelled) {
                cleanUrl();
                onDone(targetScreen);
              }
            }, 1000);
          }
          return;
        }

        // No session found
        setStatus({ state: "error", message: "Session not found. Please log in again." });
        cleanUrl();
        onError?.("Session not found after callback.");
      } catch (err) {
        if (cancelled) return;
        console.error("[AuthCallback] Error:", err);
        const message =
          err?.message ||
          "Could not complete authentication. Please try again from the login screen.";
        setStatus({ state: "error", message });
        cleanUrl();
        onError?.(message);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [parsed, onDone, onError, isMobile, isMobileInAppBrowser]);

  // --- ERROR STATE ---
  if (status.state === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{status.message}</p>
        <Button onClick={() => onDone("auth")}>Go to Login</Button>
      </div>
    );
  }

  // --- MOBILE IN-APP BROWSER WARNING ---
  if (status.state === "mobile_warning") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Almost There!</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Your account has been verified successfully!
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Tip:</strong> You're viewing this in an email app. For the best experience, 
            copy the link and open it in Safari or Chrome.
          </p>
        </div>
        <Button onClick={handleContinue} className="w-full max-w-xs mb-3">
          Continue Anyway
        </Button>
        <p className="text-xs text-muted-foreground">
          If you have issues, try logging in again from your main browser.
        </p>
      </div>
    );
  }

  // --- READY STATE (with Continue button for mobile) ---
  if (status.state === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Success!</h2>
        <p className="text-muted-foreground mb-6">{status.message}</p>
        {isMobile ? (
          <Button onClick={handleContinue} className="w-full max-w-xs">
            Continue to {nextScreen === "reset_password" ? "Reset Password" : "App"}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting...</span>
          </div>
        )}
      </div>
    );
  }

  // --- LOADING STATE ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <h2 className="text-2xl font-bold mb-2">Finishing up…</h2>
      <p className="text-muted-foreground">{status.message}</p>
    </div>
  );
}
