'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  X,
  AlertCircle,
  CalendarX,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/lib/types';

type FilterTab = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const filters: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
];

const statusConfig: Record<AppointmentStatus, { variant: 'gold' | 'success' | 'default' | 'error'; label: string }> = {
  pending: { variant: 'gold', label: 'Pendente' },
  confirmed: { variant: 'success', label: 'Confirmado' },
  completed: { variant: 'default', label: 'Concluído' },
  cancelled: { variant: 'error', label: 'Cancelado' },
};

export default function AgendamentosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [cancelModal, setCancelModal] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null,
  });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      setDataLoading(true);

      let query = supabase
        .from('appointments')
        .select('*, barber:barbers(*), service:services(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (activeFilter !== 'all') {
        query = query.eq('status', activeFilter);
      }

      const { data } = await query;

      if (data) {
        setAppointments(data as unknown as Appointment[]);
      }
      setDataLoading(false);
    };

    fetchAppointments();
  }, [user, activeFilter, supabase]);

  const handleCancel = async () => {
    if (!cancelModal.appointment) return;
    setCancelling(true);

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', cancelModal.appointment.id);

    if (!error) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === cancelModal.appointment!.id ? { ...a, status: 'cancelled' as AppointmentStatus } : a
        )
      );
    }

    setCancelling(false);
    setCancelModal({ open: false, appointment: null });
  };

  const filteredAppointments = activeFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === activeFilter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Meus Agendamentos</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie todos os seus agendamentos</p>
        </div>
        <Link href="/cliente/agendamento/novo">
          <Button variant="gold" size="sm" icon={<Plus size={16} />}>
            Novo Agendamento
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeFilter === filter.key
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <CalendarX className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {activeFilter === 'all' ? 'Nenhum agendamento encontrado' : `Nenhum agendamento ${activeFilter}`}
          </h3>
          <p className="text-white/40 text-sm max-w-md">
            {activeFilter === 'all'
              ? 'Você ainda não fez nenhum agendamento. Que tal agendar um horário agora?'
              : `Não há agendamentos com o status "${activeFilter}"`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const statusInfo = statusConfig[appointment.status];
            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card padding="md" className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {appointment.service?.name || 'Serviço'}
                      </h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50">
                      <span className="flex items-center gap-1.5">
                        <User size={14} />
                        {appointment.barber?.name || 'Barbeiro'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(appointment.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {formatTime(appointment.time)} - {formatTime(appointment.end_time)}
                      </span>
                    </div>
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-white/30 italic">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<X size={14} />}
                      onClick={() => setCancelModal({ open: true, appointment })}
                    >
                      Cancelar
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={cancelModal.open}
        onClose={() => setCancelModal({ open: false, appointment: null })}
        title="Cancelar Agendamento"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Tem certeza que deseja cancelar?</p>
              <p className="text-xs text-white/50 mt-1">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          {cancelModal.appointment && (
            <div className="space-y-1 text-sm text-white/50">
              <p>Serviço: {cancelModal.appointment.service?.name}</p>
              <p>Data: {formatDate(cancelModal.appointment.date)}</p>
              <p>Horário: {formatTime(cancelModal.appointment.time)}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => setCancelModal({ open: false, appointment: null })}
            >
              Voltar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              loading={cancelling}
              onClick={handleCancel}
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
