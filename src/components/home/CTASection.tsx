'use client'

import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-gold)_0%,_transparent_70%)] opacity-[0.06]" />
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 sm:p-16 text-center border border-gold/10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">
            Pronto para{' '}
            <span className="text-gradient">Transformar</span>
            {' '}seu Visual?
          </h2>
          <p className="text-silver/60 text-lg mb-10 max-w-xl mx-auto">
            Agende agora e ganhe 10% na primeira visita
          </p>
          <Link
            href="/agendamento"
            className="group inline-flex items-center gap-2 px-10 py-4 bg-gold text-primary font-semibold uppercase tracking-wider rounded-lg hover:bg-gold-light transition-all duration-300 shadow-glow text-lg"
          >
            <Calendar className="w-5 h-5" />
            Agende Seu Horário
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
