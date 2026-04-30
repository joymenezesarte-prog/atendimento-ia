"use client";

import { useEffect, useState } from "react";

export default function MouseGlow() {
  const [pos, setPos] = useState({ x: -400, y: -400 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [visible]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Primary glow - strong */}
      <div
        style={{
          position: "absolute",
          left: pos.x - 250,
          top: pos.y - 250,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.08) 30%, rgba(34,197,94,0.02) 55%, transparent 70%)",
          transition: visible ? "left 0.1s ease-out, top 0.1s ease-out, opacity 0.3s ease" : "opacity 0.5s ease",
          opacity: visible ? 1 : 0,
          willChange: "left, top",
        }}
      />
      {/* Secondary glow - wider, softer */}
      <div
        style={{
          position: "absolute",
          left: pos.x - 400,
          top: pos.y - 400,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 40%, transparent 65%)",
          transition: visible ? "left 0.2s ease-out, top 0.2s ease-out, opacity 0.4s ease" : "opacity 0.6s ease",
          opacity: visible ? 1 : 0,
          willChange: "left, top",
        }}
      />
    </div>
  );
}
