'use client'

import { Star, Scissors } from 'lucide-react'
import { motion } from 'framer-motion'

const barbers = [
  { name: 'Ricardo Mendes', specialty: 'Corte Clássico', rating: 4.9, initials: 'RM' },
  { name: 'Felipe Oliveira', specialty: 'Barba Tradicional', rating: 4.8, initials: 'FO' },
  { name: 'Lucas Andrade', specialty: 'Corte Moderno', rating: 4.9, initials: 'LA' },
  { name: 'Gabriel Santos', specialty: 'Hidratação', rating: 4.7, initials: 'GS' },
  { name: 'Thiago Costa', specialty: 'Pigmentação', rating: 4.8, initials: 'TC' },
]

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function BarbersSection() {
  return (
    <section id="barbeiros" className="relative py-24 sm:py-32 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold border border-gold/20 mb-6">
            <Scissors className="w-4 h-4 text-gold" />
            <span className="text-gold text-xs uppercase tracking-[0.2em] font-semibold">
              Nossa Equipe
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold">
            Mestres do{' '}
            <span className="text-gradient">Estilo</span>
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {barbers.map((barber) => (
            <motion.div
              key={barber.name}
              variants={fadeUp}
              className="group glass rounded-xl p-6 text-center border border-white/5 hover:border-gold/30 transition-all duration-500 hover:shadow-glow"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 mx-auto mb-5 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <span className="text-2xl font-bold text-gold font-serif">
                  {barber.initials}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {barber.name}
              </h3>
              <p className="text-silver/50 text-sm mb-4">
                {barber.specialty}
              </p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-sm text-gold font-semibold">
                  {barber.rating}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
