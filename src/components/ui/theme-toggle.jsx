"use client"

import * as React from "react"
import { forwardRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export const ThemeToggle = forwardRef(
  (
    {
      variant = "morph",
      size = "md",
      theme: controlledTheme,
      onThemeChange,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const [internalTheme, setInternalTheme] = useState("light")

    useEffect(() => {
      const isDark = document.documentElement.classList.contains("dark")
      setInternalTheme(isDark ? "dark" : "light")
    }, [])

    const activeTheme = controlledTheme ?? internalTheme
    const isDark = activeTheme === "dark"

    const handleToggle = (e) => {
      const nextTheme = isDark ? "light" : "dark"

      const switchTheme = () => {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark")
          document.documentElement.setAttribute("data-theme", "dark")
        } else {
          document.documentElement.classList.remove("dark")
          document.documentElement.setAttribute("data-theme", "light")
        }
        setInternalTheme(nextTheme)
        onThemeChange?.(nextTheme)
      }

      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const x = e.clientX || window.innerWidth / 2
        const y = e.clientY || window.innerHeight / 2
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )

        document.documentElement.style.setProperty("--theme-x", `${x}px`)
        document.documentElement.style.setProperty("--theme-y", `${y}px`)

        const transition = document.startViewTransition(() => {
          switchTheme()
        })

        transition.ready?.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 480,
              easing: "cubic-bezier(0.19, 1, 0.22, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
      } else {
        switchTheme()
      }

      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to daylight mode" : "Switch to museum dark mode"}
        onClick={handleToggle}
        className={cn(
          "smoothui-theme-toggle relative inline-flex items-center justify-center rounded-full transition-all duration-300",
          size === "sm" && "h-8 w-8 text-xs",
          size === "md" && "h-10 w-10 text-sm",
          size === "lg" && "h-12 w-12 text-base",
          isDark
            ? "bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
            : "bg-white text-neutral-900 shadow-sm hover:bg-neutral-100",
          className
        )}
        {...props}
      >
        <span className="smoothui-icon-wrap relative flex h-full w-full items-center justify-center">
          <svg
            className={cn(
              "smoothui-sun-svg absolute transition-transform duration-500",
              isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            )}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>

          <svg
            className={cn(
              "smoothui-moon-svg absolute transition-transform duration-500",
              isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
            )}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z" />
          </svg>
        </span>
      </button>
    )
  }
)
ThemeToggle.displayName = "ThemeToggle"
