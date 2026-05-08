"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MIN_CURSOR_WIDTH = 768;
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, summary, .motion-press, .motion-3d-card, [data-cursor="interactive"]';
const TEXT_SELECTOR = 'input, textarea, [contenteditable="true"]';

export function VyntroCursor() {
  const coreRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(false);
  const textRef = useRef(false);
  const readyRef = useRef(false);
  const enabled = useCursorEnabled();
  const [active, setActive] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("vyntro-custom-cursor");
      readyRef.current = false;
      return;
    }

    const core = coreRef.current;
    const ring = ringRef.current;

    if (!core || !ring) {
      return;
    }

    document.documentElement.classList.add("vyntro-custom-cursor");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let frameId = 0;

    const updatePointerState = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const nextActive = Boolean(element?.closest(INTERACTIVE_SELECTOR));
      const nextText = Boolean(element?.closest(TEXT_SELECTOR));

      if (nextActive !== activeRef.current) {
        activeRef.current = nextActive;
        setActive(nextActive);
      }

      if (nextText !== textRef.current) {
        textRef.current = nextText;
        setTextMode(nextText);
      }
    };

    const moveCore = () => {
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;
      core.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      frameId = window.requestAnimationFrame(moveCore);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }
      updatePointerState(event.target);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        readyRef.current = false;
        setReady(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    frameId = window.requestAnimationFrame(moveCore);

    return () => {
      document.documentElement.classList.remove("vyntro-custom-cursor");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`vyntro-cursor ${ready ? "is-ready" : ""} ${active ? "is-active" : ""} ${
        textMode ? "is-text" : ""
      }`}
    >
      <div ref={ringRef} className="vyntro-cursor-ring" />
      <div ref={coreRef} className="vyntro-cursor-core">
        <span />
      </div>
    </div>
  );
}

function useCursorEnabled() {
  return useSyncExternalStore(subscribeCursorPreferences, getCursorEnabledSnapshot, () => false);
}

function subscribeCursorPreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const finePointer = window.matchMedia(FINE_POINTER_QUERY);
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  finePointer.addEventListener("change", onStoreChange);
  reducedMotion.addEventListener("change", onStoreChange);
  window.addEventListener("resize", onStoreChange);

  return () => {
    finePointer.removeEventListener("change", onStoreChange);
    reducedMotion.removeEventListener("change", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}

function getCursorEnabledSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.innerWidth >= MIN_CURSOR_WIDTH &&
    window.matchMedia(FINE_POINTER_QUERY).matches &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}
