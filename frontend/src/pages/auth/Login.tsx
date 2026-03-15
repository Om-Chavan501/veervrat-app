import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sprout, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getErrorMessage } from '../../api/client'

export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
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
    <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sage-500 mb-4">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">Welcome back</h1>
          <p className="text-stone-500 mt-2 text-sm">Continue your inner transformation journey</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={mutation.isPending}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage-600 hover:text-sage-700 font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Quote */}
        <p className="text-center text-xs text-stone-400 mt-8 italic leading-relaxed max-w-xs mx-auto">
          "The journey of inner transformation begins with the courage to look within."
        </p>
      </div>
    </div>
  )
}
