import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const Account: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [updating, setUpdating] = useState(false);
   const [userId, setUserId] = useState<string | null>(null);
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [balance, setBalance] = useState(0);
   const [newPassword, setNewPassword] = useState('');
   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);

   useEffect(() => {
      const fetchProfile = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            setUserId(user.id);
            setEmail(user.email || '');

            const { data: profile, error } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', user.id)
               .single();

            if (error) {
               console.error('Error fetching profile:', error);
            }

            if (profile) {
               setFullName(profile.full_name || '');
               setBalance(profile.balance || 0);
               // Safely access avatar_url if it exists
               setAvatarUrl((profile as any).avatar_url);
            }
         }
         setLoading(false);
      };

      fetchProfile();
   }, []);

   const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
         setUploading(true);

         if (!event.target.files || event.target.files.length === 0) {
            throw new Error('Você deve selecionar uma imagem para upload.');
         }

         const file = event.target.files[0];
         const fileExt = file.name.split('.').pop();
         const fileName = `${userId}-${Math.random()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

         if (uploadError) {
            throw uploadError;
         }

         const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);


         const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', userId);

         if (updateError) {
            throw updateError;
         }

         setAvatarUrl(data.publicUrl);
         alert('Avatar atualizado com sucesso!');
      } catch (error: any) {
         alert('Erro ao fazer upload do avatar: ' + error.message);
      } finally {
         setUploading(false);
      }
   };

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
                     <Link to="/add-funds" className="flex-1 min-w-[140px] items-center justify-center gap-2 rounded-lg h-11 px-6 bg-primary hover:bg-blue-600 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 flex">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Adicionar Saldo</span>
                     </Link>
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
               {/* Avatar Section */}
               <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                     <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-dark shadow-xl">
                        {avatarUrl ? (
                           <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                           />
                        ) : (
                           <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-5xl">person</span>
                           </div>
                        )}
                        {uploading && (
                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="material-symbols-outlined animate-spin text-white text-3xl">refresh</span>
                           </div>
                        )}
                     </div>
                     <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors" title="Alterar foto">
                        <span className="material-symbols-outlined text-xl">photo_camera</span>
                        <input
                           type="file"
                           className="hidden"
                           accept="image/*"
                           onChange={uploadAvatar}
                           disabled={uploading}
                        />
                     </label>
                  </div>
                  <p className="text-text-secondary text-sm mt-3">Clique na câmera para alterar sua foto</p>
               </div>

               <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex flex-col gap-2">
                     <label className="text-text-secondary text-sm font-medium ml-1">Nome Completo</label>
                     <div className="relative">
                        <input
                           className="w-full h-11 pl-4 pr-10 bg-background-dark/50 rounded-lg border border-border-dark text-text-secondary text-sm cursor-not-allowed opacity-70"
                           type="text"
                           value={fullName}
                           disabled
                           readOnly
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">lock</span>
                     </div>
                     <p className="text-[10px] text-text-secondary ml-1">Para alterar o nome, entre em contato com o suporte.</p>
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