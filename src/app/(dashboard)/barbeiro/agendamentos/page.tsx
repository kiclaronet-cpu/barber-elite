'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Scissors, User } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment, Barber, Service, Profile } from '@/lib/types';

type AppointmentWithRelations = Appointment & { service?: Service; profile?: Profile };

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default' | 'gold'> = {
  confirmed: 'gold',
  completed: 'success',
  cancelled: 'error',
  pending: 'warning',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function BarbeiroAgendamentos() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (authLoading || !user) return;
    fetchData();
  }, [user, authLoading]);

  async function fetchData() {
    const { data: barber } = await supabase
      .from('barbers')
      .select('id')
      .eq('user_id', user!.id)
      .single();
    if (!barber) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('appointments')
      .select('*, service:services(*), profile:profiles(*)')
      .eq('barber_id', barber.id)
      .order('date', { ascending: false })
      .order('time', { ascending: true });

    if (data) setAppointments(data as AppointmentWithRelations[]);
    setLoading(false);
  }

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter((a) =>
    filter === 'upcoming' ? a.date >= today && a.status !== 'cancelled' : a.date < today || a.status === 'cancelled'
  );

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">Meus Agendamentos</h2>
        <div className="flex gap-2">
          {(['upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {f === 'upcoming' ? 'Próximos' : 'Anteriores'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((appt, i) => (
          <motion.div
            key={appt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-medium text-sm shrink-0">
                  {appt.profile?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <User size={14} className="text-white/30 shrink-0" />
                    {appt.profile?.name || 'Cliente'}
                  </p>
                  <p className="text-sm text-white/70 flex items-center gap-2">
                    <Scissors size={14} className="text-white/30 shrink-0" />
                    {appt.service?.name || 'Serviço'}
                  </p>
                  <p className="text-xs text-white flex items-center gap-1 mt-0.5">
                    <Calendar size={12} className="text-gold shrink-0" />
                    {formatDate(appt.date)} às {formatTime(appt.time)}
                  </p>
                </div>
              </div>
              <Badge variant={statusVariant[appt.status] || 'default'} className="self-start sm:self-auto shrink-0">
                {statusLabel[appt.status] || appt.status}
              </Badge>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-lg">
              {filter === 'upcoming' ? 'Nenhum agendamento futuro' : 'Nenhum agendamento anterior'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
