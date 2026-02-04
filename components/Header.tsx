import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const [balance, setBalance] = React.useState<number | null>(null);

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
        <button className="relative p-2 text-slate-400 hover:text-slate-500 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
        </button>
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