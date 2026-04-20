import { useState, useCallback, useLayoutEffect, useRef } from "react";

export function useTabScroll(activeTab: string) {
  const tabStripScrollRef = useRef<HTMLDivElement>(null);
  const [tabStripScroll, setTabStripScroll] = useState({
    overflow: false,
    canLeft: false,
    canRight: false,
  });

  const refreshTabStripScroll = useCallback(() => {
    const el = tabStripScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setTabStripScroll({
      overflow,
      canLeft: overflow && scrollLeft > 2,
      canRight: overflow && scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useLayoutEffect(() => {
    const el = tabStripScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => refreshTabStripScroll());
    ro.observe(el);
    el.addEventListener("scroll", refreshTabStripScroll, { passive: true });
    window.addEventListener("resize", refreshTabStripScroll);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", refreshTabStripScroll);
      window.removeEventListener("resize", refreshTabStripScroll);
    };
  }, [refreshTabStripScroll]);

  useLayoutEffect(() => {
    refreshTabStripScroll();
    const root = tabStripScrollRef.current;
    if (!root) return;
    const id = requestAnimationFrame(() => {
      const activeEl = root.querySelector("[data-active]");
      if (activeEl instanceof HTMLElement) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
      refreshTabStripScroll();
    });
    return () => cancelAnimationFrame(id);
  }, [activeTab, refreshTabStripScroll]);

  const scrollTabStrip = useCallback((direction: -1 | 1) => {
    const el = tabStripScrollRef.current;
    if (!el) return;
    const delta = Math.max(180, Math.floor(el.clientWidth * 0.55));
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  }, []);

  return {
    tabStripScrollRef,
    tabStripScroll,
    scrollTabStrip,
    refreshTabStripScroll,
  };
}
