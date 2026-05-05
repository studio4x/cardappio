import { Link } from 'react-router-dom'
import { Utensils } from 'lucide-react'
import { useAppSettings } from '@/hooks/useAppSettings'
import { config } from '@/config'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'dark' | 'light'
  className?: string
  showText?: boolean
  to?: string
}

/**
 * Dynamic Logo component that uses the visual identity from settings
 * if available, otherwise falls back to the default icon/text.
 */
export function Logo({ 
  variant = 'dark', 
  className, 
  showText = true,
  to = '/'
}: LogoProps) {
  const { visualIdentity, loading } = useAppSettings()
  
  const logoUrl = variant === 'dark' 
    ? visualIdentity?.logo_dark_url 
    : visualIdentity?.logo_light_url

  if (!loading && logoUrl) {
    return (
      <Link to={to} className={cn("flex items-center gap-2 no-underline group active:scale-95 transition-transform", className)}>
        <img 
          src={logoUrl} 
          alt={config.app.name} 
          className="h-10 w-auto object-contain" 
        />
      </Link>
    )
  }

  return (
    <Link to={to} className={cn("flex items-center gap-2 no-underline group active:scale-95 transition-transform", className)}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6",
        variant === 'dark' ? "bg-primary shadow-primary/20" : "bg-white shadow-black/10"
      )}>
        <Utensils className={cn("h-6 w-6", variant === 'dark' ? "text-white" : "text-primary")} />
      </div>
      {showText && (
        <span className={cn(
          "text-2xl font-black tracking-tighter transition-colors",
          variant === 'dark' ? "text-on-surface" : "text-white"
        )}>
          {config.app.name}
        </span>
      )}
    </Link>
  )
}
