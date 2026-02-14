import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register: React.FC = () => {
   const navigate = useNavigate();
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
         // 1. Sign up user
         const { data: { user, session }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
               data: {
                  full_name: fullName,
               },
            },
         });

         if (signUpError) throw signUpError;

         if (user) {
            // 2. Insert profile (Optional: Triggers are better, but client-side works if RLS allows)
            // We only try to insert if we have a session (user is logged in immediately)
            if (session) {
               const { error: profileError } = await supabase
                  .from('profiles')
                  .insert([
                     {
                        id: user.id,
                        email: email,
                        full_name: fullName,
                        balance: 0
                     }
                  ]);

               if (profileError) {
                  console.error('Error creating profile:', profileError);
                  // We don't throw here to avoid blocking valid signup if just profile insert fails 
                  // (e.g. if trigger already handled it)
               }
            }

            navigate('/login');
         }
      } catch (err: any) {
         setError(err.message || 'Erro ao criar conta.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background-dark overflow-x-hidden">
         {/* Left Side (Desktop Only) */}
         <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-900 items-center justify-center p-12 relative overflow-hidden h-screen sticky top-0">
            <div className="absolute inset-0 z-0 opacity-60 mix-blend-overlay">
               <img
                  src="https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3"
                  alt="Background"
                  className="w-full h-full object-cover"
               />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90"></div>

            <div className="relative z-10 max-w-lg">
               <h2 className="text-4xl font-bold leading-tight tracking-tight text-white mb-4">Domine com a SocialPrime.</h2>
               <div className="mt-10 flex gap-8 border-t border-border-dark pt-8">
                  <div><p className="text-3xl font-bold text-white">10k+</p><p className="text-sm text-text-secondary mt-1">Contas criadas</p></div>
                  <div><p className="text-3xl font-bold text-white">5M+</p><p className="text-sm text-text-secondary mt-1">Pedidos Entregues</p></div>
               </div>
            </div>
         </div>

         {/* Right Side (Form) */}
         <div className="flex w-full lg:w-1/2 min-h-screen flex-col items-center justify-center p-8 pt-10 pb-24 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-md space-y-8 bg-background-light dark:bg-background-dark p-8 rounded-2xl shadow-xl border border-border-dark">
               <div className="mb-2">
                  <img src="/logo.png" alt="SocialPrime" className="h-32 lg:h-40 w-auto mx-auto mb-2 lg:mx-0" />
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">Crie sua conta</h1>
                  <p className="text-slate-500 dark:text-text-secondary">Junte-se à plataforma premium de SMM.</p>
               </div>

               {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                     {error}
                  </div>
               )}

               <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                  <div className="flex flex-col gap-2">
                     <label className="text-sm font-medium leading-none text-slate-700 dark:text-white">Nome Completo</label>
                     <input
                        className="w-full h-12 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-sm font-medium leading-none text-slate-700 dark:text-white">E-mail</label>
                     <input
                        className="w-full h-12 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-sm font-medium leading-none text-slate-700 dark:text-white">Senha</label>
                     <input
                        className="w-full h-12 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                     />
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="mt-2 w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-base font-bold tracking-wide shadow-lg shadow-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {loading ? (
                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                        'Cadastrar Agora'
                     )}
                  </button>
               </form>

               <div className="mt-8 text-center">
                  <p className="text-sm text-slate-600 dark:text-text-secondary">
                     Já possui uma conta? <Link to="/login" className="text-primary font-semibold hover:text-primary-hover hover:underline ml-1">Entrar no Painel</Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Register;