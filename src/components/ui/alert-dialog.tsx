"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const AlertDialog = ({ children, open, onOpenChange }: AlertDialogProps) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}

const AlertDialogTrigger = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <div onClick={onClick}>{children}</div>
)

const AlertDialogContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const AlertDialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("text-lg font-semibold", className)} {...props} />
)

const AlertDialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div className={cn("text-sm text-gray-600", className)} {...props} />
)

const AlertDialogAction = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button className={cn(className)} {...props} />
)

const AlertDialogCancel = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="outline" className={cn("mt-2 sm:mt-0", className)} {...props} />
)

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
