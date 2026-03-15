import { NavLink } from 'react-router-dom'
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
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-warm-200 safe-area-inset-bottom">
      <div className="flex items-stretch">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-sage-600'
                  : 'text-stone-400 hover:text-stone-600'
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
