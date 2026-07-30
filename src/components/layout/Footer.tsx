import { Scissors, MapPin, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'

const quickLinks = [
  { href: '#inicio', label: 'Início' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#barbeiros', label: 'Barbeiros' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#contato', label: 'Contato' },
]

const contactInfo = [
  { icon: MapPin, text: 'Rua Augusta, 1500 - Consolação\nSão Paulo - SP, 01304-001' },
  { icon: Phone, text: '(11) 99999-8888' },
  { icon: Mail, text: 'contato@barberelite.com.br' },
  { icon: Clock, text: 'Seg-Sáb: 09h - 20h\nDom: 10h - 16h' },
]

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Scissors className="w-6 h-6 text-gold" />
              <span className="text-xl font-bold tracking-wider text-gradient">
                Barber Elite
              </span>
            </Link>
            <p className="text-silver/60 text-sm leading-relaxed">
              Experiência premium em cuidados masculinos. Onde o estilo encontra a excelência.
            </p>
          </div>

          <div>
            <h4 className="text-gold text-sm uppercase tracking-widest font-semibold mb-4">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-silver/60 text-sm hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gold text-sm uppercase tracking-widest font-semibold mb-4">
              Contato
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <item.icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  <span className="text-silver/60 text-sm whitespace-pre-line">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gold text-sm uppercase tracking-widest font-semibold mb-4">
              Redes Sociais
            </h4>
            <div className="flex gap-3">
              {['IG', 'FB', 'TT', 'YT'].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full glass flex items-center justify-center text-silver/60 hover:text-gold hover:border-gold/30 transition-all duration-300 text-xs font-semibold tracking-wider"
                >
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-6">
        <p className="text-center text-silver/40 text-xs">
          &copy; {new Date().getFullYear()} Barber Elite. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
