'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

export default function AgendamentoRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/cliente/agendamento/novo');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gold animate-spin" />
    </div>
  );
}
