import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [hasUnread, setHasUnread] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch Balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        if (profile) setBalance(profile.balance);

        // Fetch Notifications
        const { data: notifs, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(10); // Limit to recent 10 for header

        if (notifs) {
          setNotifications(notifs);
          setHasUnread(notifs.some((n: any) => !n.is_read));
        }
      }
    };
    fetchData();

    // Realtime subscription could be added here later
  }, []);

  const markAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read && n.user_id).map(n => n.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      // Update local state
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      setHasUnread(false);
    }
  };

  const handleToggleNotifications = () => {
    if (!showNotifications && hasUnread) {
      markAsRead();
    }
    setShowNotifications(!showNotifications);
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark z-10 shrink-0">
      <div className="flex items-center gap-4 lg:hidden">
        <button
          onClick={onToggleSidebar}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
        >
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
            onClick={handleToggleNotifications}
            className="relative p-2 text-slate-400 hover:text-slate-500 dark:hover:text-white transition-colors outline-none"
          >
            <span className="material-symbols-outlined">notifications</span>
            {hasUnread && (
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white text-sm">Notificações</span>
                <button
                  onClick={markAsRead}
                  className="text-[10px] text-primary font-medium cursor-pointer hover:underline disabled:opacity-50"
                  disabled={!hasUnread}
                >
                  Marcar como lidas
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Nenhuma notificação.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-[#111a22] transition-colors cursor-pointer border-b border-slate-100 dark:border-border-dark/50 last:border-0 ${!notif.is_read ? 'bg-primary/5' : ''}`}>
                      <div className="flex gap-3">
                        <div className={`mt-1 size-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                          <span className={`material-symbols-outlined text-sm ${notif.type === 'warning' ? 'text-amber-500' : 'text-primary'}`}>
                            {notif.type === 'warning' ? 'warning' : 'notifications'}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${!notif.is_read ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(notif.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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