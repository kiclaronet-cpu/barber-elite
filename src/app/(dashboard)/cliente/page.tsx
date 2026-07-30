'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Scissors,
  Heart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime, formatPrice } from '@/lib/utils';
import type { Appointment } from '@/lib/types';

interface DashboardData {
  nextAppointment: Appointment | null;
  totalAppointments: number;
  favoritesCount: number;
}

export default function ClienteDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    nextAppointment: null,
    totalAppointments: 0,
    favoritesCount: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: nextAppt } = await supabase
        .from('appointments')
        .select('*, barber:barbers(*), service:services(*)')
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)
        .single();

      const { count: totalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setData({
        nextAppointment: nextAppt || null,
        totalAppointments: totalCount || 0,
        favoritesCount: favCount || 0,
      });
      setDataLoading(false);
    };

    fetchDashboardData();
  }, [user, supabase]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-gold" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Bem-vindo{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
        </div>
        <p className="text-white/50 text-sm md:text-base">
          Aqui está um resumo da sua experiência na Barber Elite
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div variants={itemVariants}>
          <Card padding="lg" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-gold" />
              </div>
              <p className="text-sm text-white/50 mb-1">Próximo Agendamento</p>
              {dataLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : data.nextAppointment ? (
                <div>
                  <p className="text-lg font-semibold text-white">
                    {data.nextAppointment.service?.name || 'Serviço'}
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    <Clock size={14} className="inline mr-1" />
                    {formatDate(data.nextAppointment.date)} às{' '}
                    {formatTime(data.nextAppointment.time)}
                  </p>
                  <p className="text-sm text-white/40">
                    com {data.nextAppointment.barber?.name || 'Barbeiro'}
                  </p>
                </div>
              ) : (
                <p className="text-white/40">Nenhum agendamento</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card padding="lg" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-white/70" />
              </div>
              <p className="text-sm text-white/50 mb-1">Total Agendamentos</p>
              {dataLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-white">
                  {data.totalAppointments}
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card padding="lg" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm text-white/50 mb-1">Favoritos</p>
              {dataLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-white">
                  {data.favoritesCount}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card padding="lg" gold className="relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-40 h-40 bg-gold/10 rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
            Agende seu próximo horário
          </h3>
              <p className="text-white/60 text-sm">
                Escolha o serviço, barbeiro e horário ideal para você
              </p>
            </div>
            <Link href="/cliente/agendamento/novo">
              <Button variant="gold" size="md" icon={<ArrowRight size={18} />}>
                Agendar Novo Horário
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
