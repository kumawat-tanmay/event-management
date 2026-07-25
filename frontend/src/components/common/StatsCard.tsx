import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string; // Will be used as the top-right badge text now
  icon: LucideIcon;
  colorTheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'blue' | 'yellow' | 'purple' | 'green' | 'orange';
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  colorTheme = 'primary'
}: StatsCardProps) {
  
  const getThemeStyles = () => {
    switch (colorTheme) {
      case 'secondary': return { bgLight: 'bg-secondary/10 dark:bg-secondary/20', text: 'text-secondary dark:text-secondary-foreground', border: 'border-l-secondary' };
      case 'success': return { bgLight: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-500', border: 'border-l-emerald-500' };
      case 'warning': return { bgLight: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-500', border: 'border-l-amber-500' };
      case 'error': return { bgLight: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-500', border: 'border-l-red-500' };
      case 'blue': return { bgLight: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-500', border: 'border-l-blue-500' };
      case 'yellow': return { bgLight: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-500', border: 'border-l-yellow-500' };
      case 'purple': return { bgLight: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-500', border: 'border-l-purple-500' };
      case 'green': return { bgLight: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-500', border: 'border-l-green-500' };
      case 'orange': return { bgLight: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-500', border: 'border-l-orange-500' };
      default: return { bgLight: 'bg-[#f5ebd5] dark:bg-primary/20', text: 'text-[#93701e] dark:text-primary', border: 'border-l-[#93701e] dark:border-l-primary' };
    }
  };
  const theme = getThemeStyles();

  return (
    <div className={cn("bg-card p-4 sm:p-5 rounded-2xl shadow-sm border-y border-r border-border border-l-4 flex flex-col hover:shadow-md transition-shadow h-full", theme.border)}>
      {/* Top Row: Icon and Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl flex items-center justify-center", theme.bgLight, theme.text)}>
          <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
        </div>
        
        {subtitle && (
          <div className={cn("px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold leading-none", theme.bgLight, theme.text)}>
            {subtitle}
          </div>
        )}
      </div>
      
      {/* Middle Row: Title */}
      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 leading-tight">{title}</h3>
      
      {/* Bottom Row: Value */}
      <p className="text-2xl sm:text-3xl font-display font-black text-foreground leading-none truncate">{value}</p>
    </div>
  );
}
