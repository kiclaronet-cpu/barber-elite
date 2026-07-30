'use client'

import { Scissors, Sparkles, Combine, Droplets, Palette, Baby } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPrice } from '@/lib/utils'

const services = [
  {
    icon: Scissors,
    name: 'Corte Premium',
    description: 'Corte personalizado com tesoura e máquina, finalização com produtos premium.',
    price: 65,
    duration: '45min',
  },
  {
    icon: Sparkles,
    name: 'Barba Completa',
    description: 'Aparação e modelagem de barba com navalha, toalha quente e balm hidratante.',
    price: 45,
    duration: '30min',
  },
  {
    icon: Combine,
    name: 'Combo Corte + Barba',
    description: 'Nosso combo mais popular. Corte premium + barba completa com desconto especial.',
    price: 95,
    duration: '90min',
  },
  {
    icon: Droplets,
    name: 'Hidratação',
    description: 'Tratamento capilar profundo com queratina e óleos essenciais.',
    price: 55,
    duration: '35min',
  },
  {
    icon: Palette,
    name: 'Pigmentação',
    description: 'Técnica de micropigmentação capilar para disfarçar falhas e dar mais volume.',
    price: 70,
    duration: '40min',
  },
  {
    icon: Baby,
    name: 'Corte Infantil',
    description: 'Corte infantil com paciência e carinho em ambiente acolhedor.',
    price: 45,
    duration: '30min',
  },
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

export default function ServicesSection() {
  return (
    <section id="servicos" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-gold)_0%,_transparent_60%)] opacity-[0.04]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
              Nossos Serviços
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold">
            Excelência em{' '}
            <span className="text-gradient">Cada Detalhe</span>
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.name}
              variants={fadeUp}
              className="group relative glass rounded-xl p-6 sm:p-8 border border-white/5 hover:border-gold/30 transition-all duration-500 hover:shadow-glow cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg glass-gold flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                  <service.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {service.name}
                </h3>
                <p className="text-silver/60 text-sm leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xl font-bold text-gold font-serif">
                    {formatPrice(service.price)}
                  </span>
                  <span className="text-xs text-silver/40 uppercase tracking-wider">
                    {service.duration}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
