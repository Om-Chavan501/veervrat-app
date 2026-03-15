import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../ui/index'
import {
  LayoutDashboard, BookOpen, ClipboardList, Route,
  Archive, Users, BookMarked, LogOut, Sprout
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lacunae', icon: BookOpen, label: 'Lacunae' },
  { to: '/assessments', icon: ClipboardList, label: 'Assessments' },
  { to: '/journeys', icon: Route, label: 'Journeys' },
  { to: '/archive', icon: Archive, label: 'Archive' },
  { to: '/vratmitra', icon: Users, label: 'Vratmitra' },
  { to: '/ontology', icon: BookMarked, label: 'Ontology' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-warm-200 h-screen sticky top-0 z-30 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-warm-100">
        <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center">
          <Sprout className="w-4.5 h-4.5 text-white" size={16} />
        </div>
        <div>
          <span className="text-base font-bold text-stone-800 tracking-tight">Veervrat</span>
          <p className="text-xs text-stone-400 leading-none mt-0.5">Inner Transformation</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sage-50 text-sage-700'
                  : 'text-stone-500 hover:bg-warm-50 hover:text-stone-700'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-sage-600' : 'text-stone-400'
                )}
              />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sage-500" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2.5 py-3 border-t border-warm-100">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl hover:bg-warm-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-sage-700">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{user?.name}</p>
            <p className="text-xs text-stone-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} className="text-stone-400" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
