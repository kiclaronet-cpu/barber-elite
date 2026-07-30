'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
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
import { formatPrice } from '@/lib/utils';
import type { Service } from '@/lib/types';

export default function AdminServicos() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchServices();
  }, [profile, authLoading]);

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*').order('name');
    if (data) setServices(data as Service[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', duration: '30' });
    setModalOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description || '',
      price: String(service.price),
      duration: String(service.duration),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      duration: parseInt(form.duration) || 30,
    };

    if (editing) {
      await supabase.from('services').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('services').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchServices();
  }

  async function toggleActive(service: Service) {
    await supabase.from('services').update({ active: !service.active }).eq('id', service.id);
    fetchServices();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('services').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchServices();
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="hidden lg:flex w-64 bg-secondary border-r border-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-16 bg-secondary/50 border-b border-white/10 animate-pulse" />
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
        <AdminHeader title="Serviços" />
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Buscar serviços..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
              />
            </div>
            <Button variant="gold" onClick={openNew} icon={<Plus size={18} />}>
              Novo Serviço
            </Button>
          </div>

          <div className="grid gap-3">
            {filtered.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card padding="md" className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <span className="text-gold text-lg font-serif font-bold">
                        {service.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium truncate">{service.name}</h4>
                        <Badge variant={service.active ? 'success' : 'error'}>
                          {service.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-white/40 truncate mt-0.5">{service.description}</p>
                      )}
                      <p className="text-xs text-white/30 mt-0.5">{service.duration} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-gold font-semibold text-lg">{formatPrice(service.price)}</span>
                    <button
                      onClick={() => toggleActive(service)}
                      className={`p-2 rounded-lg border transition-colors ${
                        service.active
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title={service.active ? 'Desativar' : 'Ativar'}
                    >
                      {service.active ? <X size={16} /> : <Plus size={16} />}
                    </button>
                    <button
                      onClick={() => openEdit(service)}
                      className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(service.id)}
                      className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/40 text-lg">Nenhum serviço encontrado</p>
              </div>
            )}
          </div>
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Serviço' : 'Novo Serviço'}>
          <div className="space-y-4">
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do serviço" />
            <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Preço (R$)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" />
              <Input label="Duração (min)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="30" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handleSave} loading={saving}>
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Exclusão">
          <p className="text-white/60 mb-6">Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="primary" className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete}>
              Excluir
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
