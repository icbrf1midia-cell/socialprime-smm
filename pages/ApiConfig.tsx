import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ApiConfig: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    // Estado do formulário
    const [config, setConfig] = useState({
        id: '',
        api_url: '',
        api_key: '',
        global_profit_margin: 20,
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
            // Removida verificação de email restrita para evitar bloqueio indevido
            const { data, error } = await supabase.from('system_config').select('*').single();

            if (data) {
                setConfig(data);
            } else if (error && error.code === 'PGRST116') {
                // Se não existir config, apenas deixa o padrão para ser salvo
                console.log("Nenhuma configuração encontrada, usando padrões.");
            } else if (error) {
                console.error(error);
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
            // Remove o campo id se estiver vazio para não dar erro de UUID inválido no insert
            // Mas como usamos UPSERT, o ideal é garantir que se existe ID, usamos ele.
            const payload = { ...config };
            if (!payload.id) delete (payload as any).id;

            // Importante: No Supabase, se a tabela tiver RLS, o usuário precisa de policy para INSERT/UPDATE
            const { error } = await supabase
                .from('system_config')
                .upsert(payload, { onConflict: 'id' });

            if (error) throw error;
            alert('Configurações salvas com sucesso!');

            // Recarrega para pegar o ID gerado caso tenha sido um insert novo
            fetchConfig();

        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar: ' + (error.message || 'Erro desconhecido. Verifique permissões.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-white animate-pulse">Carregando configurações...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="text-slate-400 text-sm mb-1">Configurações / Integração API</div>
                    <h1 className="text-3xl font-black text-white">Configurações do Sistema</h1>
                    <p className="text-slate-400 mt-1">Gerencie a conexão com o fornecedor e os dados de marketing.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/admin')} className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors">Voltar</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                        {!saving && <span className="material-symbols-outlined text-[20px]">save</span>}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Card 1: Conexão API */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-emerald-500">link</span>
                        <h3 className="text-lg font-bold text-white">Dados de Conexão</h3>
                        <span className="ml-auto bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-1 rounded border border-emerald-500/20">CONECTADO</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL da API do Fornecedor</label>
                            <input
                                type="text"
                                value={config.api_url || ''}
                                onChange={e => setConfig({ ...config, api_url: e.target.value })}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors placeholder:text-slate-700"
                                placeholder="https://api.fornecedor.com/v2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margem de Lucro Global (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={config.global_profit_margin}
                                    onChange={e => setConfig({ ...config, global_profit_margin: Number(e.target.value) })}
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors pl-4 pr-10"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chave de API (API Key)</label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={config.api_key || ''}
                                    onChange={e => setConfig({ ...config, api_key: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors font-mono placeholder:text-slate-700"
                                    placeholder="Cole sua chave aqui..."
                                />
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showKey ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Marketing & Offsets */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-lg relative overflow-hidden transition-all hover:border-purple-500/30">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-500">trending_up</span>
                            <h3 className="text-lg font-bold text-white">Marketing & Offsets</h3>
                        </div>

                        {/* Toggle Switch Ligar/Desligar */}
                        <label className="flex items-center gap-3 bg-[#0f172a] px-4 py-2 rounded-full border border-slate-700 cursor-pointer select-none">
                            <span className={`text-sm font-bold ${config.enable_offsets ? 'text-white' : 'text-slate-500'}`}>
                                {config.enable_offsets ? 'ATIVADO' : 'DESATIVADO'}
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={config.enable_offsets}
                                    onChange={() => setConfig({ ...config, enable_offsets: !config.enable_offsets })}
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${config.enable_offsets ? 'bg-purple-500' : 'bg-slate-600'}`}></div>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${config.enable_offsets ? 'translate-x-7' : 'translate-x-1'}`}></div>
                            </div>
                        </label>
                    </div>

                    <p className="text-slate-400 text-sm mb-6 bg-purple-500/10 p-3 rounded border border-purple-500/20 flex gap-2 items-start">
                        <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                        <span>Estes valores são somados aos dados reais para criar uma percepção de volume no painel. Desative para ver apenas os dados reais.</span>
                    </p>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${config.enable_offsets ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offset Usuários (+)</label>
                            <input
                                type="number"
                                value={config.offset_users}
                                onChange={e => setConfig({ ...config, offset_users: Number(e.target.value) })}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offset Pedidos (+)</label>
                            <input
                                type="number"
                                value={config.offset_orders}
                                onChange={e => setConfig({ ...config, offset_orders: Number(e.target.value) })}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offset Lucro (R$ +)</label>
                            <input
                                type="number"
                                value={config.offset_revenue}
                                onChange={e => setConfig({ ...config, offset_revenue: Number(e.target.value) })}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                min="0"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiConfig;