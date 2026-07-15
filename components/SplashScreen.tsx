"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
  type: "login" | "logout" | null;
}

export default function SplashScreen({ isVisible, type }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 0, backgroundColor: "#FAFAFA" }}
          animate={{ opacity: 1, backgroundColor: "#FFFFFF" }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Subtle radial light behind the logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] bg-indigo-50/60 rounded-full blur-[80px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: [0.8, 1.03, 1.0], y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              scale: { times: [0, 0.7, 1], duration: 0.8, ease: "easeInOut" }
            }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            {/* Soft shadow applied directly to the image container */}
            <div className="relative drop-shadow-2xl">
              <Image 
                src="/Symbol.png" 
                alt="Logo" 
                width={140} 
                height={140} 
                className="object-contain" 
                priority 
              />
            </div>
            
            {type === "logout" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-sm font-medium text-slate-400 tracking-wider"
              >
                Logging out...
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
