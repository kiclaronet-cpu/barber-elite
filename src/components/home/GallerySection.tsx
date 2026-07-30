'use client'

import { useState } from 'react'
import { Scissors, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const galleryItems = [
  { gradient: 'from-amber-900/40 to-amber-700/20', label: 'Corte Degradê' },
  { gradient: 'from-yellow-900/40 to-yellow-700/20', label: 'Barba Desenhada' },
  { gradient: 'from-gold/30 to-gold-dark/20', label: 'Hidratação Capilar' },
  { gradient: 'from-amber-800/40 to-amber-600/20', label: 'Corte Clássico' },
  { gradient: 'from-yellow-800/40 to-yellow-600/20', label: 'Pigmentação' },
  { gradient: 'from-gold/20 to-amber-700/30', label: 'Corte Infantil' },
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

export default function GallerySection() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section id="galeria" className="relative py-24 sm:py-32 bg-secondary/50">
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
              Galeria
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold">
            Nosso{' '}
            <span className="text-gradient">Trabalho</span>
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {galleryItems.map((item, index) => (
            <motion.button
              key={item.label}
              variants={fadeUp}
              onClick={() => setSelected(index)}
              className={`relative h-64 rounded-xl bg-gradient-to-br ${item.gradient} overflow-hidden group border border-white/5 hover:border-gold/30 transition-all duration-500`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-100 scale-75">
                  <Scissors className="w-6 h-6 text-gold" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-white font-semibold text-sm">
                  {item.label}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelected((prev) => prev !== null ? (prev - 1 + galleryItems.length) % galleryItems.length : null)
              }}
              className="absolute left-6 text-white/60 hover:text-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <motion.div
              key={selected}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-full max-w-3xl aspect-video rounded-2xl bg-gradient-to-br ${galleryItems[selected].gradient} flex items-center justify-center border border-gold/20`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <Scissors className="w-12 h-12 text-gold/50 mx-auto mb-4" />
                <p className="text-white text-xl font-semibold">
                  {galleryItems[selected].label}
                </p>
              </div>
            </motion.div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelected((prev) => prev !== null ? (prev + 1) % galleryItems.length : null)
              }}
              className="absolute right-6 text-white/60 hover:text-white transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
