import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // User Stats
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  // Admin Global Stats
  const [providerBalance, setProviderBalance] = useState<number | null>(null);
  const [todaySales, setTodaySales] = useState<number>(0);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Shared
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
          // --- ADMIN GLOBAL FETCH ---

          // 1. Fetch Config for Offsets & API
          let fakeUsersOffset = 0;
          let fakeProfitOffset = 0;
          try {
            const { data: config } = await supabase.from('admin_config').select('*').single();
            if (config) {
              fakeUsersOffset = config.fake_users_offset || 0;
              fakeProfitOffset = Number(config.fake_profit_offset) || 0;

              // API Balance
              if (config.api_url && config.api_key) {
                const { data: balanceData } = await supabase.functions.invoke('smm-proxy', {
                  body: { url: config.api_url, key: config.api_key, action: 'balance' },
                });
                if (balanceData?.balance) setProviderBalance(parseFloat(balanceData.balance));
              }
            }
          } catch (err) { console.error('Admin Config Error:', err); }

          // 2. Global Users Count
          const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          setTotalUsers((uCount || 0) + fakeUsersOffset);

          // 3. Global Sales/Profit
          const { data: allOrders } = await supabase
            .from('orders')
            .select('amount, charge, created_at, status')
            .order('created_at', { ascending: true }); // Order by date for Chart

          if (allOrders) {
            // Profit (Completed)
            const profit = allOrders
              .filter(o => o.status === 'completed')
              .reduce((acc, o) => acc + (Number(o.amount) || Number(o.charge) || 0), 0);
            setTotalProfit(profit + fakeProfitOffset);

            // Today Sales (Completed)
            const today = new Date().toISOString().split('T')[0];
            const salesToday = allOrders
              .filter(o => o.status === 'completed' && o.created_at.startsWith(today))
              .reduce((acc, o) => acc + (Number(o.amount) || Number(o.charge) || 0), 0);
            setTodaySales(salesToday);

            // Chart Data (Group by Day)
            const grouped = allOrders.reduce((acc: any, order) => {
              const date = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              acc[date] = (acc[date] || 0) + 1;
              return acc;
            }, {});

            const chart = Object.keys(grouped).slice(-7).map(date => ({
              name: date,
              orders: grouped[date]
            }));
            setChartData(chart);
          }

          // 4. Global Recent Orders
          const { data: globOrders } = await supabase
            .from('orders')
            .select('*, services(name), profiles(email)') // Fetch user email too if possible
            .order('created_at', { ascending: false })
            .limit(10);

          if (globOrders) setRecentOrders(globOrders);
          setLoadingOrders(false);

        } else {
          // --- USER FETCH LOGIC (Personal) ---
          const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
          if (count !== null) setOrdersCount(count);

          const { count: activeCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'processing');
          if (activeCount !== null) setActiveOrdersCount(activeCount);

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
          {isAdmin && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">Gestão Global</span>}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {userName ? `Olá, ${userName}` : 'Bem-vindo'}
        </h2>
        <p className="text-slate-500 dark:text-text-secondary">
          {isAdmin ? 'Visão geral de todo o sistema em tempo real.' : 'Acompanhe seus pedidos e crescimento.'}
        </p>
      </div>

      {showSuccess && (
        <div className="mb-8 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
            <p className="text-emerald-200 text-sm font-medium">Pagamento confirmado!</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><span className="material-symbols-outlined text-emerald-400">close</span></button>
        </div>
      )}

      {isAdmin ? (
        // --- ADMIN GLOBAL VIEW ---
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Sales Today */}
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Vendas Hoje</p>
              <h3 className="text-3xl font-black text-white">R$ {todaySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <div className="absolute top-4 right-4 text-emerald-500 opacity-20"><span className="material-symbols-outlined text-4xl">payments</span></div>
            </div>

            {/* Total Profit */}
            <div className="bg-gradient-to-br from-[#161E2E] to-[#0B1120] p-6 rounded-xl border border-border-dark shadow-lg relative overflow-hidden">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Lucro Acumulado</p>
              <h3 className="text-3xl font-black text-white">R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <div className="absolute top-4 right-4 text-emerald-500 opacity-20"><span className="material-symbols-outlined text-4xl">savings</span></div>
            </div>

            {/* API Balance */}
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Saldo API (Fornecedor)</p>
              <h3 className="text-3xl font-black text-white">
                {providerBalance !== null ? `R$ ${providerBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}
              </h3>
              <div className="absolute top-4 right-4 text-blue-500 opacity-20"><span className="material-symbols-outlined text-4xl">account_balance_wallet</span></div>
            </div>

            {/* Total Users */}
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Total Usuários</p>
              <h3 className="text-3xl font-black text-white">{totalUsers}</h3>
              <div className="absolute top-4 right-4 text-purple-500 opacity-20"><span className="material-symbols-outlined text-4xl">group</span></div>
            </div>
          </div>

          {/* Global Charts */}
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-6">Volume de Pedidos (Global)</h3>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Area type="monotone" dataKey="orders" stroke="#818cf8" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                  <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                  <p>Sem dados suficientes para o gráfico.</p>
                </div>
              )}
            </div>
          </div>

          {/* Global Recent Orders */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Pedidos (Todos os Clientes)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111827] text-text-secondary font-medium">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Serviço</th>
                    <th className="px-6 py-3">Qtd.</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark text-white">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-text-secondary text-xs">
                        {/* Ideally fetch profile email, but for now showing truncated ID or passed email if join worked */}
                        {order.profiles?.email || '---'}
                      </td>
                      <td className="px-6 py-4">{order.services?.name || `ID: ${order.service_id}`}</td>
                      <td className="px-6 py-4">{order.quantity}</td>
                      <td className="px-6 py-4 text-emerald-400">R$ {order.charge}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // --- STANDARD USER VIEW ---
        <>
          {/* Same User View as before, kept intact */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Pedidos Ativos</p>
              <h3 className="text-3xl font-black text-white">{activeOrdersCount}</h3>
            </div>
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Seu Saldo Disponível</p>
              <h3 className="text-3xl font-black text-white">
                {userBalance !== null ? `R$ ${userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
              </h3>
            </div>
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Total de Pedidos</p>
              <h3 className="text-3xl font-black text-white">{ordersCount}</h3>
            </div>
            <div className="bg-card-dark rounded-xl border border-border-dark p-6 relative overflow-hidden group">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Serviços Disponíveis</p>
              <h3 className="text-3xl font-black text-white">Insta/TikTok</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-card-dark rounded-xl border border-border-dark p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6">Análise de Crescimento</h3>
              <div className="h-[300px] w-full flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-border-dark rounded-lg bg-surface-dark/50 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-4">monitoring</span>
                <p className="font-medium text-white mb-2">Sem dados suficientes para análise</p>
                <Link to="/new-order" className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20">Fazer Novo Pedido</Link>
              </div>
            </div>
            <div className="bg-card-dark rounded-xl border border-border-dark p-6">
              <h3 className="text-lg font-bold text-white mb-6">Acesso Rápido</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/new-order?category=INSTAGRAM%20SEGUIDORES%20BRASILEIRO" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
                  <span className="material-symbols-outlined text-3xl text-pink-500 mb-2">photo_camera</span>
                  <span className="text-sm font-medium text-white">Instagram</span>
                </Link>
                <Link to="/new-order?category=TikTok" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#1a1a2e] hover:bg-[#23233b] border border-border-dark transition-all group">
                  <span className="material-symbols-outlined text-3xl text-white mb-2">music_note</span>
                  <span className="text-sm font-medium text-white">TikTok</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Pedidos Realizados</h3>
              <Link to="/history" className="text-sm text-primary hover:text-primary-hover font-medium">Ver tudo</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111827] text-text-secondary font-medium">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Serviço</th>
                    <th className="px-6 py-3">Link</th>
                    <th className="px-6 py-3">Qtd.</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark text-white">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">{order.services?.name || `ID: ${order.service_id}`}</td>
                      <td className="px-6 py-4 text-primary text-xs">{order.link}</td>
                      <td className="px-6 py-4">{order.quantity}</td>
                      <td className="px-6 py-4"> <span className="px-2 py-0.5 rounded text-xs bg-slate-800">{order.status}</span></td>
                    </tr>
                  ))}
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