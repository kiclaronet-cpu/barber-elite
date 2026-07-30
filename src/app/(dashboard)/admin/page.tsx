'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Users, DollarSign, Scissors, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatTime, formatDate } from '@/lib/utils';
import type { Appointment, Barber, Service, Profile } from '@/lib/types';

interface DashboardData {
  todayAppointments: number;
  newClients: number;
  monthlyRevenue: number;
  servicesCount: number;
  todayList: (Appointment & { barber?: Barber; service?: Service; profile?: Profile })[];
  popularServices: { name: string; count: number; revenue: number }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default' | 'gold'> = {
  confirmed: 'gold',
  completed: 'success',
  cancelled: 'error',
  pending: 'warning',
};

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchDashboard();
  }, [profile, authLoading]);

  async function fetchDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const [appointmentsToday, appointmentsMonth, profilesCount, servicesCount] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'confirmed'),
      supabase.from('appointments').select('price, service:services(name)').gte('date', monthStartStr).eq('status', 'completed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStartStr),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', monthStartStr).eq('status', 'completed'),
    ]);

    const monthlyRevenue = (appointmentsMonth.data || []).reduce((sum: number, a: any) => sum + (a.price || 0), 0);

    const { data: todayList } = await supabase
      .from('appointments')
      .select('*, barber:barbers(*), service:services(*), profile:profiles(*)')
      .eq('date', today)
      .order('time', { ascending: true })
      .limit(5);

    const { data: servicesData } = await supabase
      .from('appointments')
      .select('service:services(name)')
      .gte('date', monthStartStr)
      .eq('status', 'completed');

    const serviceCounts: Record<string, number> = {};
    (servicesData || []).forEach((a: any) => {
      const name = a.service?.name || 'Desconhecido';
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    const popularServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count, revenue: 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setData({
      todayAppointments: appointmentsToday.count || 0,
      newClients: profilesCount.count || 0,
      monthlyRevenue,
      servicesCount: servicesCount.count || 0,
      todayList: (todayList || []) as any,
      popularServices,
    });
    setLoading(false);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: 'Agendamentos Hoje', value: data?.todayAppointments || 0, icon: <Calendar size={22} />, color: 'text-gold' },
    { label: 'Clientes Novos (Mês)', value: data?.newClients || 0, icon: <Users size={22} />, color: 'text-emerald-400' },
    { label: 'Receita do Mês', value: formatPrice(data?.monthlyRevenue || 0), icon: <DollarSign size={22} />, color: 'text-gold' },
    { label: 'Serviços Realizados', value: data?.servicesCount || 0, icon: <Scissors size={22} />, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="Dashboard" />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, i) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card padding="lg" className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/50 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Clock size={18} className="text-gold" />
                    Agendamentos de Hoje
                  </h3>
                  <Badge variant="gold">{data?.todayAppointments || 0} agendamentos</Badge>
                </div>
                <div className="space-y-3">
                  {data?.todayList && data.todayList.length > 0 ? (
                    data.todayList.map((appt, i) => (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-medium text-sm">
                            {appt.profile?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{appt.profile?.name || 'Cliente'}</p>
                            <p className="text-xs text-white/40">{appt.service?.name || 'Serviço'} • {appt.barber?.name || 'Barbeiro'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gold font-medium">{formatTime(appt.time)}</p>
                          <Badge variant={statusVariant[appt.status] || 'default'}>
                            {appt.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Calendar size={40} className="mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">Nenhum agendamento para hoje</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp size={18} className="text-gold" />
                    Serviços Populares
                  </h3>
                  <Badge variant="gold">Este mês</Badge>
                </div>
                <div className="space-y-4">
                  {data?.popularServices && data.popularServices.length > 0 ? (
                    data.popularServices.map((service, i) => {
                      const maxCount = data.popularServices[0]?.count || 1;
                      const widthPercent = (service.count / maxCount) * 100;
                      return (
                        <motion.div
                          key={service.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-white/30 w-5">{i + 1}</span>
                              <span className="text-sm text-white">{service.name}</span>
                            </div>
                            <span className="text-sm text-gold font-medium">{service.count}x</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden ml-8">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10">
                      <TrendingUp size={40} className="mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">Nenhum serviço realizado este mês</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
