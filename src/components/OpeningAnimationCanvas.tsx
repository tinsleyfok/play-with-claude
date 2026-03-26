import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/** Figma Feed 402×874 — absolute dot centers in frame space */
const FEED_W = 402;
const FEED_H = 874;
const DOT_A = { x: 183.645 / FEED_W, y: 402.89 / FEED_H };
const DOT_B = { x: 304.115 / FEED_W, y: 470.06 / FEED_H };
const ORANGE = "#FF6030";

/** Each cycle: noise → gather → hold → fade → repeat */
const NOISE_DURATION_MS = 1000;
const GATHER_DURATION_MS = 1000;
const HOLD_DURATION_MS = 700;
/** Fade Gist + canvas together after hold */
const FADE_OUT_MS = 1100;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetIdx: 0 | 1;
  sx?: number;
  sy?: number;
  captured: boolean;
};

function figmaTargets(w: number, h: number) {
  return [
    { x: DOT_A.x * w, y: DOT_A.y * h },
    { x: DOT_B.x * w, y: DOT_B.y * h },
  ];
}

/** ~9px radius at 402pt width — small “ember” dots like the original */
function dotMaxRadiusPx(canvasW: number) {
  return Math.max(2.2, (9 / FEED_W) * canvasW);
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function initParticles(count: number, w: number, h: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2.4,
      vy: (Math.random() - 0.5) * 2.4,
      targetIdx: (i % 2) as 0 | 1,
      captured: false,
    });
  }
  return out;
}

function drawStaticDots(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = dotMaxRadiusPx(w);
  for (const t of figmaTargets(w, h)) {
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function particleCountForArea(w: number, h: number) {
  return Math.min(720, Math.max(160, Math.floor((w * h) / 3800)));
}

function easeInQuad(t: number) {
  return t * t;
}

type Props = {
  isDark: boolean;
  /** Wrapper around Gist + canvas — opacity driven here during fade-out */
  contentLayerRef?: RefObject<HTMLDivElement | null>;
};

export function OpeningAnimationCanvas({ isDark, contentLayerRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const cwRef = useRef(0);
  const chRef = useRef(0);
  const glRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glInit = canvas.getContext("2d");
    if (!glInit) return;
    glRef.current = glInit;

    const cnv = canvas;
    const wpr = wrap;
    const particleRgb = isDark ? "235, 235, 235" : "29, 29, 27";

    function applyCanvasSize(w: number, h: number) {
      const g = glRef.current;
      if (!g) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cnv.width = Math.floor(w * dpr);
      cnv.height = Math.floor(h * dpr);
      cnv.style.width = `${w}px`;
      cnv.style.height = `${h}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      cwRef.current = w;
      chRef.current = h;
    }

    function ensureSize(): { w: number; h: number } {
      const w = Math.max(1, Math.floor(wpr.clientWidth));
      const h = Math.max(1, Math.floor(wpr.clientHeight));
      if (w !== cwRef.current || h !== chRef.current || cnv.width === 0) {
        applyCanvasSize(w, h);
      }
      return { w: cwRef.current, h: chRef.current };
    }

    function restartAnimation() {
      const { w, h } = ensureSize();
      const n = particleCountForArea(w, h);
      particlesRef.current = initParticles(n, w, h);
      startRef.current = performance.now();
      lastRef.current = startRef.current;
      contentLayerRef?.current?.style.setProperty("opacity", "1");
    }

    restartAnimation();

    if (reduced) {
      const { w, h } = ensureSize();
      const g = glRef.current;
      if (g) {
        g.clearRect(0, 0, w, h);
        drawStaticDots(g, w, h);
      }
      return () => {
        glRef.current = null;
      };
    }

    function loop(now: number) {
      const wrapEl = wrapRef.current;
      const c = canvasRef.current;
      const gl = glRef.current;
      if (!wrapEl || !c || !gl) return;

      const { w: cw, h: ch } = ensureSize();

      const dt = Math.min(32, now - lastRef.current);
      lastRef.current = now;

      const cycleMs =
        NOISE_DURATION_MS + GATHER_DURATION_MS + HOLD_DURATION_MS + FADE_OUT_MS;
      let elapsed = now - startRef.current;
      if (elapsed >= cycleMs) {
        restartAnimation();
        elapsed = now - startRef.current;
      }

      const noiseT = Math.min(1, elapsed / NOISE_DURATION_MS);
      const afterNoise = elapsed - NOISE_DURATION_MS;
      const gatherT = afterNoise <= 0 ? 0 : Math.min(1, afterNoise / GATHER_DURATION_MS);
      const holdEnd = NOISE_DURATION_MS + GATHER_DURATION_MS + HOLD_DURATION_MS;
      const sequenceEnd = cycleMs;
      const finished = elapsed >= holdEnd;

      const fadeT =
        elapsed <= holdEnd ? 0 : Math.min(1, (elapsed - holdEnd) / FADE_OUT_MS);
      const layerOpacity = 1 - easeInQuad(fadeT);
      contentLayerRef?.current?.style.setProperty("opacity", String(layerOpacity));

      gl.clearRect(0, 0, cw, ch);

      const targets = figmaTargets(cw, ch);
      const noiseFade = noiseT < 0.12 ? noiseT / 0.12 : 1;

      if (!finished) {
        const parts = particlesRef.current;
        for (const p of parts) {
          if (gatherT <= 0) {
            const t = dt / 16;
            p.x += p.vx * t;
            p.y += p.vy * t;
            p.vx += (Math.random() - 0.5) * 0.12;
            p.vy += (Math.random() - 0.5) * 0.12;
            p.vx *= 0.992;
            p.vy *= 0.992;
            const margin = 2;
            if (p.x < margin) {
              p.x = margin;
              p.vx *= -0.82;
            }
            if (p.x > cw - margin) {
              p.x = cw - margin;
              p.vx *= -0.82;
            }
            if (p.y < margin) {
              p.y = margin;
              p.vy *= -0.82;
            }
            if (p.y > ch - margin) {
              p.y = ch - margin;
              p.vy *= -0.82;
            }
          } else {
            if (!p.captured) {
              p.sx = p.x;
              p.sy = p.y;
              p.captured = true;
            }
            const tx = targets[p.targetIdx].x;
            const ty = targets[p.targetIdx].y;
            const e = easeOutCubic(gatherT);
            p.x = p.sx! + (tx - p.sx!) * e;
            p.y = p.sy! + (ty - p.sy!) * e;
          }

          let alpha = 0.38 * noiseFade;
          if (gatherT > 0) alpha *= 1 - gatherT * 0.4;
          gl.fillStyle = `rgba(${particleRgb}, ${alpha})`;
          gl.beginPath();
          gl.arc(p.x, p.y, 0.85, 0, Math.PI * 2);
          gl.fill();
        }
      }

      const dotR =
        elapsed < NOISE_DURATION_MS
          ? 0
          : easeOutCubic(gatherT) * dotMaxRadiusPx(cw);

      if (elapsed < sequenceEnd && dotR > 0) {
        for (const t of targets) {
          gl.fillStyle = ORANGE;
          gl.beginPath();
          gl.arc(t.x, t.y, dotR, 0, Math.PI * 2);
          gl.fill();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      restartAnimation();
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      glRef.current = null;
    };
  }, [isDark]);

  return (
    <div ref={wrapRef} className="absolute inset-0 z-[1] min-h-0 pointer-events-none">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
