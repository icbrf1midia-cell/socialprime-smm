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
            // 2. Insert profile
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
         {/* Left Side (Desktop Only - Premium Marketing) */}
         {/* Left Side (Desktop & Mobile - Premium Marketing) */}
         <div className="flex w-full lg:w-1/2 xl:w-5/12 bg-slate-900 flex-col justify-between p-8 lg:p-12 relative overflow-hidden h-auto lg:h-screen lg:sticky top-0 shrink-0">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0 opacity-60 mix-blend-overlay">
               <img
                  src="https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3"
                  alt="Background"
                  className="w-full h-full object-cover"
               />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-background-dark via-slate-900/50 to-transparent opacity-90"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="mt-20">
                  <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                     A Autoridade Digital que Você Merece.
                  </h1>
                  <p className="text-slate-300 text-lg xl:text-xl leading-relaxed max-w-md">
                     Desbloqueie o potencial máximo do seu perfil. A plataforma líder no Brasil para quem busca crescimento acelerado, resultados reais e domínio nas redes sociais.
                  </p>
               </div>

               {/* Social Proof Footer */}
               <div className="mb-10 pt-8 border-t border-white/10 grid grid-cols-2 gap-8">
                  <div>
                     <p className="text-4xl font-bold text-white tracking-tight">10k+</p>
                     <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wide">Contas Criadas</p>
                  </div>
                  <div>
                     <p className="text-4xl font-bold text-white tracking-tight">5M+</p>
                     <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wide">Pedidos Entregues</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Side (Form) */}
         <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col items-center justify-center p-8 bg-background-light dark:bg-background-dark min-h-screen">
            <div className="w-full max-w-md space-y-6 pb-20"> {/* pb-20 for mobile scroll safety */}
               <div className="text-center">
                  <img src="/logo.png" alt="SocialPrime" className="h-24 w-auto mx-auto mb-6" />
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Crie sua conta</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Junte-se à plataforma premium de SMM.</p>
               </div>

               {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                     {error}
                  </div>
               )}

               <form className="space-y-5" onSubmit={handleRegister}>
                  <div>
                     <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">Nome Completo</label>
                     <input
                        className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 bg-white dark:bg-surface-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">E-mail</label>
                     <input
                        className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 bg-white dark:bg-surface-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">Senha</label>
                     <input
                        className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 bg-white dark:bg-surface-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
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
                     className="flex w-full justify-center rounded-lg bg-primary py-3 px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-70 disabled:cursor-wait mt-2"
                  >
                     {loading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                        'Cadastrar Agora'
                     )}
                  </button>
               </form>

               <div className="text-center pt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                     Já possui uma conta? <Link to="/login" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors ml-1">Entrar no Painel</Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Register;