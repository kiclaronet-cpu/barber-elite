'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Trash2, CheckCircle, Clock, Save } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDayName } from '@/lib/utils';

interface BusinessHour {
  id: number;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function AdminConfiguracoes() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchConfig();
  }, [profile, authLoading]);

  async function fetchConfig() {
    const { data } = await supabase.from('site_config').select('logo_url').eq('id', 1).single();
    setLogoUrl(data?.logo_url || null);
    const { data: hoursData } = await supabase.from('business_hours').select('*').order('day_of_week');
    setHours((hoursData as BusinessHour[]) || []);
    setLoading(false);
  }

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setMessage('');

    const ext = file.name.split('.').pop() || 'png';
    const path = `logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      setMessage('Erro ao enviar imagem: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: configError } = await supabase
      .from('site_config')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (configError) {
      setMessage('Erro ao salvar configuração: ' + configError.message);
      setUploading(false);
      return;
    }

    setLogoUrl(publicUrl);
    setUploading(false);
    setMessage('Logo atualizada com sucesso!');
  }

  async function handleRemove() {
    setSaving(true);
    await supabase.from('site_config').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', 1);
    setLogoUrl(null);
    setSaving(false);
    setMessage('Logo removida.');
  }

  function updateHour(day: number, field: 'open_time' | 'close_time' | 'closed', value: string | boolean) {
    setHours(prev => prev.map(h => (h.day_of_week === day ? { ...h, [field]: value } : h)));
  }

  async function saveHours() {
    setHoursSaving(true);
    setHoursMessage('');
    let error: string | null = null;

    for (const h of hours) {
      const { error: e } = await supabase
        .from('business_hours')
        .update({ open_time: h.open_time, close_time: h.close_time, closed: h.closed })
        .eq('day_of_week', h.day_of_week);
      if (e) error = e.message;
    }

    setHoursSaving(false);
    setHoursMessage(error ? 'Erro ao salvar: ' + error : 'Horários salvos com sucesso!');
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="Configurações" />
        <div className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="lg" className="max-w-xl">
              <h3 className="text-white font-semibold mb-1">Logo da Barbearia</h3>
              <p className="text-sm text-white/40 mb-6">
                Envie o logo que aparecerá no topo do site e no painel admin.
              </p>

              <div className="flex items-center gap-6 mb-6">
                <div className="w-40 h-24 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-white/30">
                      <ImageIcon size={32} className="mx-auto mb-2" />
                      <span className="text-xs">Sem logo</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="gold"
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploading}
                    icon={<Upload size={16} />}
                  >
                    {uploading ? 'Enviando...' : logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                  </Button>
                  {logoUrl && (
                    <Button variant="ghost" onClick={handleRemove} loading={saving} icon={<Trash2 size={16} />}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>

              {message && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <CheckCircle size={16} />
                  {message}
                </div>
              )}

              <p className="text-xs text-white/30 mt-4">
                Formatos: PNG, JPG, SVG, WEBP. Recomendado: fundo transparente (PNG).
              </p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card padding="lg" className="max-w-xl">
              <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                <Clock size={18} className="text-gold" />
                Horário de Funcionamento
              </h3>
              <p className="text-sm text-white/40 mb-6">
                Defina os horários da barbearia. Clientes não podem agendar fora desses horários.
              </p>

              <div className="space-y-3">
                {DAYS.map((day) => {
                  const h = hours.find(x => x.day_of_week === day);
                  if (!h) return null;
                  return (
                    <div key={day} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-white font-medium w-24">{getDayName(day)}</span>
                      <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={h.closed}
                          onChange={(e) => updateHour(day, 'closed', e.target.checked)}
                          className="accent-red-500"
                        />
                        Fechado
                      </label>
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={h.open_time?.slice(0, 5) || '09:00'}
                          disabled={h.closed}
                          onChange={(e) => updateHour(day, 'open_time', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-30 focus:outline-none focus:border-gold/50"
                        />
                        <span className="text-white/30">até</span>
                        <input
                          type="time"
                          value={h.close_time?.slice(0, 5) || '18:00'}
                          disabled={h.closed}
                          onChange={(e) => updateHour(day, 'close_time', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-30 focus:outline-none focus:border-gold/50"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {hoursMessage && (
                <div className={`flex items-center gap-2 text-sm mt-4 rounded-lg px-4 py-3 ${
                  hoursMessage.startsWith('Erro')
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                    : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                }`}>
                  <CheckCircle size={16} />
                  {hoursMessage}
                </div>
              )}

              <div className="flex justify-end mt-5">
                <Button variant="gold" onClick={saveHours} loading={hoursSaving} icon={<Save size={16} />}>
                  Salvar Horários
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
