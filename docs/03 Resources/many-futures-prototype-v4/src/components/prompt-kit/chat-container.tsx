import * as React from "react"
import { cn } from "@/lib/utils"

export const ChatContainerRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full flex-col", className)}
    {...props}
  />
))
ChatContainerRoot.displayName = "ChatContainerRoot"

export const ChatContainerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto p-4", className)}
    {...props}
  />
))
ChatContainerContent.displayName = "ChatContainerContent"