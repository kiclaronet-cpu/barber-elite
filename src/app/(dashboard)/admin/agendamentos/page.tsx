'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Check, X, CheckCheck, Calendar } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment, Barber, Service, Profile } from '@/lib/types';

type AppointmentWithRelations = Appointment & { barber?: Barber; service?: Service; profile?: Profile };

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

export default function AdminAgendamentos() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberFilter, setBarberFilter] = useState<string>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchData();
  }, [profile, authLoading]);

  async function fetchData() {
    const [apptsResult, barbersResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, barber:barbers(*), service:services(*), profile:profiles(*)')
        .order('date', { ascending: false })
        .order('time', { ascending: true }),
      supabase.from('barbers').select('*').eq('active', true),
    ]);
    if (apptsResult.data) setAppointments(apptsResult.data as AppointmentWithRelations[]);
    if (barbersResult.data) setBarbers(barbersResult.data as Barber[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    fetchData();
  }

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (barberFilter !== 'all' && a.barber_id !== barberFilter) return false;
    if (dateFrom && a.date < dateFrom) return false;
    if (dateTo && a.date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = a.profile?.name?.toLowerCase() || '';
      const barber = a.barber?.name?.toLowerCase() || '';
      const service = a.service?.name?.toLowerCase() || '';
      if (!name.includes(q) && !barber.includes(q) && !service.includes(q)) return false;
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="Agendamentos" />
        <div className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Buscar por cliente, barbeiro ou serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
            >
              <option value="all">Todos os barbeiros</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
            />
          </div>

          <div className="space-y-3">
            {filtered.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card padding="md" className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-medium text-sm shrink-0">
                      {appt.profile?.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <p className="text-sm font-medium text-white truncate">{appt.profile?.name || 'Cliente'}</p>
                        <p className="text-xs text-white/40">{appt.profile?.email || ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">{appt.barber?.name || 'Barbeiro'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70 truncate">{appt.service?.name || 'Serviço'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white flex items-center gap-1">
                          <Calendar size={14} className="text-gold" />
                          {formatDate(appt.date)} às {formatTime(appt.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge variant={statusVariant[appt.status] || 'default'}>
                      {statusLabel[appt.status] || appt.status}
                    </Badge>
                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                      <>
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'confirmed')}
                            className="p-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Confirmar"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(appt.id, 'completed')}
                          className="p-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Concluir"
                        >
                          <CheckCheck size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(appt.id, 'cancelled')}
                          className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {appt.status === 'completed' && (
                      <span className="text-xs text-white/30 px-2">Concluído</span>
                    )}
                    {appt.status === 'cancelled' && (
                      <span className="text-xs text-white/30 px-2">Cancelado</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Calendar size={48} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-lg">Nenhum agendamento encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
