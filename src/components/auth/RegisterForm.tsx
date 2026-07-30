'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function getStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: '', color: '', width: '0%' }
  const score =
    (password.length > 6 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
  if (score <= 1) return { label: 'Fraca', color: 'bg-red-500', width: '25%' }
  if (score === 2) return { label: 'Média', color: 'bg-yellow-500', width: '50%' }
  if (score === 3) return { label: 'Boa', color: 'bg-blue-500', width: '75%' }
  return { label: 'Forte', color: 'bg-green-500', width: '100%' }
}

export default function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'phone' ? formatPhone(e.target.value) : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const strength = getStrength(form.password)
  const passwordsMatch = form.password === form.confirmPassword
  const canSubmit = form.name && form.email && form.phone && form.password && form.confirmPassword && passwordsMatch && acceptTerms && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os termos de uso.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: 'cliente',
    })

    if (profileError) {
      setError('Erro ao criar perfil. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/cliente')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 sm:p-10 shadow-premium space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-serif text-gradient">Criar Conta</h1>
          <p className="text-sm text-silver/60">Junte-se à Barber Elite</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type="text"
              placeholder="Nome completo"
              value={form.name}
              onChange={updateField('name')}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={updateField('email')}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type="tel"
              placeholder="Telefone"
              value={form.phone}
              onChange={updateField('phone')}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={form.password}
              onChange={updateField('password')}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-11 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-silver/40 hover:text-silver/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {form.password && (
            <div className="space-y-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  className={`h-full rounded-full ${strength.color} transition-all`}
                />
              </div>
              <p className={`text-xs ${strength.color.replace('bg-', 'text-')}/70`}>
                {strength.label}
              </p>
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type="password"
              placeholder="Confirmar senha"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          {form.confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400">As senhas não conferem.</p>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 accent-gold rounded border-white/10 bg-white/5"
          />
          <span className="text-xs text-silver/50 group-hover:text-silver/70 transition-colors">
            Aceito os{' '}
            <span className="text-gold/70">Termos de Uso</span>
            {' '}e{' '}
            <span className="text-gold/70">Política de Privacidade</span>
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-gold text-primary font-medium py-3 rounded-lg hover:bg-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Criando...' : 'Criar Conta'}
        </button>

        <p className="text-center text-sm text-silver/50">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-gold hover:text-gold-light transition-colors font-medium">
            Entrar
          </Link>
        </p>
      </form>
    </motion.div>
  )
}
