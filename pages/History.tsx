import React from 'react';

const History: React.FC = () => {
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
             <span className="text-white font-mono text-lg font-bold">R$ 450,00</span>
           </div>
        </div>
      </div>

      <div className="bg-[#192633] border border-[#233648] rounded-xl p-5 shadow-sm">
         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <label className="flex flex-col col-span-1 md:col-span-5">
               <span className="text-white text-sm font-medium pb-2 ml-1">Buscar</span>
               <div className="relative">
                 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] pointer-events-none">search</span>
                 <input className="w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#324d67] bg-[#111a22] h-11 pl-10 pr-4 placeholder:text-[#586e84] text-sm" placeholder="Buscar por ID do pedido ou Link" />
               </div>
            </label>
            <div className="col-span-1 md:col-span-2">
                <button className="h-11 w-full bg-[#233648] hover:bg-[#324d67] text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Filtrar
                </button>
            </div>
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
                  <tr className="group hover:bg-[#233648]/30 transition-colors">
                     <td className="p-4 font-mono text-white/70">#10234</td>
                     <td className="p-4 text-white">24/10/2023</td>
                     <td className="p-4 text-white font-medium">Instagram Followers [HQ]</td>
                     <td className="p-4"><span className="text-[#92adc9] truncate max-w-[150px] block">instagram.com/user...</span></td>
                     <td className="p-4 text-right text-white font-mono">1.000</td>
                     <td className="p-4 text-right text-white font-mono">R$ 15,00</td>
                     <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">Concluído</span>
                     </td>
                  </tr>
                  <tr className="group hover:bg-[#233648]/30 transition-colors">
                     <td className="p-4 font-mono text-white/70">#10233</td>
                     <td className="p-4 text-white">24/10/2023</td>
                     <td className="p-4 text-white font-medium">TikTok Views [Instant]</td>
                     <td className="p-4"><span className="text-[#92adc9] truncate max-w-[150px] block">tiktok.com/@video123</span></td>
                     <td className="p-4 text-right text-white font-mono">5.000</td>
                     <td className="p-4 text-right text-white font-mono">R$ 2,50</td>
                     <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Processando</span>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default History;