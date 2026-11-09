import * as React from "react"
import { forwardRef, type HTMLAttributes, type ImgHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface CutoutCornerProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * CutoutCorner renders the signature Cult UI inverted fillet curve.
 * Bounded by a quarter-circle arc that carves out an inverted radius.
 */
export const CutoutCorner = forwardRef<SVGSVGElement, CutoutCornerProps>(
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

export interface CutoutCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export const CutoutCard = forwardRef<HTMLDivElement, CutoutCardProps>(
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

export interface CutoutCardMediaProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardMedia = forwardRef<HTMLDivElement, CutoutCardMediaProps>(
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

export interface CutoutCardImageProps extends ImgHTMLAttributes<HTMLImageElement> {}

export const CutoutCardImage = forwardRef<HTMLImageElement, CutoutCardImageProps>(
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

export interface CutoutCardOverlayProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardOverlay = forwardRef<HTMLDivElement, CutoutCardOverlayProps>(
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

export interface CutoutCardInsetLabelProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardInsetLabel = forwardRef<HTMLDivElement, CutoutCardInsetLabelProps>(
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

export interface CutoutCardPinProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardPin = forwardRef<HTMLDivElement, CutoutCardPinProps>(
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

export interface CutoutCardActionProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardAction = forwardRef<HTMLDivElement, CutoutCardActionProps>(
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

export interface CutoutCardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardContent = forwardRef<HTMLDivElement, CutoutCardContentProps>(
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

export interface CutoutCardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CutoutCardFooter = forwardRef<HTMLDivElement, CutoutCardFooterProps>(
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
