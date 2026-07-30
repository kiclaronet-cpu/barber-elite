import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  center = true,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-2xl mb-16',
        center && 'mx-auto text-center',
        className
      )}
    >
      {badge && (
        <span className="inline-block px-4 py-1.5 text-xs font-medium tracking-wider uppercase text-gold bg-gold/10 border border-gold/20 rounded-full mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-white/60 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
