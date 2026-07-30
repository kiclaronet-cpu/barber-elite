'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (hasSession === false) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 sm:p-10 shadow-premium space-y-6 w-full max-w-md text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-2xl font-serif text-gradient">Link inválido</h1>
          <p className="text-sm text-silver/60">
            Este link de recuperação é inválido ou expirou. Solicite um novo.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gold text-primary font-medium py-3 rounded-lg hover:bg-gold-light transition-all"
          >
            Voltar ao login
          </button>
        </motion.div>
      </div>
    )
  }

  if (hasSession === null) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/3 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-gold to-transparent rounded-full" />
        <span className="text-2xl font-serif text-gradient tracking-wider">Barber Elite</span>
        <div className="w-1 h-8 bg-gradient-to-b from-gold to-transparent rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 sm:p-10 shadow-premium space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-serif text-gradient">Nova Senha</h1>
            <p className="text-sm text-silver/60">Escolha uma nova senha para sua conta</p>
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

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 text-center py-4"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-sm text-silver/70">Senha alterada com sucesso! Redirecionando...</p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-11 py-3 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-silver/40 hover:text-silver/60 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-primary font-medium py-3 rounded-lg hover:bg-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Alterando...' : 'Alterar senha'}
              </button>
            </>
          )}
        </form>
      </motion.div>

      <p className="mt-8 text-xs text-silver/30">&copy; {new Date().getFullYear()} Barber Elite. Todos os direitos reservados.</p>
    </div>
  )
}