import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // User Stats
  const [providerBalance, setProviderBalance] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Admin Stats
  const [todaySales, setTodaySales] = useState<number>(0);
  const [totalProfit, setTotalProfit] = useState<number>(0);

  const [showSuccess, setShowSuccess] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for payment=success in URL
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setShowSuccess(true);
      navigate('/', { replace: true });
      setTimeout(() => setShowSuccess(false), 10000);
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email) setUserEmail(user.email);

        // Fetch User Profile & Role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const isUserAdmin = user.email === 'brunomeueditor@gmail.com' || profile?.role === 'admin';
        setIsAdmin(isUserAdmin);

        // Set User Name
        if (profile) {
          setUserBalance(profile.balance || 0);
          if (profile.full_name) setUserName(profile.full_name.split(' ')[0]);
          else if (profile.username) setUserName(profile.username);
        }
        if (!userName && user.email) setUserName(user.email.split('@')[0]);

        if (isUserAdmin) {
          // --- ADMIN FETCH LOGIC ---
          // 1. Fetch Provider Balance
          try {
            const { data: config } = await supabase.from('admin_config').select('api_url, api_key').single();
            if (config?.api_url && config?.api_key) {
              const { data: balanceData } = await supabase.functions.invoke('smm-proxy', {
                body: { url: config.api_url, key: config.api_key, action: 'balance' },
              });
              if (balanceData?.balance) setProviderBalance(parseFloat(balanceData.balance));
            }
          } catch (err) { console.error('Admin Fetch Error:', err); }

          // 2. Total Profit (Sum of all completed orders)
          const { data: profitData } = await supabase
            .from('orders')
            .select('amount, charge')
            .eq('status', 'completed');

          const profit = profitData?.reduce((acc, o) => acc + (Number(o.amount) || Number(o.charge) || 0), 0) || 0;
          setTotalProfit(profit);

          // 3. Today's Sales
          const today = new Date().toISOString().split('T')[0];
          const { data: todayData } = await supabase
            .from('orders')
            .select('amount, charge')
            .gte('created_at', `${today}T00:00:00`)
            .eq('status', 'completed');

          const salesToday = todayData?.reduce((acc, o) => acc + (Number(o.amount) || Number(o.charge) || 0), 0) || 0;
          setTodaySales(salesToday);
          setLoadingOrders(false);

        } else {
          // --- USER FETCH LOGIC ---
          // 1. Orders Counts
          const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
          if (count !== null) setOrdersCount(count);

          const { count: activeCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'processing');
          if (activeCount !== null) setActiveOrdersCount(activeCount);

          // 2. Recent Orders
          const { data: orders } = await supabase
            .from('orders')
            .select('*, services(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (orders) setRecentOrders(orders);
          setLoadingOrders(false);
        }
      }
    };
    fetchData();
  }, [userName]);

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {isAdmin && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">Modo Administrador</span>}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {userName ? `Bem-vindo, ${userName}` : 'Bem-vindo ao SocialPrime'}
        </h2>
        <p className="text-slate-500 dark:text-text-secondary">
          {isAdmin ? 'Visão geral do desempenho da plataforma hoje.' : 'Acompanhe seus pedidos e crescimento nas redes sociais.'}
        </p>
      </div>

      {showSuccess && (
        <div className="mb-8 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white">check</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Pagamento Recebido com Sucesso!</h3>
              <p className="text-emerald-200 text-sm">Seu saldo já foi adicionado à sua conta. Aproveite!</p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="p-2 hover:bg-emerald-500/20 rounded-full transition-colors text-emerald-400 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {isAdmin ? (
        // --- ADMIN VIEW ---
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Sales */}
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-4xl text-emerald-500">calendar_today</span>
            </div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Vendas Hoje</p>
            <h3 className="text-3xl font-black text-white">
              R$ {todaySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>

          {/* Total Profit */}
          <div className="bg-gradient-to-br from-[#161E2E] to-[#0B1120] p-6 rounded-xl border border-border-dark shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl text-emerald-500">attach_money</span>
            </div>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Lucro Acumulado</p>
            <h3 className="text-4xl font-black text-white mt-2">
              R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>

          {/* API Balance */}
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-4xl text-blue-500">account_balance_wallet</span>
            </div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Saldo API (Fornecedor)</p>
            <h3 className="text-3xl font-black text-white">
              {providerBalance !== null ? `R$ ${providerBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}
            </h3>
          </div>
        </div>
      ) : (
        // --- USER VIEW ---
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-blue-400">pending_actions</span>
              </div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Pedidos Ativos</p>
              <h3 className="text-3xl font-black text-white">{activeOrdersCount}</h3>
              <p className="text-xs text-text-secondary mt-2">Em processamento</p>
            </div>

            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-blue-500">account_balance</span>
              </div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Seu Saldo Disponível</p>
              <h3 className="text-3xl font-black text-white">
                {userBalance !== null ? `R$ ${userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
              </h3>
            </div>

            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-purple-500">shopping_cart</span>
              </div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Total de Pedidos</p>
              <h3 className="text-3xl font-black text-white">{ordersCount}</h3>
            </div>

            {/* Visual Placeholder for Services */}
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-orange-500">bolt</span>
              </div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Serviços Disponíveis</p>
              <h3 className="text-3xl font-black text-white">Insta/TikTok</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-card-dark rounded-xl border border-border-dark p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6">Análise de Crescimento</h3>
              <div className="h-[300px] w-full flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-border-dark rounded-lg bg-surface-dark/50 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-4">monitoring</span>
                <p className="font-medium text-white mb-2">Sem dados suficientes para análise</p>
                <p className="text-sm text-text-secondary mb-6 max-w-sm">Faça seu primeiro pedido para visualizar o gráfico de crescimento.</p>
                <Link to="/new-order" className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20">
                  Fazer Novo Pedido
                </Link>
              </div>
            </div>
            {/* Quick Access */}
            <div className="bg-card-dark rounded-xl border border-border-dark p-6">
              <h3 className="text-lg font-bold text-white mb-6">Acesso Rápido</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/new-order?category=INSTAGRAM%20SEGUIDORES%20BRASILEIRO" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
                  <span className="material-symbols-outlined text-3xl text-pink-500 mb-2 group-hover:scale-110 transition-transform">photo_camera</span>
                  <span className="text-sm font-medium text-white">Instagram</span>
                </Link>
                <Link to="/new-order?category=TikTok" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
                  <span className="material-symbols-outlined text-3xl text-black dark:text-white mb-2 group-hover:scale-110 transition-transform">music_note</span>
                  <span className="text-sm font-medium text-white">TikTok</span>
                </Link>
              </div>
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
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Carregando...</td></tr>
                  ) : recentOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum pedido realizado</td></tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-[#111a22] transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">#{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{order.services?.name || `ID: ${order.service_id}`}</td>
                        <td className="px-6 py-4"><span className="text-primary truncate max-w-[150px]">{order.link}</span></td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{order.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;