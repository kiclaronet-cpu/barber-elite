'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  DollarSign,
  Star,
  Scissors,
  Calendar as CalendarIcon,
  MapPin,
  User,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatPrice, generateTimeSlots, getMonthName } from '@/lib/utils';
import type { Service, Barber, TimeSlot } from '@/lib/types';

interface BookingFlowProps {
  onComplete?: () => void;
}

const steps = [
  { number: 1, label: 'Serviço' },
  { number: 2, label: 'Barbeiro' },
  { number: 3, label: 'Data & Hora' },
  { number: 4, label: 'Confirmar' },
];

const stepVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export default function BookingFlow({ onComplete }: BookingFlowProps) {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const [businessHours, setBusinessHours] = useState<Record<number, { open_time: string | null; close_time: string | null; closed: boolean }>>({});

  useEffect(() => {
    const fetchData = async () => {
      const [servicesRes, barbersRes, hoursRes] = await Promise.all([
        supabase.from('services').select('*').eq('active', true),
        supabase.from('barbers').select('*').eq('active', true),
        supabase.from('business_hours').select('*'),
      ]);

      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (barbersRes.data) {
        setBarbers(barbersRes.data as Barber[]);

        const params = new URLSearchParams(window.location.search);
        const presetBarber = params.get('barber');
        if (presetBarber) {
          const match = (barbersRes.data as Barber[]).find((b) => b.id === presetBarber);
          if (match) {
            setSelectedBarber(match);
            setCurrentStep(2);
          }
        }
      }
      if (hoursRes.data) {
        const map: Record<number, { open_time: string | null; close_time: string | null; closed: boolean }> = {};
        hoursRes.data.forEach((h: any) => {
          map[h.day_of_week] = { open_time: h.open_time, close_time: h.close_time, closed: h.closed };
        });
        setBusinessHours(map);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!selectedBarber || !selectedDate) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);

      const dayOfWeek = new Date(selectedDate).getDay();

      const { data: availability } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', selectedBarber.id)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .single();

      if (!availability) {
        setTimeSlots([]);
        setSlotsLoading(false);
        return;
      }

      const businessDay = businessHours[dayOfWeek];

      if (businessDay?.closed || !businessDay?.open_time || !businessDay?.close_time) {
        setTimeSlots([]);
        setSlotsLoading(false);
        return;
      }

      const { data: existing } = await supabase
        .from('appointments')
        .select('time, end_time')
        .eq('barber_id', selectedBarber.id)
        .eq('date', selectedDate)
        .neq('status', 'cancelled');

      const bookedTimes = (existing || []).map((a) => a.time);

      const duration = selectedService?.duration || 60;

      const barberStart = availability.start_time;
      const barberEnd = availability.end_time;
      const bizStart = businessDay.open_time;
      const bizEnd = businessDay.close_time;

      const slots = generateTimeSlots(
        barberStart > bizStart ? barberStart : bizStart,
        barberEnd < bizEnd ? barberEnd : bizEnd,
        duration,
        bookedTimes
      );

      const isToday =
        selectedDate === new Date().toISOString().split('T')[0];

      const filteredSlots = isToday
        ? slots.map((slot) => {
            const now = new Date();
            const slotDate = new Date(`${selectedDate}T${slot.time}:00`);
            return {
              ...slot,
              available: slot.available && slotDate.getTime() > now.getTime() + 30 * 60000,
            };
          })
        : slots;

      setTimeSlots(filteredSlots);
      setSlotsLoading(false);
    };

    fetchSlots();
  }, [selectedBarber, selectedDate, selectedService, supabase]);

  const calendarDays = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth, currentYear]);

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < 4) goToStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!selectedService;
      case 2: return !!selectedBarber;
      case 3: return !!selectedDate && !!selectedTime;
      case 4: return true;
      default: return false;
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isDateInPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) return;

    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSubmitting(false);
      return;
    }

    const startMinutes =
      parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]);
    const endMinutes = startMinutes + selectedService.duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    const { error } = await supabase.from('appointments').insert({
      user_id: userData.user.id,
      barber_id: selectedBarber.id,
      service_id: selectedService.id,
      date: selectedDate,
      time: selectedTime,
      end_time: endTime,
      status: 'pending',
      notes: notes || null,
    });

    setSubmitting(false);

    if (!error) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, email, phone')
          .eq('id', userData.user.id)
          .single();

        if (profileData) {
          const dateParts = selectedDate.split('-');
          const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          fetch('/api/email/confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profileData.email,
              name: profileData.name || 'Cliente',
              service: selectedService.name,
              barber: selectedBarber.name,
              date: displayDate,
              time: selectedTime,
              price: `R$ ${selectedService.price.toFixed(2).replace('.', ',')}`,
              duration: selectedService.duration,
              status: 'pending',
            }),
          }).catch(() => {});
          fetch('/api/telegram/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: profileData.name || 'Cliente',
              phone: profileData.phone || '',
              service: selectedService.name,
              barber: selectedBarber.name,
              date: displayDate,
              time: selectedTime,
              price: `R$ ${selectedService.price.toFixed(2).replace('.', ',')}`,
              duration: selectedService.duration,
              status: 'pending',
            }),
          }).catch(() => {});
        }
      } catch {}
      setSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModal(false);
    onComplete?.();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                currentStep > step.number
                  ? 'bg-gold text-primary'
                  : currentStep === step.number
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'bg-white/5 text-white/30 border border-white/10'
              }`}
            >
              {currentStep > step.number ? (
                <Check size={16} />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`hidden sm:block text-sm ${
                currentStep >= step.number ? 'text-white' : 'text-white/30'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 mx-2 transition-colors duration-300 ${
                currentStep > step.number ? 'bg-gold/50' : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white text-center mb-6">
        Escolha o Serviço
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((service) => (
          <motion.button
            key={service.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedService(service)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 ${
              selectedService?.id === service.id
                ? 'bg-gold/10 border-gold/40 shadow-premium'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedService?.id === service.id
                    ? 'bg-gold/20'
                    : 'bg-white/10'
                }`}
              >
                <Scissors
                  size={18}
                  className={
                    selectedService?.id === service.id ? 'text-gold' : 'text-white/50'
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {service.name}
                </h4>
                {service.description && (
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gold font-medium">
                    {formatPrice(service.price)}
                  </span>
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Clock size={10} />
                    {service.duration}min
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white text-center mb-6">
        Escolha o Barbeiro
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {barbers.map((barber) => (
          <motion.button
            key={barber.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBarber(barber)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 ${
              selectedBarber?.id === barber.id
                ? 'bg-gold/10 border-gold/40 shadow-premium'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                  selectedBarber?.id === barber.id
                    ? 'ring-2 ring-gold'
                    : 'ring-1 ring-white/10'
                }`}
              >
                {barber.photo ? (
                  <img
                    src={barber.photo}
                    alt={barber.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User
                    size={20}
                    className={
                      selectedBarber?.id === barber.id ? 'text-gold' : 'text-white/50'
                    }
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">{barber.name}</h4>
                {barber.specialties && barber.specialties.length > 0 && (
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">
                    {barber.specialties.join(', ')}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <Star size={12} className="fill-gold text-gold" />
                  <span className="text-xs text-white/60">
                    {barber.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const today = new Date();
    const isCurrentMonth =
      currentMonth === today.getMonth() && currentYear === today.getFullYear();

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white text-center mb-2">
          Escolha a Data & Horário
        </h3>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-white">
            {getMonthName(currentMonth)} {currentYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-xs text-white/30 py-2">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            const isPast = day !== null && isCurrentMonth && isDateInPast(day);
            const isSelected =
              day !== null &&
              selectedDate ===
                `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = day !== null ? new Date(currentYear, currentMonth, day).getDay() : -1;
            const bizDay = businessHours[dayOfWeek];
            const isClosed = day !== null && (bizDay?.closed || !bizDay?.open_time || !bizDay?.close_time);
            const isDisabled = day === null || isPast || isClosed;

            return (
              <button
                key={index}
                disabled={isDisabled}
                onClick={() => {
                  if (day) {
                    const monthStr = String(currentMonth + 1).padStart(2, '0');
                    const dayStr = String(day).padStart(2, '0');
                    setSelectedDate(`${currentYear}-${monthStr}-${dayStr}`);
                    setSelectedTime('');
                  }
                }}
                className={`w-full aspect-square rounded-lg text-sm flex items-center justify-center transition-all duration-200 ${
                  isDisabled
                    ? 'text-white/10 cursor-not-allowed'
                    : isSelected
                    ? 'bg-gold text-primary font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {day || ''}
              </button>            );
          })}
        </div>

        {selectedDate && (
          <div>
            <p className="text-sm text-white/50 mb-3 flex items-center gap-2">
              <Clock size={14} />
              Horários disponíveis
            </p>
            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : timeSlots.length === 0 ? (
              selectedDate && (() => {
                const dw = new Date(selectedDate).getDay();
                const bizDay = businessHours[dw];
                const closed = bizDay?.closed || !bizDay?.open_time || !bizDay?.close_time;
                return (
                  <p className="text-center text-white/30 text-sm py-4">
                    {closed
                      ? 'Barbearia fechada nesta data'
                      : 'Nenhum horário disponível nesta data'}
                  </p>
                );
              })()
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      !slot.available
                        ? 'bg-white/5 text-white/20 cursor-not-allowed line-through'
                        : selectedTime === slot.time
                        ? 'bg-gold text-primary font-semibold'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {slot.time.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white text-center mb-4">
        Confirme seu Agendamento
      </h3>

      <Card padding="md" className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
            <Scissors size={16} className="text-gold" />
          </div>
          <div>
            <p className="text-xs text-white/40">Serviço</p>
            <p className="text-sm font-medium text-white">{selectedService?.name}</p>
            <p className="text-xs text-white/40">{selectedService?.duration} minutos</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gold font-semibold">
              {formatPrice(selectedService?.price || 0)}
            </p>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <User size={16} className="text-white/70" />
          </div>
          <div>
            <p className="text-xs text-white/40">Barbeiro</p>
            <p className="text-sm font-medium text-white">{selectedBarber?.name}</p>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <CalendarIcon size={16} className="text-white/70" />
          </div>
          <div>
            <p className="text-xs text-white/40">Data & Horário</p>
            <p className="text-sm font-medium text-white">
              {new Date(selectedDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-white/70">{selectedTime}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <label className="block text-sm text-white/70 flex items-center gap-2">
          <FileText size={14} />
          Observações (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alguma observação para o barbeiro?"
          rows={2}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-200 resize-none"
        />
      </div>

      <Card padding="md" gold className="flex items-center justify-between">
        <span className="text-sm text-white/70">Valor Total</span>
        <span className="text-xl font-bold text-gold">
          {formatPrice(selectedService?.price || 0)}
        </span>
      </Card>
    </div>
  );

  return (
    <div>
      {renderStepIndicator()}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
        <div>
          {currentStep > 1 && (
            <Button variant="ghost" size="md" icon={<ChevronLeft size={16} />} onClick={prevStep}>
              Voltar
            </Button>
          )}
        </div>
        <div>
          {currentStep < 4 ? (
            <Button
              variant="gold"
              size="md"
              icon={<ChevronRight size={16} />}
              disabled={!canProceed()}
              onClick={nextStep}
            >
              Avançar
            </Button>
          ) : (
            <Button
              variant="gold"
              size="lg"
              icon={<Check size={18} />}
              loading={submitting}
              onClick={handleConfirm}
            >
              Confirmar Agendamento
            </Button>
          )}
        </div>
      </div>

      <Modal open={successModal} onClose={handleSuccessClose} title="Agendamento Confirmado!">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-gold" />
          </div>
          <p className="text-white/60 text-sm max-w-sm">
            Seu agendamento foi realizado com sucesso. Aguardamos você na Barber Elite!
          </p>
          <Button
            variant="gold"
            size="md"
            className="mt-6"
            onClick={handleSuccessClose}
          >
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
