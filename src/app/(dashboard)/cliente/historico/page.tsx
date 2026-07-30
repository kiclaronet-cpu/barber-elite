'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  User,
  Star,
  MessageSquare,
  Calendar,
  History,
  Send,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime, formatPrice } from '@/lib/utils';
import type { Appointment, Review } from '@/lib/types';

export default function HistoricoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [appointments, setAppointments] = useState<(Appointment & { review?: Review | null })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    appointment: (Appointment & { review?: Review | null }) | null;
  }>({ open: false, appointment: null });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setDataLoading(true);

      const { data: appts } = await supabase
        .from('appointments')
        .select('*, barber:barbers(*), service:services(*)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (!appts) {
        setDataLoading(false);
        return;
      }

      const appointmentIds = appts.map((a) => a.id);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .in('appointment_id', appointmentIds);

      const reviewMap = new Map((reviews || []).map((r) => [r.appointment_id, r]));

      const enriched = appts.map((a) => ({
        ...a,
        review: reviewMap.get(a.id) || null,
      }));

      setAppointments(enriched as unknown as (Appointment & { review?: Review | null })[]);
      setDataLoading(false);
    };

    fetchHistory();
  }, [user, supabase]);

  const openReviewModal = (appointment: Appointment & { review?: Review | null }) => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setReviewModal({ open: true, appointment });
  };

  const submitReview = async () => {
    if (!reviewModal.appointment || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      user_id: user!.id,
      barber_id: reviewModal.appointment.barber_id,
      appointment_id: reviewModal.appointment.id,
      rating,
      comment: comment || null,
    });

    if (!error) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === reviewModal.appointment!.id
            ? { ...a, review: { rating, comment: comment || null } as Review }
            : a
        )
      );
    }

    setSubmitting(false);
    setReviewModal({ open: false, appointment: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Histórico</h1>
        <p className="text-white/50 text-sm mt-1">
          Todos os serviços que você já realizou conosco
        </p>
      </div>

      {dataLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <History className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum histórico encontrado
          </h3>
          <p className="text-white/40 text-sm max-w-md">
            Seus agendamentos concluídos aparecerão aqui. Agende seu primeiro serviço!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card padding="md" className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {appointment.service?.name || 'Serviço'}
                  </h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <User size={14} />
                      {appointment.barber?.name || 'Barbeiro'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(appointment.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {formatTime(appointment.time)} - {formatTime(appointment.end_time)}
                    </span>
                    <span className="text-gold font-medium">
                      {appointment.service?.price ? formatPrice(appointment.service.price) : ''}
                    </span>
                  </div>
                </div>
                {!appointment.review ? (
                  <Button
                    variant="gold"
                    size="sm"
                    icon={<Star size={14} />}
                    onClick={() => openReviewModal(appointment)}
                  >
                    Avaliar
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= (appointment.review?.rating || 0)
                              ? 'fill-gold text-gold'
                              : 'text-white/20'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white/40">Avaliado</span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, appointment: null })}
        title="Avaliar Serviço"
      >
        <div className="space-y-6">
          {reviewModal.appointment && (
            <div className="text-center">
              <p className="text-white font-medium mb-1">
                {reviewModal.appointment.service?.name}
              </p>
              <p className="text-sm text-white/40">
                com {reviewModal.appointment.barber?.name} em{' '}
                {formatDate(reviewModal.appointment.date)}
              </p>
            </div>
          )}

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    star <= (hoverRating || rating)
                      ? 'fill-gold text-gold'
                      : 'text-white/20'
                  }
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-white/70 flex items-center gap-2">
              <MessageSquare size={14} />
              Comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência..."
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-200 resize-none"
            />
          </div>

          <Button
            variant="gold"
            size="md"
            className="w-full"
            icon={<Send size={16} />}
            loading={submitting}
            disabled={rating === 0}
            onClick={submitReview}
          >
            Enviar Avaliação
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
