"use client";
import { useEffect, useRef } from "react";

export default function Stars() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("div");
      const size = Math.random() * 2 + 1;
      const duration = 2 + Math.random() * 3;
      s.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        background:white;border-radius:50%;
        top:${Math.random() * 100}%;
        left:${Math.random() * 100}%;
        opacity:0.1;
        animation:twinkle ${duration}s ease-in-out infinite alternate;
        animation-delay:${Math.random() * 4}s;
      `;
      container.appendChild(s);
    }
    return () => { container.innerHTML = ""; };
  }, []);

  return (
    <>
      <style>{`@keyframes twinkle{from{opacity:.1}to{opacity:.7}}`}</style>
      <div ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
    </>
  );
}
