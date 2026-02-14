import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    type: 'success' | 'info' | 'warning' | 'error' | 'bonus'; // Expanded types based on previous usage
    is_read: boolean;
    user_id: string | null;
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
        markAllAsRead();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setNotifications(data as Notification[]);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            // Dispatch event to update sidebar count
            window.dispatchEvent(new Event('userUpdated'));
        }

        // Mark global notifications as read
        const { data: globalNotif } = await supabase
            .from('notifications')
            .select('id')
            .is('user_id', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (globalNotif) {
            localStorage.setItem('last_seen_global_id', globalNotif.id);
            // Dispatch event again for global update
            window.dispatchEvent(new Event('userUpdated'));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'info': return 'info';
            case 'bonus': return 'monetization_on';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-emerald-500 bg-emerald-500/10';
            case 'info': return 'text-blue-500 bg-blue-500/10';
            case 'bonus': return 'text-yellow-500 bg-yellow-500/10';
            case 'warning': return 'text-orange-500 bg-orange-500/10';
            case 'error': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} minutos`;
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} horas`;
        if (diffInSeconds < 604800) return `Há ${Math.floor(diffInSeconds / 86400)} dias`;

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="border-b border-border-dark pb-6">
                <h2 className="text-3xl font-black text-white">Notificações</h2>
                <p className="text-text-secondary">Fique por dentro das novidades e atualizações da sua conta.</p>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-card-dark rounded-xl border border-border-dark">
                        <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">notifications_off</span>
                        <p className="text-text-secondary">Nenhuma notificação no momento</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div key={notification.id} className={`bg-card-dark p-4 rounded-xl border flex gap-4 items-start transition-colors ${!notification.is_read ? 'border-primary/50 bg-primary/5' : 'border-border-dark hover:border-primary/30'}`}>
                            <div className={`p-3 rounded-full ${getIconColor(notification.type)}`}>
                                <span className="material-symbols-outlined">{getIcon(notification.type)}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-white text-lg">{notification.title}</h3>
                                    <span className="text-xs text-text-secondary whitespace-nowrap ml-2">{formatDate(notification.created_at)}</span>
                                </div>
                                <p className="text-text-secondary mt-1">{notification.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
