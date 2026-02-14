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

    useEffect(() => {
        fetchProfile();

        // Listen for updates from Account page or elsewhere
        const handleUserUpdate = () => fetchProfile();
        window.addEventListener('userUpdated', handleUserUpdate);

        return () => window.removeEventListener('userUpdated', handleUserUpdate);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
        <Link
            to={to}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(to)
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-medium">{label}</span>
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
                <div className="p-6 border-b border-border-dark flex items-center justify-between">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        SocialPrime
                    </h1>
                    <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <NavItem to="/" icon="dashboard" label="Dashboard" />
                    <NavItem to="/new-order" icon="add_shopping_cart" label="Novo Pedido" />
                    <NavItem to="/add-funds" icon="attach_money" label="Adicionar Saldo" />
                    <NavItem to="/history" icon="history" label="Histórico" />
                    <NavItem to="/account" icon="person" label="Minha Conta" />
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
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all justify-center"
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
