import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const ApiConfig: React.FC = () => {
  const [apiUrl, setApiUrl] = useState('https://agenciapopular.com/api/v2');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_PROVIDER_API_KEY || '');
  const [margin, setMargin] = useState(100);
  const [offsetUsers, setOffsetUsers] = useState(0);
  const [offsetOrders, setOffsetOrders] = useState(0);
  const [offsetProfit, setOffsetProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load existing config on mount
  React.useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('admin_config')
        .select('*')
        .single();

      if (data && !error) {
        if (data.api_url) setApiUrl(data.api_url);
        if (data.api_key) setApiKey(data.api_key); // BE CAREFUL
        if (data.margin_percent) setMargin(data.margin_percent);
        if (data.offset_users) setOffsetUsers(data.offset_users);
        if (data.offset_orders) setOffsetOrders(data.offset_orders);
        if (data.offset_profit) setOffsetProfit(data.offset_profit);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('admin_config')
        .upsert({
          id: 1, // Assuming singleton config row with ID 1
          api_url: apiUrl,
          api_key: apiKey,
          margin_percent: margin,
          offset_users: offsetUsers,
          offset_orders: offsetOrders,
          offset_profit: offsetProfit,
          updated_at: new Date()
        }, { onConflict: 'id' });

      if (error) throw error;

      setStatus({ type: 'success', message: 'Configurações salvas com sucesso!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setStatus(null);

    try {
      // 1. Fetch services via Proxy
      const { data: services, error: functionError } = await supabase.functions.invoke('smm-proxy', {
        body: {
          url: apiUrl,
          key: apiKey,
          action: 'services',
        },
      });

      if (functionError) {
        throw new Error(`Erro na Função Edge: ${functionError.message}`);
      }

      if (!services) {
        throw new Error('Nenhuma resposta do servidor proxy.');
      }

      if (!Array.isArray(services)) {
        // Some APIs return { error: ... }
        if (services.error) throw new Error(services.error);
        throw new Error('Formato de resposta inválido.');
      }

      console.log('🔍 Exemplo de Serviço da API:', services[0]); // Debug log for user inspection

      // 2. Process and Upsert logic
      const servicesToUpsert = services.map((s: any) => ({
        service_id: s.service,
        name: s.name,
        category: s.category,
        rate: (parseFloat(s.rate) * (1 + margin / 100)).toFixed(2), // Apply Margin
        min: s.min,
        max: s.max,
        type: s.type,
        // Robust description mapping: checks description, desc, content, info, details, or falls back to 'Tipo: [type]'
        description: s.description || s.desc || s.content || s.info || s.details || (s.type ? `Tipo: ${s.type}` : '') || '',
      }));

      const { error: upsertError } = await supabase
        .from('services')
        .upsert(servicesToUpsert, { onConflict: 'service_id' });

      if (upsertError) throw upsertError;

      setStatus({ type: 'success', message: `${servicesToUpsert.length} serviços sincronizados com sucesso!` });

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Falha ao sincronizar serviços.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#92adc9] font-medium">Configurações</span>
            <span className="text-[#92adc9] font-medium">/</span>
            <span className="text-white font-medium">Integração API</span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Configurações de Integração API</h1>
            <p className="text-[#92adc9] text-base font-normal">Gerencie a conexão com o fornecedor e a precificação global dos serviços.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border-dark bg-transparent text-white text-sm font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span className="hidden sm:inline">{loading ? 'Sincronizando...' : 'Sincronizar Serviços'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">{saving ? 'hourglass_top' : 'save'}</span>
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-lg border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {status.message}
        </div>
      )}

      {/* Connection Card */}
      <section className="bg-card-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
        <div className="border-b border-border-dark px-6 py-4 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">link</span>
            Dados de Conexão
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Conectado</span>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 flex flex-col gap-2">
            <label className="text-sm font-medium text-[#92adc9] uppercase tracking-wide">URL da API do Fornecedor</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] group-focus-within:text-primary transition-colors">dns</span>
              <input
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder-slate-500 outline-none transition-all"
                placeholder="https://api.example.com/v2"
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-6 flex flex-col gap-2">
            <label className="text-sm font-medium text-[#92adc9] uppercase tracking-wide">Margem de Lucro Global (%)</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] group-focus-within:text-primary transition-colors">percent</span>
              <input
                className="w-full pl-10 pr-12 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder-slate-500 outline-none transition-all"
                placeholder="0"
                type={showMargin ? "number" : "password"}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
              <button
                onClick={() => setShowMargin(!showMargin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92adc9] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">{showMargin ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div className="md:col-span-12 flex flex-col gap-2">
            <label className="text-sm font-medium text-[#92adc9] uppercase tracking-wide">Chave de API (API Key)</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] group-focus-within:text-primary transition-colors">key</span>
              <input
                className="w-full pl-10 pr-12 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder-slate-500 outline-none transition-all font-mono tracking-wider"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Insira sua chave de API"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92adc9] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">{showApiKey ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing / Offsets Card */}
      <section className="bg-card-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
        <div className="border-b border-border-dark px-6 py-4 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">trending_up</span>
            Marketing & Offsets
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Offset Users */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#92adc9] uppercase tracking-wide">Offset Usuários (+)</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-slate-500 outline-none transition-all"
              type="number"
              value={offsetUsers}
              onChange={(e) => setOffsetUsers(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">Adiciona ao total real de usuários.</p>
          </div>
          {/* Offset Orders */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#92adc9] uppercase tracking-wide">Offset Pedidos (+)</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-slate-500 outline-none transition-all"
              type="number"
              value={offsetOrders}
              onChange={(e) => setOffsetOrders(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">Adiciona ao total real de pedidos.</p>
          </div>
          {/* Offset Profit */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#92adc9] uppercase tracking-wide">Offset Lucro (R$ +)</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-border-dark focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-slate-500 outline-none transition-all"
              type="number"
              value={offsetProfit}
              onChange={(e) => setOffsetProfit(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">Adiciona ao lucro real calculado.</p>
          </div>
        </div>
      </section>

      {/* Services List Mock */}
      <section className="flex flex-col flex-1 min-h-[400px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">Serviços Importados</h2>
          <div className="relative w-full md:w-auto min-w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9]">search</span>
            <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-card-dark border border-border-dark focus:border-primary focus:ring-0 text-white placeholder-slate-500 outline-none text-sm h-10" placeholder="Buscar por ID ou nome do serviço..." type="text" />
          </div>
        </div>
        <div className="bg-card-dark rounded-xl border border-border-dark shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-8 text-center text-text-secondary italic">
            {status?.type === 'success' ? 'Serviços atualizados no banco de dados.' : '(Nenhum serviço importado ainda)'}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ApiConfig;