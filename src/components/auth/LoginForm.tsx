'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLink, setResetLink] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResetLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setResetLoading(false)
      return
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.link) setResetLink(data.link)
    } catch {}

    setResetSent(true)
    setResetLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos.'
        : authError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/cliente')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <form onSubmit={resetMode ? handleResetPassword : handleSubmit} className="glass rounded-2xl p-8 sm:p-10 shadow-premium space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-serif text-gradient">
            {resetMode ? 'Recuperar Senha' : 'Entrar'}
          </h1>
          <p className="text-sm text-silver/60">
            {resetMode
              ? 'Enviaremos um link de recuperação para seu email'
              : 'Acesse sua conta Barber Elite'}
          </p>
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
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          <AnimatePresence mode="wait">
            {!resetMode && (
              <motion.div
                key="password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {resetSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 text-center py-4"
          >
            <CheckCircle className="w-12 h-12 text-green-400" />
            <p className="text-sm text-silver/70">
              Email de recuperação enviado! Verifique sua caixa de entrada.
            </p>
            {resetLink && (
              <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 mt-2">
                <p className="text-xs text-silver/50 mb-1">Link direto (se o email não chegar):</p>
                <a
                  href={resetLink}
                  className="text-xs text-gold break-all hover:underline flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3 shrink-0" />
                  {resetLink}
                </a>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              {!resetMode && (
                <label className="flex items-center gap-2 text-silver/50 cursor-pointer">
                  <input type="checkbox" className="accent-gold rounded border-white/10 bg-white/5" />
                  Lembrar-me
                </label>
              )}
              {!resetMode && <div />}
              <button
                type="button"
                onClick={() => { setResetMode(!resetMode); setError('') }}
                className="text-gold/60 hover:text-gold transition-colors ml-auto"
              >
                {resetMode ? 'Voltar ao login' : 'Esqueceu a senha?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={resetMode ? resetLoading : loading}
              className="w-full bg-gold text-primary font-medium py-3 rounded-lg hover:bg-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow"
            >
              {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {resetLoading
                ? 'Enviando...'
                : resetMode
                  ? 'Enviar link de recuperação'
                  : loading
                    ? 'Entrando...'
                    : 'Entrar'}
            </button>

            {!resetMode && (
              <p className="text-center text-sm text-silver/50">
                Não tem uma conta?{' '}
                <Link href="/cadastro" className="text-gold hover:text-gold-light transition-colors font-medium">
                  Cadastre-se
                </Link>
              </p>
            )}
          </>
        )}
      </form>
    </motion.div>
  )
}
