'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Scissors, UserCog } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

interface RevenueItem {
  name: string;
  revenue: number;
  count: number;
}

export default function AdminFinanceiro() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [yearRevenue, setYearRevenue] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [yearCount, setYearCount] = useState(0);
  const [topServices, setTopServices] = useState<RevenueItem[]>([]);
  const [topBarbers, setTopBarbers] = useState<RevenueItem[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchFinance();
  }, [profile, authLoading]);

  async function fetchFinance() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    const [todayData, monthData, yearData] = await Promise.all([
      supabase.from('appointments').select('price').eq('date', today).eq('status', 'completed'),
      supabase.from('appointments').select('price, barber:barbers(name), service:services(name)').gte('date', monthStartStr).eq('status', 'completed'),
      supabase.from('appointments').select('price').gte('date', yearStart).eq('status', 'completed'),
    ]);

    const todayResult = todayData.data || [];
    setTodayRevenue(todayResult.reduce((sum: number, a: any) => sum + (a.price || 0), 0));
    setTodayCount(todayResult.length);

    const monthResult = monthData.data || [];
    setMonthRevenue(monthResult.reduce((sum: number, a: any) => sum + (a.price || 0), 0));
    setMonthCount(monthResult.length);

    const yearResult = yearData.data || [];
    setYearRevenue(yearResult.reduce((sum: number, a: any) => sum + (a.price || 0), 0));
    setYearCount(yearResult.length);

    const serviceMap: Record<string, RevenueItem> = {};
    const barberMap: Record<string, RevenueItem> = {};

    monthResult.forEach((a: any) => {
      const sName = a.service?.name || 'Desconhecido';
      const bName = a.barber?.name || 'Desconhecido';
      const price = a.price || 0;

      if (!serviceMap[sName]) serviceMap[sName] = { name: sName, revenue: 0, count: 0 };
      serviceMap[sName].revenue += price;
      serviceMap[sName].count += 1;

      if (!barberMap[bName]) barberMap[bName] = { name: bName, revenue: 0, count: 0 };
      barberMap[bName].revenue += price;
      barberMap[bName].count += 1;
    });

    setTopServices(Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
    setTopBarbers(Object.values(barberMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
    setLoading(false);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
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

  const maxServiceRev = topServices[0]?.revenue || 1;
  const maxBarberRev = topBarbers[0]?.revenue || 1;

  const revenueCards = [
    { label: 'Receita Hoje', value: todayRevenue, count: todayCount, icon: <TrendingUp size={22} />, period: 'Hoje' },
    { label: 'Receita do Mês', value: monthRevenue, count: monthCount, icon: <DollarSign size={22} />, period: 'Este mês' },
    { label: 'Receita do Ano', value: yearRevenue, count: yearCount, icon: <TrendingUp size={22} />, period: 'Este ano' },
  ];

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="Financeiro" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revenueCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card padding="lg" className="relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/50 mb-1">{card.label}</p>
                      <p className="text-2xl font-bold text-gold">{formatPrice(card.value)}</p>
                      <p className="text-xs text-white/30 mt-1">{card.count} serviços • {card.period}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gold/10 text-gold">
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((card.value / (yearRevenue || 1)) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Scissors size={18} className="text-gold" />
                    Serviços com Maior Receita
                  </h3>
                  <Badge variant="gold">Este mês</Badge>
                </div>
                <div className="space-y-5">
                  {topServices.length > 0 ? (
                    topServices.map((item, i) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white/30 w-5">{i + 1}</span>
                            <span className="text-sm text-white">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gold font-medium">{formatPrice(item.revenue)}</span>
                            <span className="text-xs text-white/30 ml-2">({item.count}x)</span>
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden ml-8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.revenue / maxServiceRev) * 100}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Scissors size={40} className="mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">Nenhum serviço realizado este mês</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <UserCog size={18} className="text-gold" />
                    Barbeiros com Maior Receita
                  </h3>
                  <Badge variant="gold">Este mês</Badge>
                </div>
                <div className="space-y-5">
                  {topBarbers.length > 0 ? (
                    topBarbers.map((item, i) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white/30 w-5">{i + 1}</span>
                            <span className="text-sm text-white">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gold font-medium">{formatPrice(item.revenue)}</span>
                            <span className="text-xs text-white/30 ml-2">({item.count}x)</span>
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden ml-8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.revenue / maxBarberRev) * 100}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <UserCog size={40} className="mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">Nenhum dado disponível este mês</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
