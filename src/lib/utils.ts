export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
  });
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function generateTimeSlots(
  start: string,
  end: string,
  duration: number,
  bookedIntervals: { start: string; end: string }[] = []
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let current = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const intervals = bookedIntervals.map((b) => ({
    start: toMin(b.start),
    end: Math.max(toMin(b.end), toMin(b.start) + 1),
  }));

  while (current + duration <= endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const slotEnd = current + duration;
    const overlaps = intervals.some(
      (b) => current < b.end && slotEnd > b.start
    );
    slots.push({ time, available: !overlaps });
    current += duration;
  }

  return slots;
}

export function getDayName(day: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[day];
}

export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[month];
}
