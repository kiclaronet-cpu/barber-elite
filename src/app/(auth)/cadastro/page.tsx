import RegisterForm from '@/components/auth/RegisterForm'

export default function CadastroPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold/3 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-gold to-transparent rounded-full" />
        <span className="text-2xl font-serif text-gradient tracking-wider">Barber Elite</span>
        <div className="w-1 h-8 bg-gradient-to-b from-gold to-transparent rounded-full" />
      </div>

      <div className="absolute left-8 top-1/3 w-px h-32 bg-gradient-to-b from-gold/30 to-transparent hidden lg:block" />
      <div className="absolute right-8 top-1/3 w-px h-32 bg-gradient-to-b from-gold/30 to-transparent hidden lg:block" />

      <RegisterForm />

      <p className="mt-8 text-xs text-silver/30">&copy; {new Date().getFullYear()} Barber Elite. Todos os direitos reservados.</p>
    </div>
  )
}
