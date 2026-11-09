import * as React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export const CutoutCorner = forwardRef(
  ({ size = 32, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn("pointer-events-none select-none", className)}
        {...props}
      >
        <path
          d="M32 0C32 17.6731 17.6731 32 0 32V0H32Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)
CutoutCorner.displayName = "CutoutCorner"

export const cutoutCardSurfaceClassName =
  "group relative flex flex-col overflow-hidden bg-card text-card-foreground border border-border transition-all duration-300"

export const CutoutCard = forwardRef(
  ({ className, as: Component = "article", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(cutoutCardSurfaceClassName, className)}
        {...props}
      />
    )
  }
)
CutoutCard.displayName = "CutoutCard"

export const CutoutCardMedia = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden bg-muted", className)}
        {...props}
      />
    )
  }
)
CutoutCardMedia.displayName = "CutoutCardMedia"

export const CutoutCardImage = forwardRef(
  ({ className, alt = "", ...props }, ref) => {
    return (
      <img
        ref={ref}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
          className
        )}
        {...props}
      />
    )
  }
)
CutoutCardImage.displayName = "CutoutCardImage"

export const CutoutCardOverlay = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent",
          className
        )}
        {...props}
      />
    )
  }
)
CutoutCardOverlay.displayName = "CutoutCardOverlay"

export const CutoutCardInsetLabel = forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute bottom-0 left-0 z-10 flex items-center bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CutoutCardInsetLabel.displayName = "CutoutCardInsetLabel"

export const CutoutCardPin = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("absolute right-4 top-4 z-10 flex items-center gap-2", className)}
        {...props}
      />
    )
  }
)
CutoutCardPin.displayName = "CutoutCardPin"

export const CutoutCardAction = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("absolute right-4 bottom-4 z-10", className)}
        {...props}
      />
    )
  }
)
CutoutCardAction.displayName = "CutoutCardAction"

export const CutoutCardContent = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-1 flex-col p-6", className)}
        {...props}
      />
    )
  }
)
CutoutCardContent.displayName = "CutoutCardContent"

export const CutoutCardFooter = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-auto flex items-center justify-between pt-4", className)}
        {...props}
      />
    )
  }
)
CutoutCardFooter.displayName = "CutoutCardFooter"
