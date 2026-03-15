import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../ui/index'
import { LayoutDashboard, BookOpen, Route, Users, Archive } from 'lucide-react'

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/lacunae', icon: BookOpen, label: 'Lacunae' },
  { to: '/journeys', icon: Route, label: 'Journeys' },
  { to: '/vratmitra', icon: Users, label: 'Mentor' },
  { to: '/archive', icon: Archive, label: 'Archive' },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-warm-200 safe-area-inset-bottom h-16">
      <div className="flex items-stretch">
        {mobileNavItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
            >
              <div className={cn(
                'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                isActive ? 'bg-sage-100' : ''
              )}>
                <Icon
                  size={18}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-sage-600' : 'text-stone-400'
                  )}
                />
              </div>
              <span className={cn(
                'text-xs font-medium transition-colors',
                isActive ? 'text-sage-700' : 'text-stone-400'
              )}>
                {label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sage-500 rounded-full" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
