import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../ui/index'
import { LayoutDashboard, BookOpen, Route, Users, Archive, Sun, Moon, Languages } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function MobileNav() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { t, lang, setLang } = useLanguage()

  const mobileNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.home') },
    { to: '/lacunae', icon: BookOpen, label: t('nav.lacunae') },
    { to: '/journeys', icon: Route, label: t('nav.journeys') },
    { to: '/vratmitra', icon: Users, label: t('nav.mentor') },
    { to: '/archive', icon: Archive, label: t('nav.archive') },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-t border-warm-200 dark:border-stone-700 safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
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
                isActive ? 'bg-sage-100 dark:bg-sage-900/40' : ''
              )}>
                <Icon
                  size={18}
                  className={cn('transition-colors', isActive ? 'text-sage-600 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500')}
                />
              </div>
              <span className={cn('text-xs font-medium transition-colors', isActive ? 'text-sage-700 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500')}>
                {label}
              </span>
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sage-500 rounded-full" />}
            </NavLink>
          )
        })}
        {/* Theme + Language toggles */}
        <button
          onClick={toggleTheme}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-stone-400 dark:text-stone-500"
        >
          <div className="w-10 h-7 rounded-xl flex items-center justify-center">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className="text-xs font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button
          onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-stone-400 dark:text-stone-500"
        >
          <div className="w-10 h-7 rounded-xl flex items-center justify-center">
            <Languages size={18} />
          </div>
          <span className="text-xs font-medium">{lang === 'mr' ? 'EN' : 'मराठी'}</span>
        </button>
      </div>
    </nav>
  )
}
