import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ApiConfig: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estado apenas para Marketing
    const [config, setConfig] = useState({
        id: '',
        enable_offsets: true,
        offset_users: 0,
        offset_orders: 0,
        offset_revenue: 0
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase.from('system_config').select('id, enable_offsets, offset_users, offset_orders, offset_revenue').single();

            if (data) {
                setConfig(data as any);
            } else if (error && error.code === 'PGRST116') {
                console.log("Nenhuma configuração encontrada.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...config };
            if (!payload.id) delete (payload as any).id;

            // Atualiza apenas os campos de marketing, mantendo as chaves de API seguras no banco
            const { error } = await supabase
                .from('system_config')
                .update({
                    enable_offsets: config.enable_offsets,
                    offset_users: config.offset_users,
                    offset_orders: config.offset_orders,
                    offset_revenue: config.offset_revenue
                })
                .eq('id', config.id);

            if (error) throw error;
            alert('Estratégia de Marketing salva com sucesso!');
            fetchConfig();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-white animate-pulse">Carregando painel...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="text-slate-400 text-sm mb-1">Painel Admin / Marketing</div>
                    <h1 className="text-3xl font-black text-white">Estratégia de Visualização</h1>
                    <p className="text-slate-400 mt-1">Configure a percepção de volume do seu negócio (Dados Simulados).</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/admin')} className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors">Voltar</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Aplicar Estratégia'}
                        {!saving && <span className="material-symbols-outlined text-[20px]">rocket_launch</span>}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Card: Marketing & Offsets */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-700/50 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                <span className="material-symbols-outlined text-2xl">monitoring</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Dados Simulados (Offsets)</h3>
                                <p className="text-sm text-slate-400">Infle os números do dashboard para passar autoridade.</p>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 bg-[#0f172a] px-5 py-2.5 rounded-xl border border-slate-700 cursor-pointer select-none hover:border-purple-500/50 transition-colors group">
                            <span className={`text-sm font-bold ${config.enable_offsets ? 'text-white' : 'text-slate-500'}`}>
                                {config.enable_offsets ? 'SISTEMA ATIVO' : 'SISTEMA PAUSADO'}
                            </span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={config.enable_offsets} onChange={() => setConfig({ ...config, enable_offsets: !config.enable_offsets })} />
                                <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${config.enable_offsets ? 'bg-purple-500' : 'bg-slate-600'}`}></div>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${config.enable_offsets ? 'translate-x-7' : 'translate-x-1'}`}></div>
                            </div>
                        </label>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-300 ${config.enable_offsets ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">group_add</span>
                                Usuários (+)
                            </label>
                            <input type="number" value={config.offset_users} onChange={e => setConfig({ ...config, offset_users: Number(e.target.value) })} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-4 text-white text-lg font-mono focus:border-purple-500 outline-none transition-all focus:ring-1 focus:ring-purple-500/50" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                                Pedidos (+)
                            </label>
                            <input type="number" value={config.offset_orders} onChange={e => setConfig({ ...config, offset_orders: Number(e.target.value) })} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-4 text-white text-lg font-mono focus:border-purple-500 outline-none transition-all focus:ring-1 focus:ring-purple-500/50" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">attach_money</span>
                                Lucro (R$ +)
                            </label>
                            <input type="number" value={config.offset_revenue} onChange={e => setConfig({ ...config, offset_revenue: Number(e.target.value) })} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-4 text-white text-lg font-mono focus:border-purple-500 outline-none transition-all focus:ring-1 focus:ring-purple-500/50" />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-xs text-slate-500">
                            * As configurações técnicas (API Key, URL, Margem) agora são gerenciadas exclusivamente via Banco de Dados para maior segurança.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiConfig;