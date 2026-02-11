import React from 'react';
import { NavLink } from 'react-router-dom';

import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = React.useState<{ full_name: string; balance: number } | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const ADMIN_EMAIL = 'brunomeueditor@gmail.com';

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const { data } = await supabase
          .from('profiles')
          .select('full_name, balance')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/' },
    { name: 'Novo Pedido', icon: 'add_circle', path: '/new-order' },
    { name: 'Adicionar Saldo', icon: 'account_balance_wallet', path: '/add-funds' },
    { name: 'Histórico', icon: 'list_alt', path: '/history' },
    { name: 'Minha Conta', icon: 'person', path: '/account' },
    // Only show Config API for admin
    ...(userEmail === ADMIN_EMAIL ? [{ name: 'Config API', icon: 'api', path: '/api' }] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 h-full border-r border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col flex-shrink-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-blue-600 p-2 rounded-lg shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-2xl">diamond</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white">SocialPrime</h1>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mt-1">Premium Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 mt-2">Menu Principal</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }} // Close on mobile navigation
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                  ? 'bg-primary text-white font-medium shadow-md shadow-primary/20'
                  : 'text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}

          {userEmail === ADMIN_EMAIL && (
            <>
              <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 mt-6">Administração</p>
              <NavLink
                to="/admin"
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-primary text-white font-medium shadow-md shadow-primary/20'
                    : 'text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                <span className="text-sm font-medium">Painel Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#0f1520]">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-primary"
              style={{ backgroundImage: `url('https://i.pravatar.cc/150?img=11')` }}
            ></div>
            <div className="flex flex-col">
              <span className="text-sm font-bold dark:text-white truncate max-w-[140px]">{profile?.full_name || 'Usuário'}</span>
              <span className="text-xs text-slate-500 dark:text-text-secondary">R$ {profile?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;