import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ============================================================================
// 🚨 MODO DE TESTE 🚨
// ============================================================================
const MODO_TESTE = true; // true = Simula pedido | false = Gasta saldo real
// ============================================================================

interface Service {
  service_id: number;
  name: string;
  category: string;
  rate: number; // Preço de Custo (Vem do banco baixo, ex: 0.50)
  min: number;
  max: number;
  type: string;
  description?: string;
  custom_margin?: number | null; // Margem personalizada
}

const NewOrder: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 💰 Configuração de Lucro (Padrão 200% se falhar a busca)
  const [globalMargin, setGlobalMargin] = useState<number>(200);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [link, setLink] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // 1. Busca Saldo e Configuração de Margem
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Busca Saldo do Usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        if (profile) setUserBalance(profile.balance);
      }

      // Busca Margem Global da tabela admin_config
      // Se der erro de permissão (RLS), ele mantém o padrão 200 definido no useState
      const { data: config } = await supabase
        .from('admin_config')
        .select('margin_percent')
        .single();

      if (config) {
        setGlobalMargin(config.margin_percent);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Busca Serviços
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      // Busca serviços incluindo a coluna custom_margin
      const { data, error } = await supabase
        .from('services')
        .select('*');

      if (!error && data) {
        setServices(data);
        const uniqueCategories = Array.from(new Set(data.map((s: Service) => s.category)));
        setCategories(uniqueCategories);

        // Lógica de URL params (category=...)
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam) {
          const match = uniqueCategories.find(c => c.toLowerCase().includes(categoryParam.toLowerCase()));
          if (match) setSelectedCategory(match);
        }
      }
      setLoading(false);
    };

    fetchServices();
  }, [location.search]);

  const selectedService = services.find(s => s.service_id.toString() === selectedServiceId);

  // ==========================================================================
  // 🧮 A MÁGICA DO PREÇO (Custo -> Venda)
  // ==========================================================================
  const getFinalPricePer1k = (service: Service | undefined) => {
    if (!service) return 0;

    // Verifica se tem margem personalizada, senão usa a global
    const marginToUse = (service.custom_margin !== null && service.custom_margin !== undefined)
      ? service.custom_margin
      : globalMargin;

    // FÓRMULA: Custo * (1 + Porcentagem/100)
    // Ex: 0.50 * (1 + 2) = 1.50
    return service.rate * (1 + marginToUse / 100);
  };

  // Preço final calculado para o serviço selecionado
  const finalRate = getFinalPricePer1k(selectedService);

  // Total a pagar (Baseado no preço final)
  const total = selectedService
    ? (quantity / 1000) * finalRate
    : 0;

  const filteredServices = services.filter(s => {
    return selectedCategory ? s.category === selectedCategory : true;
  });

  const handleCreateOrder = async () => {
    if (!selectedService || !link || !quantity) return alert('Preencha tudo!');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não logado');

      // Nome do serviço para histórico
      const nomeServico = selectedService.name || `Serviço ${selectedService.service_id}`;

      let externalOrderId = null;

      // Envio para API (Simulado ou Real)
      if (MODO_TESTE) {
        await new Promise(r => setTimeout(r, 800)); // Fake delay
        externalOrderId = 999000 + Math.floor(Math.random() * 1000);
      } else {
        // ... Lógica real de API aqui ...
        // Importante: No modo real, você enviaria o ID original. 
        // A API do fornecedor cobra o custo (0.50), você cobra o cliente (1.50)
        // O lucro fica no seu saldo.
        const { data: apiResponse, error } = await supabase.functions.invoke('place-order', {
          body: { service: selectedService.service_id, link, quantity }
        });
        if (error) throw error;
        externalOrderId = apiResponse?.order;
      }

      // SALVAR PEDIDO NO BANCO (Com o valor que o cliente PAGOU)
      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service: nomeServico,
          link: link,
          quantity: Number(quantity),
          charge: total, // <--- SALVA O TOTAL COM LUCRO
          status: 'pending',
          external_id: externalOrderId
        });

      if (dbError) throw dbError;

      alert('Pedido realizado com sucesso!');
      setLink('');
      setQuantity(1000);

    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">Novo Pedido</h2>
        <p className="text-text-secondary">Selecione o serviço para impulsionar suas redes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Esquerda: Formulário */}
        <div className="lg:col-span-8 bg-card-dark rounded-xl border border-border-dark p-6">

          {/* Categoria */}
          <div className="mb-6">
            <label className="text-white text-sm font-bold mb-2 block">Categoria</label>
            <select
              className="w-full bg-[#111a22] border border-slate-700 text-white p-3 rounded-lg"
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setSelectedServiceId(''); }}
            >
              <option value="" disabled>Selecione...</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Serviço */}
          <div className="mb-6">
            <label className="text-white text-sm font-bold mb-2 block">Serviço</label>
            <select
              className="w-full bg-[#111a22] border border-slate-700 text-white p-3 rounded-lg"
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              disabled={!selectedCategory}
            >
              <option value="" disabled>Escolha o serviço...</option>
              {filteredServices.map(service => {
                // EXIBE O PREÇO JÁ CALCULADO NO DROPDOWN
                const price = getFinalPricePer1k(service);
                return (
                  <option key={service.service_id} value={service.service_id}>
                    {service.name} - R$ {price.toFixed(2)}/k
                  </option>
                );
              })}
            </select>
          </div>

          {/* Link e Quantidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-bold mb-2 block">Link</label>
              <input
                type="url"
                className="w-full bg-[#111a22] border border-slate-700 text-white p-3 rounded-lg"
                placeholder="https://..."
                value={link}
                onChange={e => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="text-white text-sm font-bold mb-2 block">Quantidade</label>
              <input
                type="number"
                className="w-full bg-[#111a22] border border-slate-700 text-white p-3 rounded-lg"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
              <div className="text-xs text-slate-500 mt-1 flex justify-between">
                <span>Min: {selectedService?.min || 100}</span>
                <span>Max: {selectedService?.max || '∞'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Resumo */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-6 bg-card-dark rounded-xl border border-border-dark p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Resumo</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Serviço:</span>
                <span className="text-white font-medium text-right w-40 truncate">{selectedService?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Preço por 1k:</span>
                {/* MOSTRA O PREÇO FINAL (COM LUCRO) */}
                <span className="text-white font-medium">
                  {selectedService ? `R$ ${finalRate.toFixed(2)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Quantidade:</span>
                <span className="text-white font-medium">{quantity}</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-slate-300">Total</span>
                {/* MOSTRA O TOTAL FINAL (COM LUCRO) */}
                <span className="text-3xl font-black text-primary">
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-right text-xs text-slate-500 mb-4">
                Saldo: R$ {userBalance?.toFixed(2) || '0.00'}
              </p>

              <button
                onClick={handleCreateOrder}
                disabled={!selectedService || total === 0 || loading}
                className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;