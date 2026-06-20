"use client";

import { FootballBall } from "@/components/graphics/FootballBall";

const balls = [
  { size: 48, top: "12%", left: "8%", delay: "0s", duration: "6s" },
  { size: 32, top: "25%", right: "10%", delay: "1.5s", duration: "7s" },
  { size: 56, bottom: "20%", left: "15%", delay: "0.8s", duration: "8s" },
  { size: 28, top: "45%", right: "6%", delay: "2s", duration: "5s" },
  { size: 40, bottom: "35%", right: "18%", delay: "1s", duration: "6.5s" },
];

export function FloatingFootballs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {balls.map((ball, i) => (
        <div
          key={i}
          className="absolute opacity-[0.12] animate-float-ball"
          style={{
            top: ball.top,
            left: ball.left,
            right: ball.right,
            bottom: ball.bottom,
            animationDelay: ball.delay,
            animationDuration: ball.duration,
          }}
        >
          <FootballBall size={ball.size} />
        </div>
      ))}
    </div>
  );
}
