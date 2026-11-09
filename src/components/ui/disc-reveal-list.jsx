"use client";

/**
 * Disc Reveal List. Designed & built by Aakash Mehra.
 * Hover a row: the other rows dim, the title scatters, and its discs or
 * photos spread across the freed space.
 */

import { ArrowUpRight } from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Coral, cobalt, mustard, sage, plum. Each disc takes the next one. */
const HUES = ["#ff6f59", "#2f5bea", "#e2a417", "#7fa37a", "#8e4585"];
const PAD = 16;

/** Largest item width (height = width * aspect) that fits a band. */
const fit = (b, aspect) =>
  Math.min(
    b.bleed ? (b.width - PAD) / 0.55 : b.width - 2 * PAD,
    (b.height - 2 * PAD) / aspect,
  );

/**
 * Places n items in the free bands. One item: as big as the roomiest band
 * allows, centred in it. Several: shared out across bands by area, then each
 * band is cut into cells along its long side and every item is jittered in
 * size, position and tilt inside its cell (seeded, so it's stable).
 */
function layout(n, photo, bands, spots) {
  const aspect = photo ? 1.22 : 1;
  const free = bands.filter((b) => fit(b, aspect) >= 90);
  if (!free.length) return [];

  if (n === 1) {
    const near = spots.filter((s) => fit(s, aspect) >= 90);
    const b = (near.length ? near : free).reduce((a, c) =>
      fit(c, aspect) > fit(a, aspect) ? c : a,
    );
    const width = Math.min(fit(b, aspect), 440);
    return [
      {
        left: b.bleed ? b.left + PAD : b.left + (b.width - width) / 2,
        top: b.top + (b.height - width * aspect) / 2,
        width,
        rotate: 0,
      },
    ];
  }

  const area = (b) => b.width * b.height;
  const total = free.reduce((s, b) => s + area(b), 0);
  const groups = free.map(() => []);
  for (let i = 0; i < n; i++) {
    let at = ((i + 0.5) / n) * total;
    let k = 0;
    while (k < free.length - 1 && at > area(free[k])) at -= area(free[k++]);
    groups[k].push(i);
  }

  const slots = [];
  groups.forEach((ids, k) => {
    const b = free[k];
    const wide = b.width >= b.height;
    ids.forEach((i, c) => {
      const step = (wide ? b.width : b.height) / ids.length;
      const cell = wide
        ? { ...b, left: b.left + c * step, width: step }
        : { ...b, top: b.top + c * step, height: step };
      const width =
        Math.min(fit(cell, aspect), photo ? 300 : 210) *
        (0.86 + 0.14 * rand(i, 3)) *
        (photo ? 0.86 : 1);
      const slackX = cell.width - 2 * PAD - width;
      const slackY = cell.height - 2 * PAD - width * aspect;
      const alt = (c % 2 ? 0.75 : 0.25) + 0.25 * rand(i, 5);
      const mid = 0.5 + 0.5 * rand(i, 4);
      slots[i] = {
        left: cell.left + PAD + slackX * (wide ? mid : alt),
        top: cell.top + PAD + slackY * (wide ? alt : mid),
        width,
        rotate: rand(i, 6) * (photo ? 9 : 14),
      };
    });
  });
  return slots;
}

/** Deterministic pseudo-random in [-1, 1) from an index. */
function rand(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function DiscRevealList({ items, className, children }) {
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [active, setActive] = useState(null);
  const reduce = useReducedMotion();

  const activate = (index) => {
    const root = rootRef.current;
    const list = listRef.current;
    if (!root || !list) return;
    const box = root.getBoundingClientRect();
    const rows = [...list.children];
    const run = (from, to) => {
      const rs = rows.slice(from, to);
      const text = rs.flatMap((r) =>
        [...r.querySelectorAll("[data-text]")].map((t) =>
          t.getBoundingClientRect(),
        ),
      );
      const last = rs[rs.length - 1];
      const top = rs[0].offsetTop;
      return {
        top,
        bottom: last.offsetTop + last.offsetHeight,
        l: Math.min(...text.map((t) => t.left)) - box.left - PAD,
        r: Math.max(...text.map((t) => t.right)) - box.left + PAD,
      };
    };
    const sides = (from, to) => {
      if (from >= to) return [];
      const { top, bottom, l, r } = run(from, to);
      const height = bottom - top;
      return [
        { top, left: 0, width: l, height },
        { top, left: r, width: box.width - r, height },
      ];
    };

    const arrow = rows[index].querySelector("svg").getBoundingClientRect();
    const arrowLeft = arrow.left - box.left - PAD;
    const arrowTop = arrow.top - box.top - PAD;
    const arrowBottom = arrow.bottom - box.top + PAD;
    const spots = [];
    for (let a = Math.max(0, index - 1); a <= index; a++) {
      for (let b = index; b <= Math.min(rows.length - 1, index + 1); b++) {
        const { top, bottom, r } = run(a, b + 1);
        spots.push({ top, left: r, width: arrowLeft - r, height: bottom - top });
        if (a === index)
          spots.push({
            top: arrowBottom,
            left: r,
            width: box.width - r,
            height: bottom - arrowBottom,
            bleed: true,
          });
        if (b === index)
          spots.push({
            top,
            left: r,
            width: box.width - r,
            height: arrowTop - top,
            bleed: true,
          });
      }
    }

    const above = Math.min(Math.max(box.top, 0), 320);
    const below = Math.min(Math.max(window.innerHeight - box.bottom, 0), 320);
    setActive({
      index,
      spots,
      bands: [
        { top: -above, left: 0, width: box.width, height: above },
        ...sides(0, index),
        ...sides(index + 1, rows.length),
        { top: box.height, left: 0, width: box.width, height: below },
      ],
    });
  };

  const current = active ? items[active.index] : null;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className={cn("relative w-full overflow-x-clip", className)}
      >
        <ul
          ref={listRef}
          onMouseLeave={() => setActive(null)}
          className={cn(
            "relative z-10 border-t transition-colors duration-300",
            active ? "border-transparent" : "border-[#d9cfbf]",
          )}
        >
          {items.map((item, i) => {
            const isActive = active?.index === i;
            const dimmed = active !== null && !isActive;
            return (
              <li
                key={item.title}
                className={cn(
                  "border-b transition-colors duration-300",
                  active ? "border-transparent" : "border-[#d9cfbf]",
                )}
              >
                <a
                  href={item.href ?? "#"}
                  onMouseEnter={() => activate(i)}
                  onFocus={() => activate(i)}
                  onBlur={() => setActive(null)}
                  className="relative flex items-center justify-center px-4 py-6 outline-none focus-visible:bg-black/[0.03] md:px-10 md:py-10"
                >
                  <motion.div
                    className="min-w-0 px-8 text-center md:px-24"
                    animate={{
                      opacity: dimmed ? 0.4 : 1,
                      scale: dimmed ? 0.98 : isActive ? 1.02 : 1,
                    }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 18 }
                    }
                  >
                    <h2
                      className={cn(
                        "text-5xl leading-[0.95] font-bold tracking-tighter transition-colors duration-300 md:text-6xl lg:text-8xl",
                        isActive ? "text-[#1c1814]" : "text-[#8f8273]",
                      )}
                    >
                      <span className="sr-only">{item.title}</span>
                      <ScatterText text={item.title} active={isActive} />
                    </h2>
                    <p
                      className={cn(
                        "mt-2 text-sm transition-colors duration-300 md:mt-3 md:text-lg",
                        isActive ? "text-[#4a4036]" : "text-[#6f6355]",
                      )}
                    >
                      <span data-text>{item.subtitle}</span>
                    </p>
                  </motion.div>

                  <ArrowUpRight
                    aria-hidden
                    strokeWidth={1.5}
                    className={cn(
                      "absolute right-4 size-7 text-[#1c1814] transition-all duration-300 md:right-10 md:size-12",
                      isActive
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0",
                    )}
                  />
                </a>
              </li>
            );
          })}
        </ul>
        {children}

        <div className="pointer-events-none absolute inset-0">
          <AnimatePresence>
            {active &&
              current &&
              layout(
                current.media.images.length,
                current.media.kind === "photos",
                active.bands,
                active.spots,
              ).map((slot, i) => (
                <motion.div
                  key={`${active.index}-${i}`}
                  className="absolute"
                  style={{
                    left: slot.left,
                    top: slot.top,
                    width: slot.width,
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0.4,
                    y: 40,
                    rotate: slot.rotate - 15,
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: slot.rotate }}
                  exit={{
                    opacity: [1, 1, 0],
                    scale: [1, 1.08, 0.3],
                    y: [0, -6, 24],
                    transition: reduce
                      ? { duration: 0 }
                      : { duration: 0.28, times: [0, 0.35, 1], ease: "easeIn" },
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 320,
                          damping: 14,
                          delay: i * 0.035,
                          opacity: { duration: 0.15, delay: i * 0.035 },
                        }
                  }
                >
                  {current.media.kind === "photos" ? (
                    <Polaroid src={current.media.images[i]} />
                  ) : (
                    <Disc
                      src={current.media.images[i]}
                      hue={HUES[(active.index + i) % HUES.length]}
                      delay={i * -3}
                    />
                  )}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

function ScatterText({ text, active }) {
  const reduce = useReducedMotion();
  const scatter = active && !reduce;
  const ref = useRef(null);
  const [kern, setKern] = useState([]);
  let n = 0;

  useEffect(() => {
    const el = ref.current;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!el || !ctx) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.fontKerning = "normal";
      const w = (str) => ctx.measureText(str).width;
      setKern(
        text.split(" ").flatMap((word) =>
          [...word].map((a, j, chars) => {
            const b = chars[j + 1];
            return b ? (w(a + b) - w(a) - w(b)) / size : 0;
          }),
        ),
      );
    };
    measure();
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <span ref={ref} aria-hidden data-text>
      {text.split(" ").map((word, w) => (
        <span key={w}>
          {w > 0 && " "}
          <span className="whitespace-nowrap">
            {[...word].map((ch) => {
              const i = n++;
              return (
                <motion.span
                  key={i}
                  className="inline-block"
                  style={{ marginRight: `${kern[i] ?? 0}em` }}
                  animate={
                    scatter
                      ? { y: rand(i, 1) * 6, rotate: rand(i, 2) * 6 }
                      : { y: 0, rotate: 0 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 14,
                    delay: scatter ? i * 0.018 : 0,
                  }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
        </span>
      ))}
    </span>
  );
}

function Disc({ src, hue, delay }) {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-full"
      style={{
        background: hue,
        boxShadow: `0 0 0 3px ${hue}, 0 24px 50px -12px rgb(70 45 20 / 0.45)`,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="size-full object-cover motion-safe:animate-[spin_14s_linear_infinite]"
        style={{ animationDelay: `${delay}s` }}
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{ background: hue }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-radial-gradient(circle, rgb(0 0 0 / 0.12) 0 1px, transparent 1px 3px)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70 mix-blend-screen"
        style={{
          background: `conic-gradient(from 20deg, transparent 0deg, color-mix(in srgb, ${hue} 70%, transparent) 35deg, rgb(255 255 255 / 0.5) 60deg, transparent 100deg, transparent 180deg, color-mix(in srgb, ${hue} 60%, transparent) 215deg, rgb(255 255 255 / 0.4) 240deg, transparent 280deg)`,
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="grid size-[30%] place-items-center rounded-full ring-1 ring-black/15"
          style={{ background: hue }}
        >
          <div className="grid size-1/2 place-items-center rounded-full bg-[#f8f4ec]/90">
            <div className="size-[45%] rounded-full bg-[#1c1814]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Polaroid({ src }) {
  return (
    <div className="w-full bg-[#fffdf8] p-[5%] pb-[20%] shadow-[0_20px_40px_-10px_rgb(70_45_20/0.4)]">
      <img
        src={src}
        alt=""
        draggable={false}
        className="aspect-square w-full object-cover"
      />
    </div>
  );
}
