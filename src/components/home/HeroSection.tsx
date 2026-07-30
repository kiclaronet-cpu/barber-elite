'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
}

const stats = [
  { value: '10+', label: 'Anos' },
  { value: '5', label: 'Especialistas' },
  { value: '8K+', label: 'Clientes' },
]

export default function HeroSection() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-primary z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-gold)_0%,_transparent_70%)] opacity-[0.08] z-10" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_var(--color-gold)_1px,_transparent_1px),_linear-gradient(to_bottom,_var(--color-gold)_1px,_transparent_1px)] bg-[size:60px_60px] opacity-[0.03]" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold border border-gold/20 mb-8"
          >
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-gold text-xs uppercase tracking-[0.2em] font-semibold">
              Barbearia Premium &mdash;
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6"
          >
            Onde o{' '}
            <span className="text-gradient">Estilo</span>
            {' '}Encontra a{' '}
            <span className="text-gradient">Excelência</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-silver/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Experiência premium em cuidados masculinos. Agende seu horário e descubra o verdadeiro significado de estilo.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/agendamento"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gold text-primary font-semibold uppercase tracking-wider rounded-lg hover:bg-gold-light transition-all duration-300 shadow-glow"
            >
              <Calendar className="w-5 h-5" />
              Agende Seu Horário
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#servicos"
              className="group inline-flex items-center gap-2 px-8 py-4 border border-gold/30 text-gold font-semibold uppercase tracking-wider rounded-lg hover:bg-gold/10 transition-all duration-300"
            >
              Conheça Nossos Serviços
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-12 sm:gap-16"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gold font-serif">
                  {stat.value}
                </div>
                <div className="text-silver/50 text-xs uppercase tracking-widest mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
