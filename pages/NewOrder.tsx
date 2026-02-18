import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ============================================================================
// 🚨 INTERRUPTOR DO MODO DE TESTE (LIGA/DESLIGA AQUI) 🚨
// ============================================================================
// true  = MODO TESTE (Simula o pedido, NÃO gasta saldo, cria ID fake)
// false = MODO REAL  (Envia para a API, GASTA seu saldo de verdade)
// ============================================================================
const MODO_TESTE = true;
// ============================================================================

interface Service {
  service_id: number;
  name: string;
  category: string;
  rate: number; // Preço de Custo (Provider)
  min: number;
  max: number;
  type: string;
  description?: string;
  custom_margin?: number | null; // Nova coluna para margem personalizada
}

const NewOrder: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Configuração (Lucro)
  const [globalMargin, setGlobalMargin] = useState<number>(200); // Padrão 200% se falhar busca

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [link, setLink] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // 1. Fetch User Balance & Global Config
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Busca Saldo
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        if (profile) setUserBalance(profile.balance);
      }

      // Busca Margem Global
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

  // 2. Fetch Services on Load
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      // Agora buscamos também a custom_margin
      const { data, error } = await supabase
        .from('services')
        .select('*');

      if (!error && data) {
        setServices(data);
        const uniqueCategories = Array.from(new Set(data.map((s: Service) => s.category)));
        setCategories(uniqueCategories);

        // Check for params in URL params
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');

        if (categoryParam) {
          const exactMatch = uniqueCategories.find(c => c.toLowerCase() === categoryParam.toLowerCase());
          if (exactMatch) {
            setSelectedCategory(exactMatch);
          } else {
            const match = uniqueCategories.find(c => c.toLowerCase().includes(categoryParam.toLowerCase()));
            if (match) setSelectedCategory(match);
          }
        }
      }
      setLoading(false);
    };

    fetchServices();
  }, [location.search]);

  const selectedService = services.find(s => s.service_id.toString() === selectedServiceId);

  // ==========================================================================
  // 💰 LÓGICA DE PREÇO INTELIGENTE (CÁLCULO DE LUCRO)
  // ==========================================================================
  const getFinalPricePer1k = (service: Service | undefined) => {
    if (!service) return 0;

    // Se tiver margem personalizada no serviço, usa ela. Se não, usa a global.
    const marginToUse = (service.custom_margin !== null && service.custom_margin !== undefined)
      ? service.custom_margin
      : globalMargin;

    // Custo * (1 + Margem%) -> Ex: R$ 1.00 * (1 + 200/100) = R$ 3.00
    return service.rate * (1 + marginToUse / 100);
  };

  const finalRate = getFinalPricePer1k(selectedService);

  // Calculate Total (Baseado no preço final com lucro)
  const total = selectedService
    ? (quantity / 1000) * finalRate
    : 0;

  // Filter services logic
  const filteredServices = services.filter(s => {
    return selectedCategory ? s.category === selectedCategory : true;
  });

  const handleCreateOrder = async () => {
    if (!selectedService || !link || !quantity) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    setLoading(true);

    try {
      let nomeParaSalvar = 'Serviço Indefinido';
      if (selectedService) {
        nomeParaSalvar = (selectedService.name && selectedService.name.length > 3)
          ? selectedService.name
          : `Serviço ID: ${selectedService.service_id}`;
      }

      console.log("Tentando salvar serviço:", nomeParaSalvar);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não logado');

      let externalOrderId = null;

      // ENVIO (TESTE OU REAL)
      if (MODO_TESTE) {
        console.log("MODO TESTE: Pedido simulado.");
        await new Promise(resolve => setTimeout(resolve, 800));
        externalOrderId = 888000 + Math.floor(Math.random() * 1000);
      } else {
        const payloadParaAPI = {
          service: selectedService.service_id,
          link: link,
          quantity: Number(quantity)
        };

        const { data: apiResponse, error: apiError } = await supabase.functions.invoke('place-order', {
          body: payloadParaAPI
        });

        if (apiError) throw new Error(`Erro na API: ${apiError.message}`);
        if (!apiResponse || apiResponse.error) throw new Error('A API recusou o pedido.');

        externalOrderId = apiResponse.order;
      }

      // SALVAR NO BANCO LOCAL COM O PREÇO DE VENDA (COM LUCRO)
      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service: nomeParaSalvar,
          link: link,
          quantity: Number(quantity),
          charge: total, // <--- COBRANÇA CORRETA (PREÇO FINAL)
          status: 'pending',
          external_id: externalOrderId
        });

      if (dbError) throw dbError;

      alert(MODO_TESTE
        ? `PEDIDO TESTE SUCESSO! Serviço salvo como: "${nomeParaSalvar}"`
        : 'Pedido realizado com sucesso!'
      );

      setLink('');
      setQuantity(1000);

    } catch (error: any) {
      console.error(error);
      alert('Erro: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">Novo Pedido</h2>
        <p className="text-text-secondary text-base max-w-2xl">
          Selecione a categoria e o serviço para impulsionar suas redes sociais. Entregas automáticas e seguras.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 shadow-sm">
            <div className="grid gap-6">

              {/* Category Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="material-symbols-outlined text-primary text-[18px]">category</span>
                  Categoria
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg bg-[#111a22] border border-border-dark text-white px-4 py-3.5 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base outline-none"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedServiceId('');
                    }}
                  >
                    <option value="" disabled>Selecione uma categoria...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Service Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="material-symbols-outlined text-primary text-[18px]">design_services</span>
                  Serviço
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg bg-[#111a22] border border-border-dark text-white px-4 py-3.5 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base outline-none disabled:opacity-50"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    disabled={filteredServices.length === 0}
                  >
                    <option value="" disabled>
                      {filteredServices.length === 0
                        ? "Nenhum serviço disponível."
                        : "Escolha o tipo de serviço..."}
                    </option>
                    {filteredServices.map(service => {
                      // Calcula o preço para exibir no dropdown também
                      const pricePerK = getFinalPricePer1k(service);
                      return (
                        <option key={service.service_id} value={service.service_id}>
                          {service.service_id} - {service.name} - R$ {pricePerK.toFixed(2)}/k
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              {selectedService && (
                <div className="bg-[#137fec]/10 border border-primary/20 rounded-lg p-4 flex gap-4 items-start">
                  <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                  <div className="text-sm text-text-secondary space-y-1">
                    <p className="text-white font-medium">Detalhes do Serviço (ID: {selectedService.service_id})</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                      <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary"></span>Min/Max: <span className="text-white">{selectedService.min} / {selectedService.max}</span></li>
                      <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary"></span>Tipo: <span className="text-white">{selectedService.type}</span></li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Link Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="material-symbols-outlined text-primary text-[18px]">link</span>
                  Link
                </label>
                <input
                  className="w-full rounded-lg bg-[#111a22] border border-border-dark text-white px-4 py-3.5 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base outline-none placeholder:text-text-secondary/50"
                  placeholder="https://instagram.com/seuusuario"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="material-symbols-outlined text-primary text-[18px]">numbers</span>
                  Quantidade
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-[#111a22] border border-border-dark text-white px-4 py-3.5 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base outline-none placeholder:text-text-secondary/50"
                    placeholder="Ex: 1000"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary px-1">
                  <span>Mínimo: <b className="text-white">{selectedService?.min || 100}</b></span>
                  <span>Máximo: <b className="text-white">{selectedService?.max || '∞'}</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary (Sticky) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-6 space-y-6">
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 shadow-lg flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-dark">
                <h3 className="text-lg font-bold text-white">Resumo do Pedido</h3>
                <span className="material-symbols-outlined text-text-secondary">receipt_long</span>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm text-text-secondary">Serviço:</span>
                  <span className="text-sm font-medium text-white text-right">{selectedService ? selectedService.name : 'Selecione um serviço'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Preço por 1k:</span>
                  <span className="text-sm font-medium text-white">{selectedService ? `R$ ${finalRate.toFixed(2)}` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Quantidade:</span>
                  <span className="text-sm font-medium text-white">{quantity.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-border-dark">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-base font-medium text-text-secondary">Total a Pagar</span>
                  <span className="text-3xl font-black text-primary">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-right text-text-secondary mb-6">
                  Saldo disponível: <span className={`font-bold ${userBalance !== null && userBalance < total ? 'text-red-500' : 'text-emerald-500'}`}>R$ {userBalance !== null ? userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</span>
                </p>
                <button
                  onClick={handleCreateOrder}
                  className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedService || total === 0 || (userBalance !== null && userBalance < total) || loading}
                >
                  {loading ? 'Processando...' : 'Finalizar Pedido'}
                  {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                </button>

                {selectedService && (
                  <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                      Informações Importantes do Serviço
                    </h4>
                    {selectedService.description ? (
                      <div
                        className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedService.description }}
                      />
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Descrição não fornecida pelo operador para este serviço.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;