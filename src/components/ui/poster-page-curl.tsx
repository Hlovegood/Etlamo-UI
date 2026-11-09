"use client"

import * as React from "react"
import { forwardRef, useState, useRef, useEffect, useCallback, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface PosterPageCurlProps extends HTMLAttributes<HTMLDivElement> {
  frontImage: string
  backImage: string
  frontAlt?: string
  backAlt?: string
  corner?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  defaultCurl?: number
  hoverCurl?: number
  kicker?: React.ReactNode
  title?: React.ReactNode
  intro?: React.ReactNode
  revealedTitle?: React.ReactNode
  revealedDesc?: React.ReactNode
  revealedBadge?: React.ReactNode
  fullWidth?: boolean
  onCurlChange?: (progress: number) => void
  onFoldChange?: (isFullyFolded: boolean) => void
}

/**
 * OriginKit PosterPageCurl Component (Apollo Edition)
 * Full-width edge-to-edge layout, dual-layer reveal,
 * physical 3D paper corner peel and FULL PAGE FOLD (0% to 100% reveal)
 * with pointer-tracking drag across the entire viewport.
 */
export const PosterPageCurl = forwardRef<HTMLDivElement, PosterPageCurlProps>(
  (
    {
      frontImage,
      backImage,
      frontAlt = "Front poster visual",
      backAlt = "Revealed architectural under-layer",
      corner = "bottom-right",
      defaultCurl = 0.06,
      hoverCurl = 0.18,
      kicker,
      title,
      intro,
      revealedTitle,
      revealedDesc,
      revealedBadge,
      fullWidth = true,
      onCurlChange,
      onFoldChange,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const [foldProgress, setFoldProgress] = useState<number>(defaultCurl)
    const [isHovered, setIsHovered] = useState<boolean>(false)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [isFullyFolded, setIsFullyFolded] = useState<boolean>(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl"
    const effectiveCorner = corner === "bottom-right" && isRtl ? "bottom-left" : corner

    const handlePointerDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDragging(true)
    }

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!isDragging || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        let progress = 0

        if (effectiveCorner === "bottom-right") {
          const dx = rect.right - e.clientX
          progress = dx / rect.width
        } else if (effectiveCorner === "bottom-left") {
          const dx = e.clientX - rect.left
          progress = dx / rect.width
        }

        const clamped = Math.max(0.04, Math.min(1.0, progress))
        setFoldProgress(clamped)
        onCurlChange?.(clamped)
      },
      [isDragging, effectiveCorner, onCurlChange]
    )

    const handlePointerUp = (e: React.PointerEvent) => {
      if (isDragging) {
        setIsDragging(false)
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        if (foldProgress > 0.35) {
          setFoldProgress(1.0)
          setIsFullyFolded(true)
          onFoldChange?.(true)
        } else {
          setFoldProgress(defaultCurl)
          setIsFullyFolded(false)
          onFoldChange?.(false)
        }
      }
    }

    const toggleFullFold = () => {
      const nextFold = !isFullyFolded
      setIsFullyFolded(nextFold)
      setFoldProgress(nextFold ? 1.0 : defaultCurl)
      onFoldChange?.(nextFold)
    }

    useEffect(() => {
      if (!isDragging) {
        if (isFullyFolded) {
          setFoldProgress(1.0)
        } else if (isHovered) {
          setFoldProgress(hoverCurl)
        } else {
          setFoldProgress(defaultCurl)
        }
      }
    }, [isHovered, isFullyFolded, isDragging, defaultCurl, hoverCurl])

    const curlPixels = Math.round(foldProgress * 1200)
    const frontClipPath = isFullyFolded
      ? "polygon(0 0, 0 0, 0 100%, 0 100%)"
      : effectiveCorner === "bottom-right"
      ? `polygon(0 0, 100% 0, 100% calc(100% - ${curlPixels}px), calc(100% - ${curlPixels}px) 100%, 0 100%)`
      : `polygon(0 0, 100% 0, 100% 100%, ${curlPixels}px 100%, 0 calc(100% - ${curlPixels}px))`

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        className={cn(
          "poster-page-curl-hero relative overflow-hidden select-none",
          isFullyFolded && "is-fully-folded",
          fullWidth && "w-screen max-w-[100vw] -mx-[calc(50vw-50%)]",
          className
        )}
        style={{
          ["--fold-progress" as any]: foldProgress.toFixed(4),
          ["--curl-size" as any]: `${curlPixels}px`,
          ...style,
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        {...props}
      >
        <div className="poster-curl-container relative w-full min-h-[560px] md:min-h-[640px] lg:min-h-[720px] overflow-hidden bg-[#3c261c] text-[#f9f8f0]">
          {/* Back Revealed Layer (Under-layer) */}
          <div className="poster-layer poster-layer-back absolute inset-0 z-0 overflow-hidden">
            <img
              src={backImage}
              alt={backAlt}
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2d1e16]/90 via-[#2d1e16]/50 to-[#2d1e16]/30" />
            <div
              className={cn(
                "poster-back-card absolute bottom-8 z-10 max-w-md p-7 bg-[#2d1e16]/90 backdrop-blur-md border border-[#e97451] rounded-[3px] text-[#f9f8f0]",
                effectiveCorner === "bottom-right" ? "right-8 text-right" : "left-8 text-left"
              )}
            >
              {revealedBadge && (
                <span className="inline-block px-3 py-1 mb-3 text-[11px] font-mono tracking-widest uppercase bg-[#e97451]/20 border border-[#e97451] rounded-[3px] text-[#f7efc5]">
                  {revealedBadge}
                </span>
              )}
              {revealedTitle && <h3 className="text-2xl font-light font-serif mb-2">{revealedTitle}</h3>}
              {revealedDesc && <p className="text-sm text-[#f9f8f0]/85 leading-relaxed mb-4">{revealedDesc}</p>}
              <button
                type="button"
                onClick={toggleFullFold}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase font-medium bg-[#e97451] text-white rounded-[3px]"
              >
                <span>↩</span> <span>{isRtl ? "فرد الصفحة" : "Unfold Poster"}</span>
              </button>
            </div>
          </div>

          {/* Front Primary Sheet (Clipped dynamically as paper folds) */}
          <div
            className={cn(
              "poster-layer poster-layer-front absolute inset-0 z-10 overflow-hidden transition-[clip-path,opacity] duration-400 ease-out",
              isFullyFolded && "opacity-0 pointer-events-none"
            )}
            style={{ clipPath: frontClipPath }}
          >
            <img
              src={frontImage}
              alt={frontAlt}
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2d1e16]/90 via-[#2d1e16]/40 to-[#2d1e16]/20" />

            {/* Front Editorial Content */}
            <div className="poster-front-content relative z-20 max-w-[1200px] mx-auto h-full flex flex-col justify-end px-6 sm:px-10 pb-16 pt-28">
              {kicker && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 text-xs tracking-wider uppercase font-semibold bg-[#3c261c]/60 backdrop-blur-md border border-[#dddedf] rounded-[3px] text-[#f9f8f0]">
                    <span className="w-2 h-2 rounded-full bg-[#e97451]" />
                    {kicker}
                  </span>
                </div>
              )}
              {title && (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light font-serif tracking-tight text-[#f9f8f0] mb-5 max-w-3xl leading-[1.0]">
                  {title}
                </h1>
              )}
              {intro && (
                <p className="text-sm sm:text-base lg:text-lg text-[#f9f8f0]/90 max-w-2xl mb-8 leading-relaxed font-normal">
                  {intro}
                </p>
              )}
              <div className="poster-cta-row flex flex-wrap items-center gap-4">
                {children}
                <button
                  type="button"
                  onClick={toggleFullFold}
                  className="inline-flex items-center gap-2 h-11 px-6 text-xs uppercase tracking-wider font-medium border border-[#e97451] rounded-[3px] text-[#f7efc5] hover:bg-[#e97451]/20 transition-all"
                >
                  <span>📖</span>
                  <span>{isFullyFolded ? (isRtl ? "فرد الصفحة" : "Unfold Poster") : (isRtl ? "طي الصفحة بالكامل" : "Fold Full Poster")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3D Paper Corner & Full Fold Flap */}
          <div
            className={cn(
              "poster-curl-fold absolute z-30 cursor-grab active:cursor-grabbing transition-[width,height] duration-400 ease-out select-none",
              isFullyFolded
                ? effectiveCorner === "bottom-right"
                  ? "left-0 top-0 bottom-0 w-24 border-r-2 border-[#e97451]"
                  : "right-0 top-0 bottom-0 w-24 border-l-2 border-[#e97451]"
                : effectiveCorner === "bottom-right"
                ? "bottom-0 right-0"
                : "bottom-0 left-0"
            )}
            style={{
              width: isFullyFolded ? undefined : `${curlPixels}px`,
              height: isFullyFolded ? "100%" : `${curlPixels}px`,
            }}
            onClick={toggleFullFold}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            role="button"
            tabIndex={0}
            aria-label="Fold or unfold full poster"
            aria-expanded={isFullyFolded}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                toggleFullFold()
              }
            }}
          >
            <div
              className={cn(
                "poster-curl-shadow absolute inset-0 pointer-events-none",
                effectiveCorner === "bottom-right"
                  ? "shadow-[-12px_-12px_24px_rgba(0,0,0,0.6)]"
                  : "shadow-[12px_-12px_24px_rgba(0,0,0,0.6)]"
              )}
            />
            <div
              className={cn(
                "poster-curl-paper absolute inset-0 pointer-events-none border-t border-l border-white/50",
                isFullyFolded
                  ? "bg-gradient-to-r from-[#2a1c14] via-[#3c261c] to-[#4e3324]"
                  : effectiveCorner === "bottom-right"
                  ? "bg-gradient-to-br from-[#ffffff] via-[#f9f8f0] to-[#b2a792] [clip-path:polygon(0%_0%,100%_0%,0%_100%)]"
                  : "bg-gradient-to-bl from-[#ffffff] via-[#f9f8f0] to-[#b2a792] [clip-path:polygon(0%_0%,100%_0%,100%_100%)]"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),transparent_70%)] opacity-80" />
            </div>
            <div
              className={cn(
                "poster-curl-hint absolute z-40 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-semibold text-white bg-[#3c261c]/90 border border-[#e97451] px-2.5 py-1 rounded-[3px] pointer-events-none transition-opacity duration-200",
                effectiveCorner === "bottom-right" ? "top-3 left-3" : "top-3 right-3",
                foldProgress > 0.15 || isFullyFolded ? "opacity-100" : "opacity-0"
              )}
            >
              <span>{isFullyFolded ? (isRtl ? "فرد" : "Unfold") : (isRtl ? "طي" : "Fold")}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

PosterPageCurl.displayName = "PosterPageCurl"
export default PosterPageCurl
