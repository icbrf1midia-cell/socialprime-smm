import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Falha ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background-dark overflow-x-hidden">
      {/* Left Side (Desktop Only) */}
      <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-900 items-center justify-center p-12 relative overflow-hidden h-screen sticky top-0">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            alt="Abstract network"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            A Autoridade Digital que Você Merece.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Desbloqueie o potencial máximo do seu perfil. A plataforma líder no Brasil para quem busca crescimento acelerado, resultados reais e domínio nas redes sociais.
          </p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="flex w-full lg:w-1/2 min-h-screen flex-col items-center justify-center p-8 pt-10 pb-24 bg-background-light dark:bg-background-dark">


        <div className="w-full max-w-md space-y-8 bg-background-light dark:bg-background-dark p-8 rounded-2xl shadow-xl border border-border-dark">
          <div className="text-center sm:text-left">
            <img src="/logo.png" alt="SocialPrime" className="h-32 lg:h-40 w-auto mx-auto mb-2 sm:mx-0" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Acesse sua conta SocialPrime para continuar.</p>
          </div>

          <form className="space-y-3" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">E-mail</label>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                </div>
                <input
                  className="block w-full rounded-lg border-0 py-2 pl-10 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 bg-white dark:bg-[#1c2732] placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="exemplo@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Senha</label>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                </div>
                <input
                  className="block w-full rounded-lg border-0 py-2 pl-10 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 bg-white dark:bg-[#1c2732] placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="Insira sua senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 transition-all duration-200 disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Não tem uma conta? <Link to="/register" className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors ml-1">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;