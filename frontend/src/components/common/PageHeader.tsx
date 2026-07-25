import React from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      
      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
          {action}
        </div>
      )}
    </div>
  )
}
