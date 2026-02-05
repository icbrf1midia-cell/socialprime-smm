import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [providerBalance, setProviderBalance] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email) setUserEmail(user.email);

        // CONDITIONAL: Fetch Provider Balance ONLY for Admin
        if (user.email === 'brunomeueditor@gmail.com') {
          try {
            const { data: balanceData, error: proxyError } = await supabase.functions.invoke('smm-proxy', {
              body: {
                url: 'https://agenciapopular.com/api/v2', // Default API URL
                key: import.meta.env.VITE_PROVIDER_API_KEY,
                action: 'balance',
              },
            });

            if (!proxyError && balanceData && balanceData.balance) {
              setProviderBalance(parseFloat(balanceData.balance));
            }
          } catch (err) {
            console.error('Error fetching provider balance:', err);
          }
        }

        // Fetch User Balance from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserBalance(profile.balance);
        }

        // Fetch Total Orders Count
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count !== null) setOrdersCount(count);

        // Fetch Active Orders Count (Processing)
        const { count: activeCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'processing');

        if (activeCount !== null) setActiveOrdersCount(activeCount);

        // Fetch Recent Orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (orders) setRecentOrders(orders);
        setLoadingOrders(false);
      }
    };
    fetchData();
  }, []);

  // Compute active orders count from recent orders (approximation) or use separate count if needed
  // For now, let's just count 'processing' in the recent list for the simple card, or fetch it properly if we want accuracy.
  // The user requested a "Simple card", I will assume `activeOrdersCount` based on `recentOrders` is better than a new fetch for now to keep it fast, 
  // OR since I have "ordersCount", I can maybe filter? No, that's total.
  // Let's rely on the rendering logic:

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {userEmail ? `Painel de ${userEmail}` : 'Dashboard do Cliente'}
        </h2>
        <p className="text-slate-500 dark:text-text-secondary">Acompanhe seus pedidos e crescimento nas redes sociais.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold hover:bg-emerald-500/20 transition-colors">
          <span className="material-symbols-outlined text-[20px]">add_card</span>
          Adicionar Saldo
        </button>
        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Conditional Card: Provider Balance (Admin) OR Active Orders (Client) */}
        {userEmail === 'brunomeueditor@gmail.com' ? (
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-emerald-500">account_balance_wallet</span>
            </div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Saldo da Agência (API)</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-white">
                {providerBalance !== null
                  ? `R$ ${providerBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '---'}
              </h3>
              <span className="text-xs text-text-secondary ml-2">(Agência Popular)</span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full"></div>
            </div>
          </div>
        ) : (
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-blue-400">pending_actions</span>
            </div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Pedidos Ativos</p>
            <h3 className="text-3xl font-black text-white">
              {activeOrdersCount}
            </h3>
            <p className="text-xs text-text-secondary mt-2">Em processamento recente</p>
          </div>
        )}

        {/* User Balance (Replaces Total Spent) */}
        <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-blue-500">account_balance</span>
          </div>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Seu Saldo Disponível</p>
          <h3 className="text-3xl font-black text-white">
            {userBalance !== null
              ? `R$ ${userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'R$ 0,00'}
          </h3>
          <p className="text-xs text-text-secondary mt-2">Saldo em conta Supabase</p>
        </div>

        {/* Total Orders */}
        <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-purple-500">shopping_cart</span>
          </div>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Total de Pedidos</p>
          <h3 className="text-3xl font-black text-white">{ordersCount}</h3>
          <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Atualizado agora</span>
          </p>
        </div>

        {/* Active Services (Placeholder for now as logic is complex) */}
        <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-orange-500">bolt</span>
          </div>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Serviços Ativos</p>
          <h3 className="text-3xl font-black text-white">0</h3>
          <p className="text-xs text-text-secondary mt-2">Processando em tempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-card-dark rounded-xl border border-border-dark p-6">
          <h3 className="text-lg font-bold text-white mb-6">Desempenho da Conta</h3>
          <div className="h-[300px] w-full flex items-center justify-center text-text-secondary border-2 border-dashed border-border-dark rounded-lg">
            <p>Gráfico de pedidos será exibido aqui</p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-card-dark rounded-xl border border-border-dark p-6">
          <h3 className="text-lg font-bold text-white mb-6">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
              <span className="material-symbols-outlined text-3xl text-pink-500 mb-2 group-hover:scale-110 transition-transform">photo_camera</span>
              <span className="text-sm font-medium text-white">Instagram</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
              <span className="material-symbols-outlined text-3xl text-black dark:text-white mb-2 group-hover:scale-110 transition-transform">music_note</span>
              <span className="text-sm font-medium text-white">TikTok</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
              <span className="material-symbols-outlined text-3xl text-red-500 mb-2 group-hover:scale-110 transition-transform">play_arrow</span>
              <span className="text-sm font-medium text-white">YouTube</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
              <span className="material-symbols-outlined text-3xl text-blue-600 mb-2 group-hover:scale-110 transition-transform">thumb_up</span>
              <span className="text-sm font-medium text-white">Facebook</span>
            </button>
          </div>
          <button className="w-full mt-6 text-sm text-primary hover:text-primary-hover font-medium transition-colors">
            Ver todos os serviços
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Pedidos Realizados</h3>
          <Link to="/history" className="text-sm text-primary hover:text-primary-hover font-medium">Ver tudo</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#161E2E] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Serviço</th>
                <th className="px-6 py-3 font-medium">Link</th>
                <th className="px-6 py-3 font-medium">Qtd.</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
              {loadingOrders ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Carregando pedidos...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum pedido realizado
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-[#111a22] transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {order.service_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-primary truncate max-w-[150px] block" title={order.link}>
                        {order.link}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{order.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                        {order.status === 'completed' ? 'Concluído' : order.status === 'processing' ? 'Processando' : order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;