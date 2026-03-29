import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Route, Users, MoreHorizontal,
  ClipboardList, Archive, BookMarked, LogOut, Sun, Moon, Languages, Share2,
} from 'lucide-react'
import { cn } from '../ui/index'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { InviteSheet } from '../invite/InviteSheet'

const coreNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.home' },
  { to: '/lacunae', icon: BookOpen, labelKey: 'nav.lacunae' },
  { to: '/journeys', icon: Route, labelKey: 'nav.journeys' },
  { to: '/vratmitra', icon: Users, labelKey: 'nav.mentor' },
] as const

const sheetNavItems = [
  { to: '/assessments', icon: ClipboardList, labelKey: 'nav.assessments' },
  { to: '/archive', icon: Archive, labelKey: 'nav.archive' },
  { to: '/ontology', icon: BookMarked, labelKey: 'nav.ontology' },
] as const

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const { t, lang, setLang } = useLanguage()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const handleSignOut = () => {
    setSheetOpen(false)
    logout()
    navigate('/login')
  }

  const handleSheetNav = () => setSheetOpen(false)

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-t border-warm-200 dark:border-stone-700 safe-area-inset-bottom">
        <div className="flex items-stretch h-16">
          {coreNavItems.map(({ to, icon: Icon, labelKey }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSheetOpen(false)}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
              >
                <div className={cn(
                  'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-sage-100 dark:bg-sage-900/40' : ''
                )}>
                  <Icon
                    size={18}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-sage-600 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500'
                    )}
                  />
                </div>
                <span className={cn(
                  'text-xs font-medium transition-colors',
                  isActive ? 'text-sage-700 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500'
                )}>
                  {t(labelKey)}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sage-500 rounded-full" />
                )}
              </NavLink>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
          >
            <div className={cn(
              'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
              sheetOpen ? 'bg-sage-100 dark:bg-sage-900/40' : ''
            )}>
              <MoreHorizontal
                size={18}
                className={cn(
                  'transition-colors',
                  sheetOpen ? 'text-sage-600 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500'
                )}
              />
            </div>
            <span className={cn(
              'text-xs font-medium transition-colors',
              sheetOpen ? 'text-sage-700 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500'
            )}>
              {t('nav.more')}
            </span>
            {sheetOpen && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sage-500 rounded-full" />
            )}
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-900 rounded-t-2xl shadow-xl transition-transform duration-300 ease-out',
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-warm-200 dark:bg-stone-700" />
        </div>

        <div className="px-4 pb-8 pt-2 space-y-1">
          {/* Secondary nav links */}
          {sheetNavItems.map(({ to, icon: Icon, labelKey }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <NavLink
                key={to}
                to={to}
                onClick={handleSheetNav}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-400'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-warm-50 dark:hover:bg-stone-800'
                )}
              >
                <Icon size={17} className={cn('flex-shrink-0', isActive ? 'text-sage-600 dark:text-sage-400' : 'text-stone-400 dark:text-stone-500')} />
                {t(labelKey)}
              </NavLink>
            )
          })}

          {/* Divider */}
          <div className="h-px bg-warm-100 dark:bg-stone-800 my-2" />

          {/* Settings row */}
          <div className="flex gap-2 px-1">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 bg-warm-50 dark:bg-stone-800 hover:bg-warm-100 dark:hover:bg-stone-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            </button>
            <button
              onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 bg-warm-50 dark:bg-stone-800 hover:bg-warm-100 dark:hover:bg-stone-700 transition-colors"
            >
              <Languages size={15} />
              {lang === 'mr' ? 'English' : 'मराठी'}
            </button>
          </div>

          {/* Invite */}
          <button
            onClick={() => { setSheetOpen(false); setInviteOpen(true) }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors"
          >
            <Share2 size={17} className="text-stone-400 dark:text-stone-500" />
            {t('invite.inviteCta')}
          </button>

          {/* Divider */}
          <div className="h-px bg-warm-100 dark:bg-stone-800 my-2" />

          {/* User info + sign out */}
          <div className="flex items-center gap-3 px-3 py-2.5">
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
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={16} className="text-stone-400 dark:text-stone-500" />
            {t('nav.signOut')}
          </button>
        </div>
      </div>
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  )
}
