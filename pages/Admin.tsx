import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
    id: string;
    email: string; // Vamos buscar via join ou view se possível, senão mostramos ID
    full_name: string;
    balance: number;
    total_spent: number; // Novo campo
    status?: string;     // Vamos definir como 'Ativo' padrão por enquanto
}

const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
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
            // Esta função já verifica no banco se é admin, não precisa checar email aqui
            const { data, error } = await supabase.rpc('get_admin_users_list');

            if (error) throw error;
            // 2. Formatar dados para a tabela
            // A função retorna { id, full_name, email, balance }
            const formattedUsers: UserProfile[] = (data || []).map((user: any) => ({
                id: user.id,
                full_name: user.full_name || 'Usuário sem nome',
                email: user.email || 'Sem email',
                balance: user.balance || 0,
                total_spent: user.total_spent || 0,
                status: 'Ativo' // Hardcoded visualmente por enquanto
            }));
            setUsers(formattedUsers);
            // 3. Métricas Simples (Opcional, pode manter estático se quiser performance)
            setMetrics({
                totalUsers: formattedUsers.length,
                totalOrders: 152890, // Valor ilustrativo ou fetch real
                revenue: 15240
            });
        } catch (error: any) {
            console.error('Erro Admin:', error.message);
            // Se der erro, mostre o alerta e NÃO redirecione
            alert('Erro no Admin: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBalance = async () => {
        if (!selectedUser || !amountToAdd) return;
        const valor = parseFloat(amountToAdd.replace(',', '.')); // Aceita vírgula
        if (isNaN(valor) || valor <= 0) return alert('Valor inválido');

        const confirmacao = window.confirm(`ATENÇÃO: Você vai adicionar R$ ${valor.toFixed(2)} para ${selectedUser.full_name || 'Usuário'}.\n\nConfirma?`);
        if (!confirmacao) return;
        setProcessing(true);
        try {
            const novoSaldo = (selectedUser.balance || 0) + valor;

            const { error } = await supabase
                .from('profiles')
                .update({ balance: novoSaldo })
                .eq('id', selectedUser.id);
            if (error) throw error;
            // Recarregar lista
            checkAdminAndLoadData();
            setIsModalOpen(false);
            setAmountToAdd('');
            alert('Saldo adicionado com sucesso!');
        } catch (err: any) {
            alert('Erro ao adicionar saldo: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="text-white p-10">Carregando painel blindado...</div>;

    return (
        <div className="space-y-6">
            {/* Cards de Métricas (Estilo do Print) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card Lucro */}
                <div className="bg-white dark:bg-[#1c2732] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Lucro Real (Líquido)</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">R$ {metrics.revenue.toLocaleString('pt-BR')}</h3>
                            <span className="inline-block mt-2 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">+18% este mês</span>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-green-500">attach_money</span>
                        </div>
                    </div>
                </div>
                {/* Card Usuários */}
                <div className="bg-white dark:bg-[#1c2732] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Usuários</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{metrics.totalUsers}</h3>
                            <span className="inline-block mt-2 text-xs font-medium text-slate-500">Cadastrados na plataforma</span>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-blue-500">group</span>
                        </div>
                    </div>
                </div>
                {/* Card Pedidos */}
                <div className="bg-white dark:bg-[#1c2732] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Pedidos</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{metrics.totalOrders}</h3>
                            <span className="inline-block mt-2 text-xs font-medium text-purple-500">Processados pelo sistema</span>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-purple-500">shopping_bag</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Tabela de Usuários */}
            <div className="bg-white dark:bg-[#1c2732] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerenciar Usuários</h3>
                    <input type="text" placeholder="Buscar email..." className="bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary" />
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
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{user.full_name || 'Sem nome'}</div>
                                        <div className="text-xs text-slate-500">{user.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${user.balance > 0 ? 'text-green-500' : 'text-slate-500'}`}>
                                            R$ {user.balance?.toFixed(2) || '0.00'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                        R$ {user.total_spent?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-500/10 text-green-500 rounded px-2 py-1 text-xs font-medium">
                                            {user.status || 'Ativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                                            className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                            title="Adicionar Saldo"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal de Adicionar Saldo */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1c2732] rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Adicionar Saldo</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Para: <span className="text-white font-medium">{selectedUser.full_name}</span>
                            <br />ID: <span className="text-xs font-mono">{selectedUser.id}</span>
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Valor a adicionar (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amountToAdd}
                                    onChange={(e) => setAmountToAdd(e.target.value)}
                                    placeholder="Ex: 50.00"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none text-lg font-bold"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddBalance}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Salvando...' : 'Confirmar Depósito'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;