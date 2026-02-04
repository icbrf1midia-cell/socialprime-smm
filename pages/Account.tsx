import React from 'react';

const Account: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-wrap justify-between items-end gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Minha Conta</h1>
          <p className="text-text-secondary text-base max-w-2xl">Gerencie seu saldo, dados pessoais e visualize seu histórico de transações.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance */}
        <div className="rounded-xl border border-border-dark bg-surface-dark p-6 shadow-sm relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
           <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-text-secondary text-sm font-medium uppercase tracking-wider mb-1">Saldo Disponível</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-text-secondary text-2xl font-light">R$</span>
                       <span className="text-white text-4xl md:text-5xl font-bold tracking-tight">1.250,00</span>
                    </div>
                 </div>
                 <div className="bg-primary/20 p-2.5 rounded-lg">
                    <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
                 </div>
              </div>
              <div className="flex gap-3 mt-auto">
                 <button className="flex-1 min-w-[140px] items-center justify-center gap-2 rounded-lg h-11 px-6 bg-primary hover:bg-blue-600 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 flex">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Adicionar Saldo</span>
                 </button>
              </div>
           </div>
        </div>
        
        {/* Loyalty */}
        <div className="rounded-xl border border-border-dark bg-surface-dark p-6 shadow-sm flex flex-col justify-center gap-5">
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">Nível de Fidelidade</p>
                 <div className="flex items-center gap-2">
                    <span className="text-yellow-400 material-symbols-outlined filled">workspace_premium</span>
                    <p className="text-white text-2xl font-bold">Membro Ouro</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-white text-2xl font-bold">75%</p>
                 <p className="text-text-secondary text-xs">para Platina</p>
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <div className="h-3 w-full rounded-full bg-border-dark overflow-hidden">
                 <div className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: '75%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-text-secondary font-mono mt-1">
                 <span>R$ 0</span>
                 <span>Meta: R$ 5.000</span>
              </div>
           </div>
        </div>
      </div>
      
      {/* Form */}
      <div className="rounded-xl border border-border-dark bg-surface-dark overflow-hidden">
         <div className="border-b border-border-dark px-6 py-4 flex items-center bg-surface-dark">
            <h3 className="text-white text-lg font-bold flex items-center gap-2">
               <span className="material-symbols-outlined text-text-secondary">manage_accounts</span>
               Dados Pessoais
            </h3>
         </div>
         <div className="p-6 md:p-8">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
               <div className="flex flex-col gap-2">
                  <label className="text-text-secondary text-sm font-medium ml-1">Nome Completo</label>
                  <input className="w-full h-11 px-4 bg-background-dark rounded-lg border border-border-dark text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary" type="text" defaultValue="João Silva"/>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-text-secondary text-sm font-medium ml-1">E-mail</label>
                  <input className="w-full h-11 px-4 bg-background-dark/50 rounded-lg border border-border-dark text-text-secondary text-sm cursor-not-allowed opacity-70" disabled type="email" defaultValue="joao.silva@exemplo.com"/>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default Account;