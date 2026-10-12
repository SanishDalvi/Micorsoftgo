import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "liquid" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "hero"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variant === "liquid" &&
            "liquid-glass text-foreground hover:scale-[1.03] cursor-pointer",
          variant === "default" &&
            "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          variant === "ghost" &&
            "hover:bg-white/10 text-foreground",
          variant === "outline" &&
            "border border-white/20 hover:bg-white/10 text-foreground",
          size === "default" && "h-10 px-4 py-2 text-sm rounded-md",
          size === "sm" && "h-9 rounded-md px-3 text-xs",
          size === "lg" && "h-11 rounded-md px-8 text-base",
          size === "hero" && "rounded-full px-14 py-5 text-base",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
