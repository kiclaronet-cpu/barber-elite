'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDayName } from '@/lib/utils';
import type { Barber, BarberAvailability } from '@/lib/types';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

interface DayForm {
  open: boolean;
  start: string;
  end: string;
}

export default function BarbeiroHorarios() {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Record<number, DayForm>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    fetchData();
  }, [user, authLoading]);

  async function fetchData() {
    const { data } = await supabase
      .from('barbers')
      .select('*, availability:barber_availability(*)')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setBarber(data as Barber);
      const { data: avail } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', (data as Barber).id);

      const map: Record<number, DayForm> = {};
      DAYS.forEach((day) => {
        const a = (avail as BarberAvailability[] || []).find((x) => x.day_of_week === day);
        map[day] = a
          ? { open: true, start: a.start_time.slice(0, 5), end: a.end_time.slice(0, 5) }
          : { open: false, start: '09:00', end: '18:00' };
      });
      setDays(map);
    }
    setLoading(false);
  }

  function updateDay(day: number, field: keyof DayForm, value: string | boolean) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setMessage('');
  }

  async function handleSave() {
    if (!barber) return;
    setSaving(true);
    setMessage('');
    let error: string | null = null;

    const existing = await supabase
      .from('barber_availability')
      .select('day_of_week')
      .eq('barber_id', barber.id);
    const existingDays = new Set((existing.data || []).map((a) => a.day_of_week));

    for (const day of DAYS) {
      const d = days[day];
      if (!d) continue;
      if (d.open) {
        const payload = { barber_id: barber.id, day_of_week: day, start_time: d.start + ':00', end_time: d.end + ':00' };
        const { error: e } = existingDays.has(day)
          ? await supabase.from('barber_availability').update(payload).eq('barber_id', barber.id).eq('day_of_week', day)
          : await supabase.from('barber_availability').insert(payload);
        if (e) error = e.message;
      } else if (existingDays.has(day)) {
        const { error: e } = await supabase.from('barber_availability').delete().eq('barber_id', barber.id).eq('day_of_week', day);
        if (e) error = e.message;
      }
    }

    setSaving(false);
    setMessage(error ? 'Erro ao salvar: ' + error : 'Horários salvos com sucesso!');
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="text-center py-16">
        <Clock size={48} className="mx-auto text-white/20 mb-3" />
        <p className="text-white/40 text-lg">Nenhum perfil de barbeiro vinculado à sua conta.</p>
        <p className="text-white/30 text-sm mt-1">Peça ao administrador para vincular seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-gold" />
            <h3 className="text-white font-semibold">Meus Horários de Atendimento</h3>
          </div>
          <p className="text-sm text-white/40 mb-6">
            Defina os dias e horários em que você atende. Clientes só podem agendar dentro desses horários.
          </p>

          <div className="space-y-3">
            {DAYS.map((day) => {
              const d = days[day];
              if (!d) return null;
              return (
                <div key={day} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm text-white font-medium w-24 shrink-0">{getDayName(day)}</span>
                  <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={d.open}
                      onChange={(e) => updateDay(day, 'open', e.target.checked)}
                      className="accent-emerald-500"
                    />
                    Atende
                  </label>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <input
                      type="time"
                      value={d.start}
                      disabled={!d.open}
                      onChange={(e) => updateDay(day, 'start', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-30 focus:outline-none focus:border-gold/50"
                    />
                    <span className="text-white/30">até</span>
                    <input
                      type="time"
                      value={d.end}
                      disabled={!d.open}
                      onChange={(e) => updateDay(day, 'end', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-30 focus:outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {message && (
            <div className={`flex items-center gap-2 text-sm mt-4 rounded-lg px-4 py-3 ${
              message.startsWith('Erro')
                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            }`}>
              <CheckCircle size={16} />
              {message}
            </div>
          )}

          <div className="flex justify-end mt-5">
            <Button variant="gold" onClick={handleSave} loading={saving} icon={<Save size={16} />}>
              Salvar Horários
            </Button>
          </div>
        </Card>
      </motion.div>

      <p className="text-xs text-white/30 text-center">
        Logado como {profile?.name} • {profile?.email}
      </p>
    </div>
  );
}
