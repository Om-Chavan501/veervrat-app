import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../ui/index'
import {
  LayoutDashboard, BookOpen, ClipboardList, Route,
  Archive, Users, BookMarked, LogOut, Sprout, Sun, Moon, Languages
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { t, lang, setLang } = useLanguage()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/lacunae', icon: BookOpen, label: t('nav.lacunae') },
    { to: '/assessments', icon: ClipboardList, label: t('nav.assessments') },
    { to: '/journeys', icon: Route, label: t('nav.journeys') },
    { to: '/archive', icon: Archive, label: t('nav.archive') },
    { to: '/vratmitra', icon: Users, label: t('nav.vratmitra') },
    { to: '/ontology', icon: BookMarked, label: t('nav.ontology') },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-stone-900 border-r border-warm-200 dark:border-stone-700 h-screen sticky top-0 z-30 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-warm-100 dark:border-stone-800">
        <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center">
          <Sprout className="w-4.5 h-4.5 text-white" size={16} />
        </div>
        <div>
          <span className="text-base font-bold text-stone-800 dark:text-stone-100 tracking-tight">
            {lang === 'mr' ? 'वीरव्रत' : 'Veervrat'}
          </span>
          <p className="text-xs text-stone-400 dark:text-stone-500 leading-none mt-0.5">{t('nav.innerTransformation')}</p>
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
                  ? 'bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-400'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-warm-50 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-sage-600 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500'
                )}
              />
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sage-500" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Toggles: theme + language */}
      <div className="px-2.5 pb-2 flex items-center gap-1">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
          title="Toggle language"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors"
        >
          <Languages size={14} />
          {lang === 'mr' ? 'EN' : 'मराठी'}
        </button>
      </div>

      {/* User */}
      <div className="px-2.5 py-3 border-t border-warm-100 dark:border-stone-800">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-sage-700 dark:text-sage-400">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">{user?.name}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} className="text-stone-400 dark:text-stone-500" />
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
