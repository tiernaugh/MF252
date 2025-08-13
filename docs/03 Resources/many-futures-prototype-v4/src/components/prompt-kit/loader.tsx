import * as React from "react"
import { cn } from "@/lib/utils"

export const DotsLoader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center space-x-1", className)}
    {...props}
  >
    <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
    <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
    <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
  </div>
))
DotsLoader.displayName = "DotsLoader"