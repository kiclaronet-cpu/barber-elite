'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import BookingFlow from '@/components/agendamento/BookingFlow';
import { Button } from '@/components/ui/button';

export default function NovoAgendamentoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <Link href="/cliente/agendamentos">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />}>
            Voltar para Agendamentos
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-4">Novo Agendamento</h1>
        <p className="text-white/50 text-sm mt-1">
          Preencha as etapas para agendar seu horário
        </p>
      </div>

      <BookingFlow onComplete={() => router.push('/cliente/agendamentos')} />
    </motion.div>
  );
}
