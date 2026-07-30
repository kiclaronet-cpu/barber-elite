'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Quote, Scissors } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const testimonials = [
  {
    quote: 'Simplesmente a melhor barbearia da cidade. O Ricardo é um artista com a tesoura. Saí de lá me sentindo um novo homem.',
    author: 'Carlos Eduardo',
    rating: 5,
  },
  {
    quote: 'Ambiente incrível, atendimento nota 10. O combo corte + barba é imperdível. Virei cliente fiel!',
    author: 'André Martins',
    rating: 5,
  },
  {
    quote: 'Fiz a pigmentação com o Thiago e o resultado superou minhas expectativas. Equipe muito profissional.',
    author: 'Paulo Henrique',
    rating: 5,
  },
]

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-gold)_0%,_transparent_70%)] opacity-[0.04]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
              Depoimentos
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold">
            O Que Nossos{' '}
            <span className="text-gradient">Clientes Dizem</span>
          </h2>
        </motion.div>

        <div className="relative min-h-[280px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="glass rounded-2xl p-8 sm:p-12 text-center border border-gold/10 max-w-2xl mx-auto"
            >
              <Quote className="w-10 h-10 text-gold/30 mx-auto mb-6" />
              <p className="text-lg sm:text-xl text-silver/80 leading-relaxed mb-8 italic">
                &ldquo;{testimonials[current].quote}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-1 mb-3">
                {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                {testimonials[current].author}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                index === current
                  ? 'bg-gold w-8'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Depoimento ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
