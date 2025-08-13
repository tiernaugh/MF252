import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

export const Message = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
))
Message.displayName = "Message"

export const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    markdown?: boolean
  }
>(({ className, children, markdown = false, ...props }, ref) => {
  if (markdown && typeof children === "string") {
    return (
      <div
        ref={ref}
        className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
        {...props}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {children}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </div>
  )
})
MessageContent.displayName = "MessageContent"

export const MessageActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
))
MessageActions.displayName = "MessageActions"

export const MessageAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tooltip?: string
    delayDuration?: number
  }
>(({ className, tooltip, delayDuration, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground",
      className
    )}
    title={tooltip}
    {...props}
  >
    {children}
  </button>
))
MessageAction.displayName = "MessageAction"