import { useState, useLayoutEffect, useRef } from "react";

export function useEditorChromeHeight() {
  const editorChromeRef = useRef<HTMLDivElement>(null);
  const [editorChromeHeight, setEditorChromeHeight] = useState(0);

  useLayoutEffect(() => {
    const el = editorChromeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setEditorChromeHeight(el.getBoundingClientRect().height);
    });
    ro.observe(el);
    setEditorChromeHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  return { editorChromeRef, editorChromeHeight };
}
