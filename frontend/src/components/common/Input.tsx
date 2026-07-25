import * as React from "react"
import { cn } from "@/utils/cn"
import { LucideIcon } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  error?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, error, label, ...props }, ref) => {
    return (
      <div className="w-full relative space-y-1">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <div className="relative">
          {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "glass-input flex h-10 w-full px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            Icon && "pl-10",
            error && "border-error focus-visible:ring-error",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-error mt-1.5">{error}</p>
        )}
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
