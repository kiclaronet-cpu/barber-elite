'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="p-6">
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
        </div>
      </div>
    </div>
  );
}
