"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { SplashScreen } from "@/components/layout/SplashScreen";

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function SignInMicrosoftButton() {
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    
    // Delay the splash screen overlay and the sign-in redirect
    // so the user can see the button's internal animation.
    setTimeout(() => setShowSplash(true), 600);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await signIn("azure-ad");
    } catch {
      setLoading(false);
      setShowSplash(false);
    }
  }

  return (
    <>
      {/* Full-screen splash overlay during OAuth redirect */}
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="relative flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2.5"
            >
              <Loader2 className="size-4 animate-spin text-[#E87722]" />
              <span className="text-neutral-500">Signing in...</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-3"
            >
              <MicrosoftLogo />
              <span>Sign in with Microsoft</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
