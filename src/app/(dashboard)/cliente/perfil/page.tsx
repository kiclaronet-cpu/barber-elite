'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function PerfilPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), phone: phone.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Meu Perfil</h1>
        <p className="text-white/50 text-sm mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-white mb-6">
              Informações Pessoais
            </h3>
            <form onSubmit={handleSave} className="space-y-5">
              <Input
                label="Nome completo"
                icon={<User size={18} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
              <Input
                label="Telefone"
                icon={<Phone size={18} />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
              <Input
                label="Email"
                icon={<Mail size={18} />}
                value={profile?.email || ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  icon={<Save size={16} />}
                  loading={saving}
                >
                  Salvar alterações
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircle size={16} />
                    Alterações salvas!
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg" className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-gold">
                {(profile?.name || 'C').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-lg font-semibold text-white mb-1">{profile?.name}</p>
            <p className="text-sm text-white/50 mb-4">{profile?.email}</p>
            <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Membro desde</span>
                <span className="text-white">
                  {formatDate(profile?.created_at || '')}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Plano</span>
                <span className="text-gold font-medium capitalize">{profile?.role}</span>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h4 className="font-semibold text-white mb-2">Precisa de ajuda?</h4>
            <p className="text-sm text-white/50 mb-3">
              Para alterar sua senha, use o botão &quot;Esqueci minha senha&quot; na tela de login.
            </p>
            <a
              href="/login"
              className="text-sm text-gold hover:text-gold/80 transition-colors"
            >
              Ir para o login →
            </a>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
