"use client";

import { useRef, useEffect } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1.4, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: value,
      duration,
      ease: "power1.out",
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString();
      },
    });

    return () => { tween.kill(); };
  }, [value, duration]);

  return <span ref={ref} className={className}>0</span>;
}
