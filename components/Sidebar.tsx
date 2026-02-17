import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserProfile {
    full_name: string;
    avatar_url: string | null;
    email: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [unreadCount, setUnreadCount] = useState(0); // Notifications
    const [supportUnreadCount, setSupportUnreadCount] = useState(0); // Support Messages

    useEffect(() => {
        fetchProfile();
        fetchUnreadCount();

        // Listen for updates from Account page or elsewhere
        const handleUserUpdate = () => {
            fetchProfile();
            fetchUnreadCount();
        };
        window.addEventListener('userUpdated', handleUserUpdate);

        // Subscribe to ticket_messages to update badge in realtime
        const messageChannel = supabase
            .channel('sidebar_messages')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ticket_messages' },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('userUpdated', handleUserUpdate);
            supabase.removeChannel(messageChannel);
        };
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single();

            let finalAvatarUrl = null;
            if (data?.avatar_url) {
                const { data: publicDesc } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(data.avatar_url);
                finalAvatarUrl = publicDesc.publicUrl;
            }

            setProfile({
                full_name: data?.full_name || '',
                avatar_url: finalAvatarUrl,
                email: user.email || ''
            });
        }
    };

    const fetchUnreadCount = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const isAdmin = user.email === 'brunomeueditor@gmail.com';

            // 1. Notifications Count
            const { count: notifCount } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            let totalUnread = notifCount || 0;

            // Check for unread global notification
            const { data: globalNotif } = await supabase
                .from('notifications')
                .select('id')
                .is('user_id', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (globalNotif) {
                const lastSeenGlobal = localStorage.getItem('last_seen_global_id');
                if (globalNotif.id !== lastSeenGlobal) {
                    totalUnread += 1;
                }
            }

            // 2. Support Messages Count
            let supportUnread = 0;
            if (isAdmin) {
                // Admin: count messages from users (is_admin = false) that are unread
                const { count } = await supabase
                    .from('ticket_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_admin', false)
                    .is('read_at', null);
                supportUnread = count || 0;
            } else {
                // User: count messages from admin (is_admin = true) that are unread AND belong to user's tickets
                // Note: user_id check is complex in join, simpler to get user tickets first
                const { data: tickets } = await supabase.from('tickets').select('id').eq('user_id', user.id);
                if (tickets && tickets.length > 0) {
                    const ticketIds = tickets.map(t => t.id);
                    const { count } = await supabase
                        .from('ticket_messages')
                        .select('*', { count: 'exact', head: true })
                        .in('ticket_id', ticketIds)
                        .eq('is_admin', true)
                        .is('read_at', null);
                    supportUnread = count || 0;
                }
            }

            setUnreadCount(totalUnread); // Keep existing state for notifications
            setSupportUnreadCount(supportUnread); // New state for support
        }
    };

    const handleLogout = async () => {
        // 1. Limpa estado local primeiro para feedback visual rápido
        setProfile(null);

        // 2. Faz o logout no Supabase
        await supabase.auth.signOut();

        // 3. Pequeno delay para garantir que a sessão foi destruída
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 100);
    };

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon, label, badge }: { to: string; icon: string; label: string, badge?: number }) => (
        <Link
            to={to}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(to)
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-medium flex-1">{label}</span>
            {badge && badge > 0 ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {badge > 99 ? '99+' : badge}
                </span>
            ) : null}
        </Link>
    );

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 w-64 bg-card-dark border-r border-border-dark transform transition-transform z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } flex flex-col`}
            >
                {/* Logo Area */}
                <div className="p-6 border-b border-border-dark flex flex-col items-center gap-4 relative">
                    <img src="/logo.png" alt="SocialPrime" className="h-28 w-auto" />
                    <button onClick={onClose} className="lg:hidden absolute top-6 right-6 text-text-secondary hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* Dashboard Logic */}
                    {profile?.email === 'brunomeueditor@gmail.com' ? (
                        <>
                            <NavItem to="/admin" icon="dashboard" label="Dashboard" />
                            <NavItem to="/admin/support" icon="forum" label="Gerenciar Suporte" badge={supportUnreadCount} />
                        </>
                    ) : (
                        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
                    )}

                    {/* Client Only Links */}
                    {profile?.email !== 'brunomeueditor@gmail.com' && (
                        <>
                            <NavItem to="/new-order" icon="add_shopping_cart" label="Novo Pedido" />
                            <NavItem to="/add-funds" icon="attach_money" label="Adicionar Saldo" />
                            <NavItem to="/history" icon="history" label="Histórico" />
                        </>
                    )}

                    {/* Common Links */}
                    <NavItem to="/account" icon="person" label="Minha Conta" />
                    <NavItem to="/notifications" icon="notifications" label="Notificações" badge={unreadCount} />

                    {/* Support Button - Hide for Admin */}
                    {profile?.email !== 'brunomeueditor@gmail.com' && (
                        <button
                            onClick={() => {
                                window.dispatchEvent(new Event('toggleSupport'));
                                if (window.innerWidth < 1024) onClose();
                                // Optional: Reset badge locally until next fetch
                                setSupportUnreadCount(0);
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-text-secondary hover:bg-white/5 hover:text-white w-full text-left relative"
                        >
                            <span className="material-symbols-outlined">support_agent</span>
                            <span className="font-medium flex-1">Suporte</span>
                            {supportUnreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                                </span>
                            )}
                        </button>
                    )}
                </nav>

                {/* User & Logout Area */}
                <div className="p-4 border-t border-border-dark space-y-3">
                    {profile && (
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-full bg-background-light overflow-hidden flex-shrink-0 border border-border-dark">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                        <span className="material-symbols-outlined text-lg">person</span>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{profile.full_name || 'Usuário'}</p>
                                <p className="text-xs text-text-secondary truncate">{profile.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all justify-center mt-2"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;