import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sprout, Eye, EyeOff, Sun, Moon, Languages } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getErrorMessage } from '../../api/client'

export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { theme, toggleTheme } = useTheme()
  const { t, lang, setLang } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <div className="relative min-h-screen bg-warm-100 dark:bg-stone-950 flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-white dark:hover:bg-stone-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-white dark:hover:bg-stone-800 transition-colors"
        >
          <Languages size={17} />
        </button>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sage-500 mb-4">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100">{t('login.title')}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">{t('login.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-warm-200 dark:border-stone-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('login.email')}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label={t('login.password')}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
              {t('login.signIn')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-sage-600 hover:text-sage-700 font-medium">
              {t('login.createOne')}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-stone-400 mt-8 italic leading-relaxed max-w-xs mx-auto">
          {t('login.quote')}
        </p>
      </div>
    </div>
  )
}
