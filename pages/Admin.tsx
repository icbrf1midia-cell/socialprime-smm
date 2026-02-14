import React from 'react';

const Admin: React.FC = () => {
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
                    <button className="h-10 px-4 rounded-lg bg-card-dark border border-border-dark hover:bg-white/5 text-white text-sm font-bold flex items-center gap-2 transition-colors">
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
                    <h3 className="text-4xl font-black text-white mt-2">R$ 15.240,00</h3>
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
                            <h3 className="text-3xl font-bold text-white mt-2">3,450</h3>
                        </div>
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-4">15 novos registros hoje</p>
                </div>

                {/* Total Orders */}
                <div className="bg-card-dark p-6 rounded-xl border border-border-dark shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Pedidos</p>
                            <h3 className="text-3xl font-bold text-white mt-2">152,890</h3>
                        </div>
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                            <span className="material-symbols-outlined">shopping_bag</span>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-4">98% completados com sucesso</p>
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
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Saldo</th>
                                <th className="px-6 py-4">Gasto Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-white">
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold">carlos_mkt</td>
                                <td className="px-6 py-4 text-text-secondary">carlos@email.com</td>
                                <td className="px-6 py-4 text-emerald-400 font-mono">R$ 150,00</td>
                                <td className="px-6 py-4 font-mono">R$ 4,500.00</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">Ativo</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-text-secondary hover:text-white"><span className="material-symbols-outlined">edit</span></button>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold">agencia_top</td>
                                <td className="px-6 py-4 text-text-secondary">contato@agenciatop.com</td>
                                <td className="px-6 py-4 text-emerald-400 font-mono">R$ 1,250.00</td>
                                <td className="px-6 py-4 font-mono">R$ 12,800.00</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">Ativo</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-text-secondary hover:text-white"><span className="material-symbols-outlined">edit</span></button>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold">spam_bot</td>
                                <td className="px-6 py-4 text-text-secondary">bot@fake.com</td>
                                <td className="px-6 py-4 text-emerald-400 font-mono">R$ 0,00</td>
                                <td className="px-6 py-4 font-mono">R$ 0.00</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">Banido</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-text-secondary hover:text-white"><span className="material-symbols-outlined">edit</span></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;