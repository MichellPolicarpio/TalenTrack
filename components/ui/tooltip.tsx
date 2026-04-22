"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  className,
  delay = 0.2,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  if (disabled) return <>{children}</>;

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute bottom-full left-1/2 z-[200] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-xl ring-1 ring-white/10",
              className
            )}
          >
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-neutral-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
