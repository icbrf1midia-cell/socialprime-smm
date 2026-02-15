import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [fullName, setFullName] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeOrders: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile (Balance, Total Spent, Full Name)
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance, total_spent, full_name')
                .eq('id', user.id)
                .single();

            if (profile) {
                setBalance(profile.balance || 0);
                setTotalSpent(profile.total_spent || 0);
            }

            // Determine Display Name
            const nameFromProfile = profile?.full_name;
            const nameFromEmail = user.email ? user.email.split('@')[0] : null;
            const finalName = nameFromProfile ? nameFromProfile.split(' ')[0] : (nameFromEmail || 'Visitante');

            setFullName(finalName);

            // Fetch User Orders
            const { data: userOrders } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (userOrders) {
                setOrders(userOrders.slice(0, 5)); // Only last 5 for table

                // Calculate Stats
                const total = userOrders.length;
                const active = userOrders.filter(o => ['pending', 'processing', 'in_progress'].includes(o.status)).length;

                setStats({
                    totalOrders: total,
                    activeOrders: active
                });
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-border-dark pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white">Bem-vindo, {fullName}!</h2>
                    <p className="text-text-secondary">Acompanhe o crescimento das suas redes sociais.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/add-funds" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">add_card</span>
                        Adicionar Saldo
                    </Link>
                    <Link to="/new-order" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                        <span className="material-symbols-outlined">add_circle</span>
                        Novo Pedido
                    </Link>
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 p-6 rounded-xl border border-primary/20 shadow-lg relative overflow-hidden">
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">Saldo Disponível</p>
                    <h3 className="text-3xl font-black text-white mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                    </h3>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl text-white">account_balance_wallet</span>
                    </div>
                </div>

                {/* Active Orders */}
                <div className="bg-card-dark p-6 rounded-xl border border-border-dark shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Pedidos Ativos</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{stats.activeOrders}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">schedule</span>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-card-dark p-6 rounded-xl border border-border-dark shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Pedidos</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{stats.totalOrders}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                            <span className="material-symbols-outlined">shopping_bag</span>
                        </div>
                    </div>
                </div>

                {/* Total Spent */}
                <div className="bg-card-dark p-6 rounded-xl border border-border-dark shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Gasto</p>
                            <h3 className="text-3xl font-bold text-white mt-2">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                            </h3>
                        </div>
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access (New Section) */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Acesso Rápido</h3>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Instagram */}
                    <Link to="/new-order?category=INSTAGRAM%20SEGUIDORES%20BRASILEIROS" className="flex flex-col items-center justify-center p-4 bg-card-dark hover:bg-background-dark border border-border-dark hover:border-pink-500/50 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-white">Instagram</span>
                    </Link>

                    {/* TikTok */}
                    <Link to="/new-order?category=TikTok" className="flex flex-col items-center justify-center p-4 bg-card-dark hover:bg-background-dark border border-border-dark hover:border-gray-500/50 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-white">TikTok</span>
                    </Link>

                    {/* YouTube */}
                    <Link to="/new-order?category=YouTube" className="flex flex-col items-center justify-center p-4 bg-card-dark hover:bg-background-dark border border-border-dark hover:border-red-500/50 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-white">YouTube</span>
                    </Link>

                    {/* Facebook */}
                    <Link to="/new-order?category=Facebook" className="flex flex-col items-center justify-center p-4 bg-card-dark hover:bg-background-dark border border-border-dark hover:border-blue-600/50 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-white">Facebook</span>
                    </Link>

                    {/* Twitter */}
                    <Link to="/new-order?category=Twitter" className="flex flex-col items-center justify-center p-4 bg-card-dark hover:bg-background-dark border border-border-dark hover:border-sky-500/50 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500">
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-white">Twitter</span>
                    </Link>

                    {/* Google (New) */}
                    <Link to="/new-order?category=Google" className="flex flex-col items-center justify-center p-4 bg-card-dark hover:bg-background-dark border border-border-dark hover:border-green-500/50 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-white">Google</span>
                    </Link>
                </div>
            </div>

            {/* Last Orders Table */}
            <div className="bg-card-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Últimos Pedidos Realizados</h3>
                    <Link to="/history" className="text-sm text-primary font-bold hover:underline">Ver Histórico Completo</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#111827] text-text-secondary font-medium">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Serviço</th>
                                <th className="px-6 py-4">Link</th>
                                <th className="px-6 py-4">Qtd.</th>
                                <th className="px-6 py-4">Custo</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-white">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-text-secondary">#{order.id}</td>
                                        <td className="px-6 py-4 font-medium">{order.service || 'Serviço Indefinido'}</td>
                                        <td className="px-6 py-4 text-primary truncate max-w-[150px]">
                                            <a href={order.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{order.link}</a>
                                        </td>
                                        <td className="px-6 py-4">{order.quantity}</td>
                                        <td className="px-6 py-4 text-emerald-400 font-mono">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.charge || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {order.status === 'completed' ? 'Concluído' :
                                                    order.status === 'processing' ? 'Processando' :
                                                        order.status === 'pending' ? 'Pendente' :
                                                            order.status === 'canceled' ? 'Cancelado' : order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-20">shopping_cart_off</span>
                                            <p>Nenhum pedido realizado ainda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
