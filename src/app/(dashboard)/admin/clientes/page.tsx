'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, Calendar, Scissors } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/lib/types';

interface ClientRow {
  profile: Profile;
  totalAppointments: number;
  lastVisit: string | null;
}

export default function AdminClientes() {
  const { profile: adminProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!adminProfile || adminProfile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchClients();
  }, [adminProfile, authLoading]);

  async function fetchClients() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cliente')
      .order('name');

    if (!profiles) {
      setLoading(false);
      return;
    }

    const clientRows: ClientRow[] = await Promise.all(
      (profiles as Profile[]).map(async (p) => {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', p.id);

        const { data: last } = await supabase
          .from('appointments')
          .select('date')
          .eq('user_id', p.id)
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(1);

        return {
          profile: p,
          totalAppointments: count || 0,
          lastVisit: last && last.length > 0 ? last[0].date : null,
        };
      })
    );

    setClients(clientRows);
    setLoading(false);
  }

  const filtered = clients.filter(
    (c) =>
      c.profile.name.toLowerCase().includes(search.toLowerCase()) ||
      c.profile.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <AdminHeader title="Clientes" />
        <div className="p-6 space-y-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          <div className="space-y-3">
            {filtered.map((client, i) => (
              <motion.div
                key={client.profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card padding="md" className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-lg shrink-0">
                      {client.profile.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <p className="text-sm font-medium text-white truncate">{client.profile.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-white/30 shrink-0" />
                        <span className="text-sm text-white/60 truncate">{client.profile.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-white/30 shrink-0" />
                        <span className="text-sm text-white/60">{client.profile.phone || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Scissors size={14} className="text-gold shrink-0" />
                          <span className="text-sm text-white/60">{client.totalAppointments}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gold shrink-0" />
                          <span className="text-sm text-white/60">
                            {client.lastVisit ? formatDate(client.lastVisit) : 'Nunca'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={client.totalAppointments > 0 ? 'gold' : 'default'}>
                    {client.totalAppointments} agendamentos
                  </Badge>
                </Card>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <UsersIcon className="mx-auto text-white/20 mb-3" size={48} />
                <p className="text-white/40 text-lg">Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
