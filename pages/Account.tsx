import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Account: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [updating, setUpdating] = useState(false);
   const [userId, setUserId] = useState<string | null>(null);
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [balance, setBalance] = useState(0);
   const [newPassword, setNewPassword] = useState('');

   useEffect(() => {
      const fetchProfile = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            setUserId(user.id);
            setEmail(user.email || '');

            const { data: profile } = await supabase
               .from('profiles')
               .select('full_name, balance')
               .eq('id', user.id)
               .single();

            if (profile) {
               setFullName(profile.full_name || '');
               setBalance(profile.balance || 0);
            }
         }
         setLoading(false);
      };

      fetchProfile();
   }, []);

   const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId) return;

      setUpdating(true);
      try {
         // Update Profile Name
         const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId);

         if (profileError) throw profileError;

         // Update Password if provided
         if (newPassword) {
            const { error: passwordError } = await supabase.auth.updateUser({
               password: newPassword
            });
            if (passwordError) throw passwordError;
         }

         alert('Dados atualizados com sucesso!');
         setNewPassword(''); // Clear password field after update
      } catch (error: any) {
         console.error('Error updating profile:', error);
         alert('Erro ao atualizar perfil: ' + error.message);
      } finally {
         setUpdating(false);
      }
   };

   if (loading) {
      return (
         <div className="flex-1 w-full flex items-center justify-center">
            <p className="text-white">Carregando dados da conta...</p>
         </div>
      );
   }

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
            <div className="rounded-xl border border-border-dark bg-surface-dark p-6 shadow-sm relative overflow-hidden group col-span-1 lg:col-span-2">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-text-secondary text-sm font-medium uppercase tracking-wider mb-1">Saldo Disponível</p>
                        <div className="flex items-baseline gap-1">
                           <span className="text-text-secondary text-2xl font-light">R$</span>
                           <span className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                              {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </span>
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

            {/* Loyalty Section Removed as requested */}
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
               <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex flex-col gap-2">
                     <label className="text-text-secondary text-sm font-medium ml-1">Nome Completo</label>
                     <input
                        className="w-full h-11 px-4 bg-background-dark rounded-lg border border-border-dark text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-text-secondary text-sm font-medium ml-1">E-mail</label>
                     <input
                        className="w-full h-11 px-4 bg-background-dark/50 rounded-lg border border-border-dark text-text-secondary text-sm cursor-not-allowed opacity-70"
                        disabled
                        type="email"
                        value={email}
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-text-secondary text-sm font-medium ml-1">Alterar Senha (Opcional)</label>
                     <input
                        className="w-full h-11 px-4 bg-background-dark rounded-lg border border-border-dark text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        type="password"
                        placeholder="Digite para alterar..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                     />
                  </div>

                  <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                     <button
                        type="submit"
                        disabled={updating}
                        className="h-11 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                     >
                        {updating ? 'Salvando...' : 'Salvar Alterações'}
                        {!updating && <span className="material-symbols-outlined text-[20px]">check</span>}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
};

export default Account;