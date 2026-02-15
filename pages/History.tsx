import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const History: React.FC = () => {
   const [orders, setOrders] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [totalSpent, setTotalSpent] = useState(0);
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      const fetchOrders = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            // 1. Busca total gasto no perfil
            const { data: profile } = await supabase
               .from('profiles')
               .select('total_spent')
               .eq('id', user.id)
               .single();

            if (profile) {
               setTotalSpent(profile.total_spent || 0);
            }

            // 2. Busca pedidos
            const { data, error } = await supabase
               .from('orders')
               .select('*')
               .eq('user_id', user.id)
               .order('created_at', { ascending: false });

            if (!error && data) {
               setOrders(data);
               // Recalcula total gasto baseado no histórico (opcional, mas garante precisão)
               const calculatedTotal = data.reduce((acc: number, order: any) => {
                  return acc + (Number(order.amount) || Number(order.charge) || 0);
               }, 0);
               // Se quiser usar o calculado em vez do perfil, descomente a linha abaixo:
               // setTotalSpent(calculatedTotal);
            }
         }
         setLoading(false);
      };

      fetchOrders();
   }, []);

   // Filtro atualizado para olhar a coluna 'service' correta
   const filteredOrders = orders.filter(order => {
      const term = searchTerm.toLowerCase();
      const serviceName = order.service ? order.service.toLowerCase() : '';
      const link = order.link ? order.link.toLowerCase() : '';
      const id = order.id ? order.id.toLowerCase() : '';

      return id.includes(term) || link.includes(term) || serviceName.includes(term);
   });

   return (
      <div className="flex-1 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
         <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex flex-col gap-2">
               <h1 className="text-white text-3xl md:text-4xl font-black leading-tight">Histórico de Pedidos</h1>
               <p className="text-[#92adc9] text-base font-normal max-w-2xl">Acompanhe o status e detalhes das suas compras de serviços sociais em tempo real.</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-[#192633] border border-[#233648] rounded-lg px-4 py-2 flex flex-col min-w-[120px]">
                  <span className="text-[#92adc9] text-xs uppercase tracking-wider font-bold">Total Gasto</span>
                  <span className="text-white font-mono text-lg font-bold">
                     {loading ? '...' : `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
               </div>
            </div>
         </div>

         <div className="bg-[#192633] border border-[#233648] rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
               <label className="flex flex-col col-span-1 md:col-span-5">
                  <span className="text-white text-sm font-medium pb-2 ml-1">Buscar</span>
                  <div className="relative">
                     <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] pointer-events-none">search</span>
                     <input
                        className="w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#324d67] bg-[#111a22] h-11 pl-10 pr-4 placeholder:text-[#586e84] text-sm"
                        placeholder="Buscar por ID, Link ou Serviço"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </label>
            </div>
         </div>

         <div className="flex-1 flex flex-col bg-[#192633] border border-[#233648] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#111a22] border-b border-[#233648]">
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap w-[80px]">ID</th>
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap w-[120px]">Data</th>
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap">Serviço</th>
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap">Link</th>
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap text-right">Qtd.</th>
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap text-right">Valor</th>
                        <th className="p-4 text-xs font-bold tracking-wider text-[#92adc9] uppercase whitespace-nowrap text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233648] text-sm">
                     {loading ? (
                        <tr>
                           <td colSpan={7} className="p-8 text-center text-[#92adc9]">Carregando histórico...</td>
                        </tr>
                     ) : filteredOrders.length === 0 ? (
                        <tr>
                           <td colSpan={7} className="p-8 text-center text-[#92adc9]">Nenhum pedido encontrado.</td>
                        </tr>
                     ) : (
                        filteredOrders.map((order) => (
                           <tr key={order.id} className="group hover:bg-[#233648]/30 transition-colors">
                              <td className="p-4 font-mono text-white/70">#{order.id.slice(0, 8)}</td>
                              <td className="p-4 text-white">
                                 {new Date(order.created_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="p-4 text-white font-medium">
                                 {/* CORREÇÃO AQUI: Usando order.service em vez de service_name */}
                                 {order.service || 'Serviço Desconhecido'}
                              </td>
                              <td className="p-4">
                                 <span className="text-[#92adc9] truncate max-w-[150px] block" title={order.link}>{order.link}</span>
                              </td>
                              <td className="p-4 text-right text-white font-mono">{order.quantity}</td>
                              <td className="p-4 text-right text-white font-mono">
                                 {order.amount
                                    ? `R$ ${Number(order.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : order.charge
                                       ? `R$ ${Number(order.charge).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                       : 'R$ 0,00'}
                              </td>
                              <td className="p-4 text-center">
                                 <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border ${order.status === 'completed' || order.status === 'Concluído'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : order.status === 'processing' || order.status === 'pending'
                                       ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                       : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    }`}>
                                    {order.status === 'completed' ? 'Concluído' :
                                       order.status === 'pending' ? 'Pendente' :
                                          order.status === 'processing' ? 'Processando' :
                                             order.status}
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export default History;