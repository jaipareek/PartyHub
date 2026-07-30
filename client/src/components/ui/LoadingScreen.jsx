import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./LoadingScreen.css";

const WORDS = ["Discover", "Book", "Vibe"];
const DURATION_MS = 2700;

function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  // Cycle words every 900ms
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // requestAnimationFrame counter 000→100
  const animate = useCallback(
    (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const newCount = Math.floor(progress * 100);

      setCount(newCount);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Trigger exit animation, then call onComplete
        setExiting(true);
        setTimeout(() => {
          onComplete();
        }, 450);
      }
    },
    [onComplete]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return (
    <div className={`loading-screen${exiting ? " exiting" : ""}`}>
      {/* Subtle grid overlay */}
      <div className="loading-grid" />

      {/* Top-left label */}
      <motion.div
        className="loading-label"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        AfterDark
      </motion.div>

      {/* Center — Rotating words */}
      <div className="loading-words">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            className="loading-word"
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {WORDS[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Bottom-right counter */}
      <div className="loading-counter">
        {String(count).padStart(3, "0")}
      </div>

      {/* Bottom progress bar */}
      <div className="loading-progress-track">
        <div
          className="loading-progress-fill accent-gradient"
          style={{ transform: `scaleX(${count / 100})` }}
        />
      </div>
    </div>
  );
}

export default LoadingScreen;
