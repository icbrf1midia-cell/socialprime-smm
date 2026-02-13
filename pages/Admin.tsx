import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
    // Navigate not used for config anymore, but kept if needed for other links
    const navigate = useNavigate();

    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        totalProfit: 0.0,
        newRegs: 0
    });

    // Config State
    const [config, setConfig] = useState({
        api_url: '',
        api_key: '',
        margin_percent: 100,
        fake_users_offset: 0,
        fake_orders_offset: 0,
        fake_profit_offset: 0
    });

    // Modal States
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editBalance, setEditBalance] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [savingUser, setSavingUser] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Fetch Admin Config
            const { data: adminConfig, error: configError } = await supabase.from('admin_config').select('*').single();
            if (adminConfig && !configError) {
                setConfig({
                    api_url: adminConfig.api_url || '',
                    api_key: adminConfig.api_key || '',
                    margin_percent: adminConfig.margin_percent || 100,
                    fake_users_offset: adminConfig.fake_users_offset || 0,
                    fake_orders_offset: adminConfig.fake_orders_offset || 0,
                    fake_profit_offset: Number(adminConfig.fake_profit_offset) || 0
                });
            }

            // 2. Fetch Users
            // Note: RLS policies might restrict this to admin only. 
            // Ensure you are logged in as 'brunomeueditor@gmail.com' to see all users.
            const { data: profiles, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profiles && !usersError) {
                setUsers(profiles);
            }

            // 3. Stats Calculation (Real)
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });

            const { data: revenueData } = await supabase
                .from('orders')
                .select('amount, charge')
                .eq('status', 'completed');

            const realRevenue = revenueData?.reduce((acc, order) => acc + (Number(order.amount) || Number(order.charge) || 0), 0) || 0;

            setStats({
                totalUsers: (usersCount || 0),
                totalOrders: (ordersCount || 0),
                totalProfit: realRevenue,
                newRegs: 0
            });
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setEditBalance(user.balance?.toString() || '0');
        setEditStatus(user.status || 'active');
        setIsUserModalOpen(true);
    };

    const saveUserChanges = async () => {
        if (!selectedUser) return;
        setSavingUser(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    balance: parseFloat(editBalance),
                    status: editStatus
                })
                .eq('id', selectedUser.id);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: parseFloat(editBalance), status: editStatus } : u));
            setIsUserModalOpen(false);
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Erro ao atualizar usuário.");
        } finally {
            setSavingUser(false);
        }
    };

    const saveConfig = async () => {
        setSavingConfig(true);
        try {
            const { error } = await supabase
                .from('admin_config')
                .upsert({
                    id: 1,
                    ...config,
                    updated_at: new Date()
                }, { onConflict: 'id' });

            if (error) throw error;
            setIsSettingsModalOpen(false);
            // Re-fetch to update UI immediately
            fetchData();
        } catch (err) {
            console.error("Error saving config:", err);
            alert("Erro ao salvar configurações.");
        } finally {
            setSavingConfig(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-border-dark pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">Modo Administrador</span>
                    </div>
                    <h2 className="text-3xl font-black text-white">Painel de Controle</h2>
                    <p className="text-text-secondary">Visão geral financeira e gerenciamento de usuários do SocialPrime.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="h-10 px-4 rounded-lg bg-card-dark border border-border-dark hover:bg-white/5 text-white text-sm font-bold flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        Configurações
                    </button>
                </div>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profit */}
                <div className="bg-gradient-to-br from-[#161E2E] to-[#0B1120] p-6 rounded-xl border border-border-dark shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">attach_money</span>
                    </div>
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Lucro Real (Líquido)</p>
                    <h3 className="text-4xl font-black text-white mt-2">
                        R$ {(stats.totalProfit + config.fake_profit_offset).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-sm">
                        <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">+18%</span>
                        <span className="text-text-secondary">este mês</span>
                    </div>
                </div>

                {/* Total Users */}
                <div className="bg-card-dark p-6 rounded-xl border border-border-dark shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Usuários</p>
                            <h3 className="text-3xl font-bold text-white mt-2">
                                {(stats.totalUsers + config.fake_users_offset).toLocaleString('pt-BR')}
                            </h3>
                        </div>
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-4">Total calculado com base no banco de dados.</p>
                </div>

                {/* Total Orders */}
                <div className="bg-card-dark p-6 rounded-xl border border-border-dark shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Pedidos</p>
                            <h3 className="text-3xl font-bold text-white mt-2">
                                {(stats.totalOrders + config.fake_orders_offset).toLocaleString('pt-BR')}
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                            <span className="material-symbols-outlined">shopping_bag</span>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-4">Total processado pelo sistema.</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-card-dark rounded-xl border border-border-dark shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Gerenciar Usuários</h3>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">search</span>
                        <input className="pl-9 pr-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Buscar email..." />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#111827] text-text-secondary font-medium">
                            <tr>
                                <th className="px-6 py-4">ID / Nome</th>
                                <th className="px-6 py-4">Email / Info</th>
                                <th className="px-6 py-4">Saldo</th>
                                <th className="px-6 py-4">Gasto Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-white">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-xs font-mono">{user.first_name || user.id.slice(0, 8)}</td>
                                    <td className="px-6 py-4 text-text-secondary">{user.email || 'Email oculto'}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-mono">
                                        R$ {user.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        R$ {user.total_spent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            user.status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {user.status === 'active' ? 'Ativo' :
                                                user.status === 'banned' ? 'Banido' :
                                                    user.status === 'suspended' ? 'Suspenso' : user.status || 'Desconhecido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-colors"
                                            title="Editar Saldo/Status"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                                        Nenhum usuário encontrado (ou sem permissão).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {isUserModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card-dark border border-border-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white">Editar Usuário</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-text-secondary hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-text-secondary">
                                Editando: <strong>{selectedUser.email || selectedUser.id}</strong>
                            </p>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#92adc9]">Novo Saldo (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none"
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#92adc9]">Status</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none appearance-none"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                >
                                    <option value="active">Ativo</option>
                                    <option value="suspended">Suspenso</option>
                                    <option value="banned">Banido</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border-dark flex justify-end gap-3 bg-white/5">
                            <button
                                onClick={() => setIsUserModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-text-secondary hover:text-white font-medium text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveUserChanges}
                                disabled={savingUser}
                                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                            >
                                {savingUser ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card-dark border border-border-dark rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">settings</span>
                                Configurações do Sistema
                            </h3>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="text-text-secondary hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* API Connection */}
                            <div className="space-y-4">
                                <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2">Conexão API (SMM)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#92adc9]">API URL</label>
                                        <input
                                            className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary text-white text-sm"
                                            value={config.api_url}
                                            onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#92adc9]">API Key</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary text-white text-sm"
                                            value={config.api_key}
                                            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#92adc9]">Margem de Lucro (%)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary text-white text-sm"
                                            value={config.margin_percent}
                                            onChange={(e) => setConfig({ ...config, margin_percent: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Marketing Offsets */}
                            <div className="space-y-4">
                                <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500 text-sm">trending_up</span>
                                    Marketing & Offsets
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#92adc9]">Fake Users Offset (+)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-border-dark focus:border-purple-500 text-white text-sm"
                                            value={config.fake_users_offset}
                                            onChange={(e) => setConfig({ ...config, fake_users_offset: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#92adc9]">Fake Orders Offset (+)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-border-dark focus:border-purple-500 text-white text-sm"
                                            value={config.fake_orders_offset}
                                            onChange={(e) => setConfig({ ...config, fake_orders_offset: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#92adc9]">Fake Profit Offset (R$ +)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-border-dark focus:border-purple-500 text-white text-sm"
                                            value={config.fake_profit_offset}
                                            onChange={(e) => setConfig({ ...config, fake_profit_offset: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border-dark flex justify-end gap-3 bg-white/5">
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-text-secondary hover:text-white font-medium text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveConfig}
                                disabled={savingConfig}
                                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                            >
                                {savingConfig ? 'Salvando...' : 'Salvar Configurações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Admin;