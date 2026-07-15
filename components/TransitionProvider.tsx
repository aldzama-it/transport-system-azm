"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import SplashScreen from "./SplashScreen";

type TransitionType = "login" | "logout" | null;

interface TransitionContextType {
  triggerSplash: (type: TransitionType, callback: () => void) => void;
  isSplashing: boolean;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isSplashing, setIsSplashing] = useState(false);
  const [splashType, setSplashType] = useState<TransitionType>(null);

  const triggerSplash = (type: TransitionType, callback: () => void) => {
    setSplashType(type);
    setIsSplashing(true);
    
    // Splash screen animation timeline
    setTimeout(() => {
      callback(); // Execute the actual navigation or signout
      
      setTimeout(() => {
        setIsSplashing(false);
      }, 500); // 500ms delay to allow Next.js route transition before hiding splash
    }, 1200); // Keep logo visible before navigating
  };

  return (
    <TransitionContext.Provider value={{ triggerSplash, isSplashing }}>
      {children}
      <SplashScreen isVisible={isSplashing} type={splashType} />
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
}
