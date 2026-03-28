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

export function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { theme, toggleTheme } = useTheme()
  const { t, lang, setLang } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token)
      toast.success(`Welcome, ${data.user.name}!`)
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error(t('register.passwordMismatch'))
      return
    }
    mutation.mutate(form)
  }

  return (
    <div className="relative min-h-screen bg-warm-100 dark:bg-stone-950 flex items-center justify-center px-4 py-8">
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
          <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100">{t('register.title')}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">{t('register.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-warm-200 dark:border-stone-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('register.fullName')}
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('register.yourName')}
              required
              autoComplete="name"
            />
            <Input
              label={t('register.email')}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <div className="relative">
              <Input
                label={t('register.password')}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('register.minChars')}
                required
                autoComplete="new-password"
                hint={t('register.minChars')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input
              label={t('register.confirmPassword')}
              type="password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              placeholder={t('register.repeatPassword')}
              required
              autoComplete="new-password"
            />
            <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
              {t('register.createAccount')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-sage-600 hover:text-sage-700 font-medium">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
