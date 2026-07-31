'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star, Trash2, ArrowRight, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Barber } from '@/lib/types';

interface Favorite {
  id: string;
  barber_id: string;
  barber: Barber;
}

export default function FavoritosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setDataLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('id, barber_id, barber:barbers(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setFavorites((data as unknown as Favorite[]) || []);
      setDataLoading(false);
    };

    fetchFavorites();
  }, [user, supabase]);

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Favoritos</h1>
        <p className="text-white/50 text-sm mt-1">
          Seus barbeiros preferidos, salvos para agendar mais rápido
        </p>
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum favorito ainda
          </h3>
          <p className="text-white/40 text-sm max-w-md mb-6">
            Toque no coração de um barbeiro para salvá-lo aqui e agendar com ele rapidinho.
          </p>
          <Link href="/cliente/agendamento/novo">
            <Button variant="gold" size="md" icon={<ArrowRight size={16} />}>
              Escolher um barbeiro
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card padding="md" className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {favorite.barber.photo ? (
                    <img
                      src={favorite.barber.photo}
                      alt={favorite.barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {favorite.barber.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-white/50 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="fill-gold text-gold" />
                      {favorite.barber.rating?.toFixed(1) || '5.0'}
                    </span>
                    <span className="truncate">
                      {favorite.barber.specialties?.slice(0, 2).join(' • ') || ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Link href={`/cliente/agendamento/novo?barber=${favorite.barber.id}`}>
                    <Button variant="gold" size="sm">
                      Agendar
                    </Button>
                  </Link>
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                    Remover
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
