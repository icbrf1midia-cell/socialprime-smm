import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    balance: number;
    total_spent: number;
    status?: string;
}

const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState(''); // Estado da busca

    // Métricas
    const [metrics, setMetrics] = useState({ totalUsers: 0, totalOrders: 0, revenue: 0 });

    // Estado do Modal de Saldo
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [amountToAdd, setAmountToAdd] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        checkAdminAndLoadData();
    }, []);

    const checkAdminAndLoadData = async () => {
        try {
            // 1. Carregar Lista via Função Segura (RPC)
            const { data, error } = await supabase.rpc('get_admin_users_list');

            if (error) throw error;
            // 2. Formatar dados
            const formattedUsers: UserProfile[] = (data || []).map((user: any) => ({
                id: user.id,
                full_name: user.full_name || 'Usuário sem nome',
                email: user.email || 'Sem email',
                balance: user.balance || 0,
                total_spent: user.total_spent || 0,
                status: 'Ativo'
            }));
            setUsers(formattedUsers);
            // 3. Métricas (Exemplo ilustrativo - ajuste conforme necessidade)
            setMetrics({
                totalUsers: formattedUsers.length,
                totalOrders: 152890,
                revenue: 15240
            });
        } catch (error: any) {
            alert('Erro no Admin: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBalance = async () => {
        if (!selectedUser || !amountToAdd) return;
        const valor = parseFloat(amountToAdd.replace(',', '.'));
        if (isNaN(valor) || valor <= 0) return alert('Valor inválido');

        const confirmacao = window.confirm(`Confirmar adição de R$ ${valor.toFixed(2)} para ${selectedUser.full_name}?`);
        if (!confirmacao) return;
        setProcessing(true);
        try {
            const novoSaldo = (selectedUser.balance || 0) + valor;

            const { error } = await supabase
                .from('profiles')
                .update({ balance: novoSaldo })
                .eq('id', selectedUser.id);
            if (error) throw error;
            checkAdminAndLoadData();
            setIsModalOpen(false);
            setAmountToAdd('');
            alert('Saldo adicionado!');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // Lógica de Filtragem (Busca)
    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        return (
            (user.full_name || '').toLowerCase().includes(term) ||
            (user.email || '').toLowerCase().includes(term) ||
            (user.id || '').toLowerCase().includes(term)
        );
    });

    if (loading) return <div className="text-white p-10">Carregando painel blindado...</div>;

    return (
        <div className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1c2732] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 uppercase">Lucro Real</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">R$ {metrics.revenue.toLocaleString('pt-BR')}</h3>
                </div>
                <div className="bg-white dark:bg-[#1c2732] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 uppercase">Total Usuários</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{metrics.totalUsers}</h3>
                </div>
                <div className="bg-white dark:bg-[#1c2732] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 uppercase">Total Pedidos</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{metrics.totalOrders}</h3>
                </div>
            </div>
            {/* Tabela de Usuários */}
            <div className="bg-white dark:bg-[#1c2732] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerenciar Usuários</h3>

                    {/* Input de Busca Conectado */}
                    <input
                        type="text"
                        placeholder="Buscar nome, email ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary w-64"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-[#151e29] text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Usuário / ID</th>
                                <th className="px-6 py-4 font-medium">E-mail</th>
                                <th className="px-6 py-4 font-medium">Saldo Atual</th>
                                <th className="px-6 py-4 font-medium">Gasto Total</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Nenhum usuário encontrado para "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{user.full_name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">{user.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${user.balance > 0 ? 'text-green-500' : 'text-slate-500'}`}>
                                                R$ {user.balance.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-300">
                                            R$ {user.total_spent.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-500/10 text-green-500 rounded px-2 py-1 text-xs font-bold">
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                                                className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal de Saldo */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1c2732] rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Adicionar Saldo</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Usuário: <span className="text-white">{selectedUser.full_name}</span>
                        </p>
                        <input
                            type="number"
                            value={amountToAdd}
                            onChange={(e) => setAmountToAdd(e.target.value)}
                            placeholder="Valor (R$)"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white mb-4 text-lg font-bold"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-400 hover:text-white">Cancelar</button>
                            <button onClick={handleAddBalance} disabled={processing} className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">
                                {processing ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;