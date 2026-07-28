import * as React from "react"
import { cn } from "@/utils/cn"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
  customText?: string
}

export function StatusBadge({ status, customText, className, ...props }: StatusBadgeProps) {
  // Determine variant based on status string (case insensitive)
  const lowerStatus = status.toLowerCase()
  
  let variant: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default'
  
  if (lowerStatus.includes('inactive')) {
    variant = 'default'
  } else if (['approved', 'completed', 'active', 'available', 'received', 'delivered', 'paid', 'success', 'stable'].some(w => lowerStatus.includes(w))) {
    variant = 'success'
  } else if (['pending', 'processing', 'ongoing', 'warning', 'needs action', 'action needed', 'maintenance'].some(w => lowerStatus.includes(w))) {
    variant = 'warning'
  } else if (['cancelled', 'failed', 'error', 'rejected', 'overdue', 'critical', 'low stock'].some(w => lowerStatus.includes(w))) {
    variant = 'error'
  } else if (['shipped', 'dispatched', 'info', 'draft', 'on track'].some(w => lowerStatus.includes(w))) {
    variant = 'info'
  }

  const statusStyles = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-transparent dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    warning: 'bg-amber-100 text-amber-800 dark:bg-transparent dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    error: 'bg-red-100 text-red-800 dark:bg-transparent dark:text-red-400 border-red-200 dark:border-red-500/30',
    info: 'bg-blue-100 text-blue-800 dark:bg-transparent dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    default: 'bg-muted text-muted-foreground border-border dark:bg-transparent dark:text-gray-400 dark:border-gray-500/30',
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border shadow-sm",
        statusStyles[variant],
        className
      )}
      {...props}
    >
      {customText || status}
    </div>
  )
}
