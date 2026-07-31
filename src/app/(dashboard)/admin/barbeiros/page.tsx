'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Pencil, Star, StarHalf, X, Clock, Camera, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { getDayName } from '@/lib/utils';
import type { Barber, BarberAvailability } from '@/lib/types';

export default function AdminBarbeiros() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [availModalOpen, setAvailModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', specialties: '', photo: '' });
  const [availabilities, setAvailabilities] = useState<BarberAvailability[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchBarbers();
  }, [profile, authLoading]);

  async function fetchBarbers() {
    const { data } = await supabase.from('barbers').select('*').order('name');
    if (data) setBarbers(data as Barber[]);
    setLoading(false);
  }

  async function handlePhotoUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${editing?.id || `novo-${Date.now()}`}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('barber-photos')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      setUploadError('Erro ao enviar foto: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('barber-photos').getPublicUrl(path);
    setForm((f) => ({ ...f, photo: urlData.publicUrl }));
    setUploading(false);
  }

  function handlePhotoRemove() {
    setForm((f) => ({ ...f, photo: '' }));
    setUploadError('');
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', specialties: '', photo: '' });
    setUploadError('');
    setModalOpen(true);
  }

  function openEdit(barber: Barber) {
    setEditing(barber);
    setForm({
      name: barber.name,
      description: barber.description || '',
      specialties: barber.specialties.join(', '),
      photo: barber.photo || '',
    });
    setUploadError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      photo: form.photo || null,
    };

    if (editing) {
      await supabase.from('barbers').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('barbers').insert({ ...payload, rating: 0, active: true });
    }
    setSaving(false);
    setModalOpen(false);
    fetchBarbers();
  }

  async function toggleActive(barber: Barber) {
    await supabase.from('barbers').update({ active: !barber.active }).eq('id', barber.id);
    fetchBarbers();
  }

  async function openAvailability(barber: Barber) {
    setSelectedBarber(barber);
    const { data } = await supabase.from('barber_availability').select('*').eq('barber_id', barber.id).order('day_of_week');
    setAvailabilities(data as BarberAvailability[] || []);
    setAvailModalOpen(true);
  }

  function renderStars(rating: number) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} size={14} className="fill-gold text-gold" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} size={14} className="fill-gold text-gold" />);
      } else {
        stars.push(<Star key={i} size={14} className="text-white/20" />);
      }
    }
    return stars;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="Barbeiros" />
        <div className="p-6 space-y-6">
          <div className="flex justify-end">
            <Button variant="gold" onClick={openNew} icon={<Plus size={18} />}>
              Novo Barbeiro
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((barber, i) => (
              <motion.div
                key={barber.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card padding="lg" className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-xl overflow-hidden shrink-0">
                        {barber.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={barber.photo} alt={barber.name} className="w-full h-full object-cover" />
                        ) : (
                          barber.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{barber.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {renderStars(barber.rating)}
                          <span className="text-xs text-white/40 ml-1">{barber.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={barber.active ? 'success' : 'error'}>
                      {barber.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {barber.description && (
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{barber.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {barber.specialties.map((spec) => (
                      <span key={spec} className="px-2.5 py-1 text-xs rounded-full bg-gold/10 text-gold border border-gold/20">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => openEdit(barber)}
                      className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-colors text-sm"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => openAvailability(barber)}
                      className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-colors text-sm"
                    >
                      <Clock size={14} />
                      Horários
                    </button>
                    <button
                      onClick={() => toggleActive(barber)}
                      className={`p-2 rounded-xl border transition-colors ${
                        barber.active
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Barbeiro' : 'Novo Barbeiro'}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photo} alt="Foto do barbeiro" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-white/30" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="gold"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  icon={<Upload size={16} />}
                >
                  {uploading ? 'Enviando...' : form.photo ? 'Trocar Foto' : 'Enviar Foto'}
                </Button>
                {form.photo && (
                  <Button variant="ghost" onClick={handlePhotoRemove} icon={<Trash2 size={16} />}>
                    Remover Foto
                  </Button>
                )}
              </div>
            </div>
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do barbeiro" />
            <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" />
            <Input label="Especialidades" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Corte, Barba, Hidratação" />
            <p className="text-xs text-white/30">Separe as especialidades por vírgula</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handleSave} loading={saving}>
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={availModalOpen} onClose={() => setAvailModalOpen(false)} title={`Horários - ${selectedBarber?.name || ''}`}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const avail = availabilities.find((a) => a.day_of_week === day);
              return (
                <div key={day} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm text-white font-medium">{getDayName(day)}</span>
                  {avail ? (
                    <span className="text-sm text-gold">{avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}</span>
                  ) : (
                    <span className="text-xs text-white/30">Indisponível</span>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      </div>
    </div>
  );
}
