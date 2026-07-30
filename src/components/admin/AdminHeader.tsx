'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Bell, User } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  title?: string;
  className?: string;
}

export function AdminHeader({ title, className }: AdminHeaderProps) {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-secondary/80 backdrop-blur-xl border-b border-white/10',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white lg:block">
          {title || 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
        >
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold text-[10px] font-bold text-primary flex items-center justify-center">
            0
          </span>
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">{profile?.name || 'Admin'}</p>
            <p className="text-xs text-white/40">Administrador</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-charcoal flex items-center justify-center border border-white/10">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={16} className="text-white/60" />
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 transition-colors"
          title="Sair"
        >
          <LogOut size={18} />
        </motion.button>
      </div>
    </header>
  );
}
