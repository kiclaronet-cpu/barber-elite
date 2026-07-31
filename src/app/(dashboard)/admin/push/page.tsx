'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Send, Smartphone, Users, CheckCircle, History } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentUser {
  user_id: string;
  created_at: string;
  profile: { name: string; email: string } | null;
}

export default function AdminPush() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchStats();
  }, [profile, authLoading]);

  async function fetchStats() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;
    try {
      const res = await fetch('/api/push/send', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setTotal(data.total);
        setRecent(data.recent || []);
      }
    } catch {}
    setLoading(false);
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setResult({ type: 'err', text: 'Preencha o título e a mensagem.' });
      return;
    }
    setSending(true);
    setResult(null);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setSending(false);
      setResult({ type: 'err', text: 'Sessão expirada. Faça login novamente.' });
      return;
    }
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || null }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({
          type: 'ok',
          text: `Enviado para ${data.sent} dispositivo(s). ${data.removed > 0 ? `${data.removed} inscrição(ões) inválida(s) removida(s).` : ''}${data.failed > 0 ? ` ${data.failed} falha(s).` : ''}`,
        });
        fetchStats();
      } else {
        setResult({ type: 'err', text: data.error || 'Erro ao enviar.' });
      }
    } catch {
      setResult({ type: 'err', text: 'Erro de conexão. Tente novamente.' });
    }
    setSending(false);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="Notificações Push" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card padding="md" className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gold/10 text-gold shrink-0">
                <Smartphone size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-sm text-white/50">dispositivos inscritos</p>
              </div>
            </Card>
            <Card padding="md" className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gold/10 text-gold shrink-0">
                <Users size={22} />
              </div>
              <div>
                <p className="text-sm text-white/60">
                  Clientes recebem quando ativam as notificações no painel do cliente.
                </p>
              </div>
            </Card>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="lg" className="max-w-2xl">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
                <Bell size={18} className="text-gold" />
                Enviar Mensagem
              </h3>
              <p className="text-sm text-white/40 mb-6">
                A mensagem chegará na tela dos celulares dos clientes com notificação ativada.
              </p>

              <div className="space-y-4">
                <Input
                  label="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Promoção da semana!"
                  maxLength={80}
                />
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Mensagem</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Ex: Corte + Barba com 20% de desconto até domingo!"
                    maxLength={240}
                    rows={4}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all resize-none"
                  />
                  <p className="text-xs text-white/30 mt-1 text-right">{body.length}/240</p>
                </div>
                <Input
                  label="Link ao tocar (opcional)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/cliente ou /cliente/agendamentos"
                />

                {result && (
                  <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
                    result.type === 'ok'
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-red-400 bg-red-500/10 border border-red-500/20'
                  }`}>
                    <CheckCircle size={16} />
                    {result.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="gold" onClick={handleSend} loading={sending} icon={<Send size={16} />}>
                    {sending ? 'Enviando...' : `Enviar para ${total} dispositivo(s)`}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {recent.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card padding="lg" className="max-w-2xl">
                <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <History size={18} className="text-gold" />
                  Últimos Inscritos
                </h3>
                <div className="space-y-2">
                  {recent.map((r) => (
                    <div key={r.user_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{r.profile?.name || 'Cliente'}</p>
                        <p className="text-xs text-white/40 truncate">{r.profile?.email || ''}</p>
                      </div>
                      <span className="text-xs text-white/30 shrink-0 ml-3">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
