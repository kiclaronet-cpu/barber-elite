'use client';

import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface SiteLogoProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  showText?: boolean;
}

let cachedLogo: string | null | undefined;

export function SiteLogo({ className, textClassName, iconClassName, showText = true }: SiteLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (cachedLogo !== undefined) {
      setLogoUrl(cachedLogo ?? null);
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase.from('site_config').select('logo_url').eq('id', 1).single();
        cachedLogo = data?.logo_url || null;
        setLogoUrl(cachedLogo ?? null);
      } catch {
        setLogoUrl(null);
      }
    })();
  }, []);

  return (
    <span className={cn('flex items-center gap-2', className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Barber Elite"
          className={cn('h-9 w-9 rounded-full object-cover border border-white/10 bg-white/5 shrink-0', iconClassName)}
        />
      ) : (
        <Scissors className={cn('w-6 h-6 text-gold', iconClassName)} />
      )}
      {showText && (
        <span className={cn('text-xl font-bold tracking-wider text-gradient', textClassName)}>
          Barber Elite
        </span>
      )}
    </span>
  );
}
