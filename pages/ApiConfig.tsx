import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ApiConfig: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSimulated, setIsSimulated] = useState(false);

    // Estados dos números "Fake" (Offsets)
    const [usersOffset, setUsersOffset] = useState(0);
    const [ordersOffset, setOrdersOffset] = useState(0);
    const [revenueOffset, setRevenueOffset] = useState(0.0);
    const [costOffset, setCostOffset] = useState(0.0);
    const [profitOffset, setProfitOffset] = useState(0.0);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('*')
                .single();

            if (data) {
                setIsSimulated(data.is_simulated || false);
                setUsersOffset(data.users_offset || 0);
                setOrdersOffset(data.orders_offset || 0);
                setRevenueOffset(data.revenue_offset || 0);
                setCostOffset(data.cost_offset || 0);
                setProfitOffset(data.profit_offset || 0);
            }
        } catch (error) {
            console.log('Nenhuma config encontrada, usando padrão.');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Atualiza ou Cria a configuração
            const { data: existing } = await supabase.from('admin_settings').select('id').single();

            if (existing) {
                await supabase
                    .from('admin_settings')
                    .update({
                        is_simulated: isSimulated,
                        users_offset: Number(usersOffset),
                        orders_offset: Number(ordersOffset),
                        revenue_offset: Number(revenueOffset),
                        cost_offset: Number(costOffset),
                        profit_offset: Number(profitOffset),
                        updated_at: new Date(),
                    })
                    .eq('id', existing.id);
            } else {
                await supabase.from('admin_settings').insert({
                    is_simulated: isSimulated,
                    users_offset: Number(usersOffset),
                    orders_offset: Number(ordersOffset),
                    revenue_offset: Number(revenueOffset),
                    cost_offset: Number(costOffset),
                    profit_offset: Number(profitOffset),
                });
            }
            alert('Estratégia aplicada com sucesso!');
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white">Estratégia de Visualização</h1>
                    <p className="text-slate-400 mt-2">
                        Configure a percepção de volume do seu negócio (Adiciona valores aos dados reais).
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    Voltar
                </button>
            </div>

            <div className="bg-[#111827] rounded-xl border border-slate-800 p-8 shadow-2xl">

                {/* Header do Card */}
                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${isSimulated ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                            <span className="material-symbols-outlined text-2xl">monitoring</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Modo Marketing</h3>
                            <p className="text-sm text-slate-400">Quando ativo, soma os valores abaixo aos dados reais.</p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={() => setIsSimulated(!isSimulated)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${isSimulated ? 'bg-purple-600' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`${isSimulated ? 'translate-x-8' : 'translate-x-1'
                                } inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>

                {/* Grid de Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Faturamento */}
                    <div className="bg-[#0b111a] p-4 rounded-lg border border-slate-700">
                        <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">
                            + Faturamento (R$)
                        </label>
                        <input
                            type="number"
                            value={revenueOffset}
                            onChange={(e) => setRevenueOffset(Number(e.target.value))}
                            className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 p-0 placeholder:text-slate-700"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Lucro */}
                    <div className="bg-[#0b111a] p-4 rounded-lg border border-slate-700">
                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">
                            + Lucro Líquido (R$)
                        </label>
                        <input
                            type="number"
                            value={profitOffset}
                            onChange={(e) => setProfitOffset(Number(e.target.value))}
                            className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 p-0 placeholder:text-slate-700"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Custo */}
                    <div className="bg-[#0b111a] p-4 rounded-lg border border-slate-700">
                        <label className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 block">
                            + Custo API (R$)
                        </label>
                        <input
                            type="number"
                            value={costOffset}
                            onChange={(e) => setCostOffset(Number(e.target.value))}
                            className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 p-0 placeholder:text-slate-700"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Usuários */}
                    <div className="bg-[#0b111a] p-4 rounded-lg border border-slate-700">
                        <label className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 block">
                            + Usuários (Qtd)
                        </label>
                        <input
                            type="number"
                            value={usersOffset}
                            onChange={(e) => setUsersOffset(Number(e.target.value))}
                            className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 p-0 placeholder:text-slate-700"
                            placeholder="0"
                        />
                    </div>

                    {/* Pedidos */}
                    <div className="bg-[#0b111a] p-4 rounded-lg border border-slate-700">
                        <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">
                            + Pedidos (Qtd)
                        </label>
                        <input
                            type="number"
                            value={ordersOffset}
                            onChange={(e) => setOrdersOffset(Number(e.target.value))}
                            className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 p-0 placeholder:text-slate-700"
                            placeholder="0"
                        />
                    </div>

                </div>

                {/* Botão Salvar */}
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Aplicar Estratégia 🚀'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ApiConfig;