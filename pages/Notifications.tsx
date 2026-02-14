import React from 'react';

const Notifications: React.FC = () => {
    const notifications = [
        {
            id: 1,
            title: 'Pedido Concluído',
            message: 'Seu pedido #1205 de 1000 Seguidores Instagram foi concluído com sucesso!',
            time: 'Há 2 horas',
            type: 'success',
            icon: 'check_circle'
        },
        {
            id: 2,
            title: 'Novo Serviço Adicionado',
            message: 'Acabamos de adicionar serviços exclusivos para TikTok com entrega ultra-rápida. Confira!',
            time: 'Há 5 horas',
            type: 'info',
            icon: 'info'
        },
        {
            id: 3,
            title: 'Bônus Recebido',
            message: 'Você recebeu um bônus de R$ 5,00 em sua conta por ser um cliente fiel.',
            time: 'Ontem',
            type: 'bonus',
            icon: 'monetization_on'
        },
        {
            id: 4,
            title: 'Manutenção Programada',
            message: 'Nossos servidores passarão por uma breve manutenção na madrugada de terça-feira.',
            time: 'Há 2 dias',
            type: 'warning',
            icon: 'warning'
        }
    ];

    const getIconColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-emerald-500 bg-emerald-500/10';
            case 'info': return 'text-blue-500 bg-blue-500/10';
            case 'bonus': return 'text-yellow-500 bg-yellow-500/10';
            case 'warning': return 'text-orange-500 bg-orange-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="border-b border-border-dark pb-6">
                <h2 className="text-3xl font-black text-white">Notificações</h2>
                <p className="text-text-secondary">Fique por dentro das novidades e atualizações da sua conta.</p>
            </div>

            <div className="space-y-4">
                {notifications.map((notification) => (
                    <div key={notification.id} className="bg-card-dark p-4 rounded-xl border border-border-dark flex gap-4 items-start hover:border-primary/30 transition-colors">
                        <div className={`p-3 rounded-full ${getIconColor(notification.type)}`}>
                            <span className="material-symbols-outlined">{notification.icon}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white text-lg">{notification.title}</h3>
                                <span className="text-xs text-text-secondary whitespace-nowrap ml-2">{notification.time}</span>
                            </div>
                            <p className="text-text-secondary mt-1">{notification.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
