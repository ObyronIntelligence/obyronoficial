"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LiquidMetal } from "@paper-design/shaders-react";

interface VoiceOrbProps {
  audioLevel: number;
  isSpeaking: boolean;
}

export function VoiceOrb({ audioLevel, isSpeaking }: VoiceOrbProps) {
  const [speechMotion, setSpeechMotion] = useState(0);

  useEffect(() => {
    if (!isSpeaking) {
      setSpeechMotion(0);
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      const seconds = now / 1000;
      const primaryWave = (Math.sin(seconds * 6.8) + 1) / 2;
      const secondaryWave = (Math.sin(seconds * 12.6 + 0.9) + 1) / 2;
      setSpeechMotion(0.34 + primaryWave * 0.34 + secondaryWave * 0.12);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isSpeaking]);

  const boostedMic = Math.min(1, Math.pow(Math.max(audioLevel, 0) * 10, 0.72));
  const energy = Math.min(1, Math.max(boostedMic, speechMotion));
  const liquidScale = 1.08 + energy * 0.08;
  const speed = 0.92 + energy * 2.35;
  const distortion = 0.34 + energy * 0.42;
  const showWaves = energy > 0.06;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      <motion.div
        className="relative flex h-[360px] w-[360px] items-center justify-center md:h-[500px] md:w-[500px]"
        animate={{ scale: 1 + energy * 0.03 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
      >
        <AnimatePresence>
          {showWaves &&
            Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={`wave-${index}`}
                className="absolute rounded-full border border-[hsl(var(--brand)/0.12)]"
                style={{
                  width: `${90 + index * 8}%`,
                  height: `${90 + index * 8}%`,
                }}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{
                  scale: 1 + 0.03 + energy * 0.16,
                  opacity: [0.14, 0.08, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: Math.max(1.18 - energy * 0.26, 0.86),
                  repeat: Infinity,
                  delay: index * 0.18,
                  ease: "easeOut",
                }}
              />
            ))}
        </AnimatePresence>

        <motion.div
          className="relative h-[88%] w-[88%] overflow-hidden rounded-full shadow-[0_24px_100px_hsl(var(--brand)/0.12)]"
          animate={{
            scale: 1 + energy * 0.038,
          }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_26%,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.24)_14%,rgba(255,255,255,0.05)_34%,transparent_54%)] mix-blend-screen" />

          <LiquidMetal
            colorBack="#00000000"
            colorTint="#8b5cf6"
            repetition={4}
            softness={0.96}
            shiftRed={0.35}
            shiftBlue={0.58}
            distortion={distortion}
            contour={0.96}
            shape="circle"
            offsetX={0}
            offsetY={0}
            scale={liquidScale}
            rotation={0}
            speed={speed}
            style={{ width: "100%", height: "100%", opacity: 0.99 }}
          />

          <AnimatePresence>
            {showWaves &&
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={`inner-wave-${index}`}
                  className="absolute inset-[10%] rounded-full mix-blend-screen"
                  style={{
                    background:
                      "radial-gradient(circle, transparent 46%, rgba(255,255,255,0.15) 49%, rgba(255,255,255,0.02) 56%, transparent 62%)",
                    filter: "blur(1px)",
                  }}
                  initial={{ scale: 0.62, opacity: 0 }}
                  animate={{
                    scale: 0.74 + index * 0.1 + energy * 0.12,
                    opacity: [0, 0.16, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: Math.max(1.05 - energy * 0.22, 0.78),
                    repeat: Infinity,
                    delay: index * 0.16,
                    ease: "easeOut",
                  }}
                />
              ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default VoiceOrb;
