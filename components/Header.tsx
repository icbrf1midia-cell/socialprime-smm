import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    // Basic fetch for balance - ideally this would be in a global context
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        if (data) setBalance(data.balance);
      }
    };
    fetchBalance();
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark z-10 shrink-0">
      <div className="flex items-center gap-4 lg:hidden">
        <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-lg font-bold dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">diamond</span>
          SocialPrime
        </span>
      </div>

      {/* Search */}
      <div className="hidden lg:flex items-center max-w-md w-full">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          </span>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-transparent focus:border-primary rounded-lg leading-5 bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
            placeholder="Buscar serviços..."
            type="text"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">

        <div className="flex flex-col items-end mr-2 hidden md:flex">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Saldo Atual</span>
          <span className="text-white font-bold font-mono text-lg">
            R$ {balance !== null ? balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
          </span>
        </div>

        <Link
          to="/add-funds"
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-emerald-500/20"
        >
          <span className="truncate mr-2 hidden sm:inline">Add Saldo</span>
          <span className="material-symbols-outlined text-[18px]">add_card</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-500 dark:hover:text-white transition-colors outline-none"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white text-sm">Notificações</span>
                <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline">Marcar como lidas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-[#111a22] transition-colors cursor-pointer border-b border-slate-100 dark:border-border-dark/50 last:border-0">
                  <div className="flex gap-3">
                    <div className="mt-1 size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">rocket_launch</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Bem-vindo ao SocialPrime 2.0!</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Conheça nossa nova plataforma com entregas mais rápidas.</p>
                      <p className="text-[10px] text-slate-400 mt-2">Há 2 horas</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-[#111a22] transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <div className="mt-1 size-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-purple-500 text-sm">music_note</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Novos serviços de TikTok</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Adicionamos curtidas brasileiras reais para seus vídeos.</p>
                      <p className="text-[10px] text-slate-400 mt-2">Ontem</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Sair"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;