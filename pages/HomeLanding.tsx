import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const HomeLanding: React.FC = () => {
    // --- LÓGICA DE SESSÃO E REGISTRO ---
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    // --- FUNÇÃO DE ROLAGEM SUAVE ---
    const scrollToSection = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        setLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: { data: { full_name: formData.fullName } }
            });
            if (authError) throw authError;
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{ id: authData.user.id, full_name: formData.fullName, email: formData.email, balance: 0.00 }]);

                if (profileError && profileError.code !== '23505') throw profileError;
                alert('Conta criada com sucesso! Redirecionando...');
                navigate('/dashboard');
            }
        } catch (error: any) {
            alert('Atenção: ' + (error.message || 'Erro ao criar conta.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#02040a] text-white overflow-x-hidden font-sans selection:bg-primary/30 selection:text-primary relative">

            {/* --- BACKGROUND GLOBAL COM GRADIENTES --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Glow Superior Esquerdo (Azul Profundo) */}
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse duration-[5000ms]"></div>
                {/* Glow Inferior Direito (Roxo Sutil) */}
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[150px]"></div>
                {/* Grid Overlay para textura Tech */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
            </div>

            {/* --- ELEMENTOS FLUTUANTES (DECORAÇÃO) --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Ícone Like Flutuando */}
                <div className="absolute top-[15%] left-[5%] text-pink-500/20 animate-bounce duration-[4000ms]">
                    <span className="material-symbols-outlined text-7xl rotate-[-15deg]">favorite</span>
                </div>
                {/* Ícone Verificado Flutuando */}
                <div className="absolute top-[60%] left-[10%] text-blue-500/10 animate-bounce duration-[6000ms]">
                    <span className="material-symbols-outlined text-9xl rotate-[15deg]">verified</span>
                </div>
                {/* Ícone Foguete Flutuando */}
                <div className="absolute top-[20%] right-[40%] text-purple-500/10 animate-bounce duration-[5000ms]">
                    <span className="material-symbols-outlined text-8xl rotate-[15deg]">rocket_launch</span>
                </div>
            </div>

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex justify-between items-center relative z-50">
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="SocialPrime"
                            className="h-10 md:h-20 w-auto object-contain transition-transform hover:scale-105 filter drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                        />
                    </div>
                    <div className="flex items-center gap-3 md:gap-8">
                        <a
                            href="#metodo"
                            onClick={(e) => scrollToSection(e, 'metodo')}
                            className="text-xs md:text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-wider cursor-pointer whitespace-nowrap"
                        >
                            Como funciona
                        </a>
                        {session ? (
                            <Link to="/dashboard" className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs md:text-sm font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 transform hover:-translate-y-0.5 whitespace-nowrap ring-1 ring-white/20">
                                <span className="material-symbols-outlined text-[16px] md:text-[20px]">dashboard</span>
                                <span className="hidden md:inline">Acessar Painel</span>
                                <span className="md:hidden">Painel</span>
                            </Link>
                        ) : (
                            <Link to="/login" className="px-4 py-2 md:px-8 md:py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white text-xs md:text-sm font-bold transition-all whitespace-nowrap backdrop-blur-sm">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden z-10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">

                    {/* Texto Hero */}
                    <div className="lg:col-span-7 text-center lg:text-left space-y-8 relative">
                        {/* Selo Brilhante */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 backdrop-blur-md text-blue-300 text-xs font-bold uppercase tracking-widest animate-fade-in-up shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            O Segredo dos Grandes Influenciadores
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white drop-shadow-2xl">
                            Pare de Postar para <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-gradient-x">Ninguém Ver.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                            Destrave o potencial máximo do seu perfil. Aumente sua autoridade visual e atraia seguidores reais, parcerias e vendas.
                            <strong className="text-white block mt-2 tracking-wide">Rápido. Seguro. Automático.</strong>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <div className="flex items-center gap-3 px-5 py-4 bg-[#0a101f]/80 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all shadow-xl hover:shadow-blue-500/10 group backdrop-blur-sm">
                                <span className="material-symbols-outlined text-green-400 group-hover:scale-110 transition-transform">verified</span>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Entrega</p>
                                    <p className="text-sm font-bold text-white">Imediata</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-5 py-4 bg-[#0a101f]/80 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all shadow-xl hover:shadow-purple-500/10 group backdrop-blur-sm">
                                <span className="material-symbols-outlined text-purple-400 group-hover:scale-110 transition-transform">lock</span>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Segurança</p>
                                    <p className="text-sm font-bold text-white">Sem Senha</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulário Glassmorphism 2.0 */}
                    <div className="lg:col-span-5 relative z-20">
                        {/* Card Flutuante 3D */}
                        <div className="absolute -top-12 -right-6 md:-right-10 bg-[#1e293b]/90 p-4 rounded-2xl border border-white/10 shadow-2xl animate-bounce duration-[3000ms] hidden md:block z-30 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-3 rounded-xl text-white shadow-lg shadow-pink-500/30">
                                    <span className="material-symbols-outlined text-2xl">favorite</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Instagram Likes</p>
                                    <p className="text-lg font-black text-white">+ 5.400</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/20 transition-all">
                            {/* Borda de brilho superior */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black text-white">Crie sua Conta Grátis</h3>
                                <p className="text-slate-400 text-sm mt-2">Junte-se à plataforma #1 de crescimento.</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="group/input">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Nome Completo</label>
                                    <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#02040a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700" placeholder="Ex: Bruno Silva" />
                                </div>

                                <div className="group/input">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Seu E-mail</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#02040a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700" placeholder="Ex: bruno@email.com" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group/input">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Senha</label>
                                        <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#02040a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700" placeholder="••••••" />
                                    </div>
                                    <div className="group/input">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Confirmar</label>
                                        <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-[#02040a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700" placeholder="••••••" />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-6 relative overflow-hidden bg-[length:200%_auto] animate-gradient-x border border-white/10">
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            ACESSAR O PAINEL AGORA
                                            <span className="material-symbols-outlined font-bold">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-xs text-slate-500">
                                    Ao se registrar, você concorda com nossos termos.
                                    <br />Já tem conta? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30 underline-offset-4 transition-colors">Fazer Login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- STATS BAR --- */}
            <div className="border-y border-white/5 bg-[#0a101f]/50 backdrop-blur-sm relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
                    {[
                        { label: 'Pedidos Entregues', val: '+150 Mil' },
                        { label: 'Clientes Satisfeitos', val: '+3.500' },
                        { label: 'Serviços Ativos', val: '+500' },
                        { label: 'Suporte', val: '24 Horas' },
                    ].map((stat, i) => (
                        <div key={i} className="py-10 text-center group cursor-default hover:bg-white/5 transition-colors">
                            <h4 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 group-hover:to-white transition-colors">{stat.val}</h4>
                            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-2">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MÉTODO SEGURO --- */}
            <section id="metodo" className="py-24 relative border-b border-white/5 scroll-mt-24 z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            Segurança Blindada
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                            Cresça Sem <span className="text-red-500 line-through decoration-4 decoration-red-500/50 opacity-80">Arriscar</span> Sua Conta
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Tecnologia de ponta que respeita as diretrizes das redes sociais.
                            <span className="text-white font-bold block mt-2">Sua privacidade é nossa prioridade absoluta.</span>
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: "1. Escolha", desc: "Navegue por nossos serviços e escolha o impulso ideal.", icon: "touch_app", color: "text-blue-400", bg: "bg-blue-500/10" },
                            { title: "2. Insira o Link", desc: "Cole o link do perfil. Nunca pedimos sua senha.", icon: "lock", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", special: true },
                            { title: "3. Pagamento", desc: "Pague via Pix com aprovação instantânea.", icon: "pix", color: "text-purple-400", bg: "bg-purple-500/10" },
                            { title: "4. Decolagem", desc: "O sistema entrega seu pedido automaticamente.", icon: "rocket_launch", color: "text-pink-400", bg: "bg-pink-500/10" }
                        ].map((card, i) => (
                            <div key={i} className={`bg-[#0d1526] p-8 rounded-2xl border ${card.border || 'border-white/5'} hover:border-opacity-100 hover:border-white/20 transition-all group relative overflow-hidden hover:-translate-y-2 duration-300 shadow-lg`}>
                                {card.special && <div className="absolute top-0 right-0 bg-emerald-500 text-[#02040a] text-[10px] font-bold px-2 py-1 rounded-bl-lg">ZERO RISCO</div>}
                                <div className={`w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${card.color}`}>
                                    <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- COMPARAÇÃO --- */}
            <section className="py-24 px-6 bg-[#02040a] relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">A Verdade Sobre o <span className="text-blue-500">Crescimento</span></h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            O algoritmo prioriza quem já tem números. Quebre esse ciclo.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-[#0f0505] border border-red-500/10 p-10 rounded-3xl relative overflow-hidden group hover:border-red-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-8xl text-red-500">close</span></div>
                            <h3 className="text-2xl font-bold text-red-400 mb-4">O Jeito Tradicional (Lento)</h3>
                            <ul className="space-y-4 text-slate-400">
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-red-500 shrink-0">sentiment_dissatisfied</span> Postar todo dia e ter 10 likes.</li>
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-red-500 shrink-0">timer</span> Esperar anos para resultados.</li>
                            </ul>
                        </div>

                        <div className="bg-[#050a14] border border-blue-500/20 p-10 rounded-3xl relative overflow-hidden shadow-2xl shadow-blue-900/10 group hover:border-blue-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-8xl text-blue-500">check</span></div>
                            <h3 className="text-2xl font-bold text-blue-400 mb-4">O Jeito SocialPrime (Smart)</h3>
                            <ul className="space-y-4 text-slate-300">
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-blue-500 shrink-0">rocket_launch</span> Impulso inicial imediato.</li>
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-blue-500 shrink-0">trending_up</span> Prova social que atrai orgânicos.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-32 text-center px-6 relative overflow-hidden z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full -z-10"></div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 drop-shadow-xl">Sua Autoridade Começa Agora.</h2>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-white text-black hover:bg-slate-200 font-black py-5 px-10 rounded-full text-xl shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105 flex items-center gap-2 mx-auto">
                    CRIAR CONTA GRÁTIS
                    <span className="material-symbols-outlined">arrow_upward</span>
                </button>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-10 border-t border-white/5 bg-[#010205] text-center z-10 relative">
                <div className="flex items-center justify-center gap-2 mb-4 opacity-70 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="SocialPrime" className="h-8 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                </div>
                <p className="text-slate-600 text-sm">© 2026 SocialPrime. Todos os direitos reservados.</p>
            </footer>

        </div>
    );
};

export default HomeLanding;