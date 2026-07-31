'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Scissors,
  UserCog,
  Calendar,
  Users,
  DollarSign,
  Settings,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteLogo } from '@/components/layout/SiteLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Barbeiros', href: '/admin/barbeiros', icon: <UserCog size={20} /> },
  { label: 'Serviços', href: '/admin/servicos', icon: <Scissors size={20} /> },
  { label: 'Agendamentos', href: '/admin/agendamentos', icon: <Calendar size={20} /> },
  { label: 'Clientes', href: '/admin/clientes', icon: <Users size={20} /> },
  { label: 'Financeiro', href: '/admin/financeiro', icon: <DollarSign size={20} /> },
  { label: 'Configurações', href: '/admin/configuracoes', icon: <Settings size={20} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <SiteLogo showText={false} iconClassName="w-8 h-8" />
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">Barber Elite</h1>
            <p className="text-gold text-xs font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.button
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/30 text-center">Barber Elite v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-secondary border border-white/10 text-white"
      >
        <Menu size={20} />
      </button>

      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-secondary border-r border-white/10 z-30">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-64 bg-secondary border-r border-white/10 z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
