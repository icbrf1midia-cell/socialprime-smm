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

    // Verifica se o usuário já está logado para mudar o botão do topo
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    // --- FUNÇÃO DE ROLAGEM SUAVE (CORREÇÃO DO BUG) ---
    const scrollToSection = (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Impede que o roteador tente mudar de página
        const element = document.getElementById(id);
        if (element) {
            // Ajuste do offset por causa da Navbar fixa
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
    // --------------------------------------------------

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-primary/30 selection:text-primary">

            {/* --- NAVBAR FLUTUANTE --- */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/50 transition-all">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex justify-between items-center">

                    {/* LOGO OFICIAL */}
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="SocialPrime"
                            className="h-10 md:h-20 w-auto object-contain transition-transform hover:scale-105 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        />
                    </div>

                    {/* MENU DE NAVEGAÇÃO */}
                    <div className="flex items-center gap-3 md:gap-8">
                        {/* Link de Rolar a Página (CORRIGIDO COM ONCLICK) */}
                        <a
                            href="#metodo"
                            onClick={(e) => scrollToSection(e, 'metodo')}
                            className="text-xs md:text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer whitespace-nowrap"
                        >
                            Como funciona
                        </a>

                        {/* Botão Dinâmico (Login ou Dashboard) */}
                        {session ? (
                            <Link to="/dashboard" className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-primary hover:bg-blue-600 text-white text-xs md:text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 transform hover:-translate-y-0.5 whitespace-nowrap">
                                <span className="material-symbols-outlined text-[16px] md:text-[20px]">dashboard</span>
                                <span className="hidden md:inline">Acessar Painel</span>
                                <span className="md:hidden">Painel</span>
                            </Link>
                        ) : (
                            <Link to="/login" className="px-4 py-2 md:px-8 md:py-3 rounded-full border border-white/10 hover:bg-white/5 hover:border-white/30 text-white text-xs md:text-sm font-bold transition-all whitespace-nowrap">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION (A Dobra Mágica) --- */}
            <header className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                {/* Efeitos de Fundo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">

                    {/* Esquerda: Copywriting Persuasivo */}
                    <div className="lg:col-span-7 text-center lg:text-left space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-primary text-xs font-bold uppercase tracking-widest animate-fade-in-up">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            O Segredo dos Grandes Influenciadores
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white">
                            Pare de Postar para <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500">Ninguém Ver.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            O algoritmo não é justo, mas você pode ser mais esperto.
                            Adquira a autoridade visual necessária para atrair seguidores reais, fechar parcerias e vender mais.
                            <strong className="text-white block mt-2">Rápido. Seguro. Automático.</strong>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <div className="flex items-center gap-3 px-4 py-3 bg-[#111] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <span className="material-symbols-outlined text-green-500">verified</span>
                                <div className="text-left">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Entrega</p>
                                    <p className="text-sm font-bold text-white">Imediata</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-[#111] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <span className="material-symbols-outlined text-blue-500">lock</span>
                                <div className="text-left">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Segurança</p>
                                    <p className="text-sm font-bold text-white">Sem Senha</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Direita: O Formulário de Conversão (Glassmorphism) */}
                    <div className="lg:col-span-5 relative z-10">
                        {/* Card Flutuante Reposicionado */}
                        <div className="absolute -top-6 -right-4 md:-right-8 bg-[#1a1a1a] p-3 rounded-xl border border-white/10 shadow-2xl animate-bounce duration-[3000ms] hidden md:block z-20">
                            <div className="flex items-center gap-3">
                                <div className="bg-pink-500/20 p-2 rounded-lg text-pink-500"><span className="material-symbols-outlined">favorite</span></div>
                                <div>
                                    <p className="text-xs text-slate-400">Instagram Likes</p>
                                    <p className="text-sm font-bold text-white">+ 5.400</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0f1115]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black text-white">Crie sua Conta Grátis</h3>
                                <p className="text-slate-400 text-sm mt-2">Junte-se a mais de 3.500 criadores hoje.</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="group/input">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block group-focus-within/input:text-primary transition-colors">Nome Completo</label>
                                    <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Ex: Bruno Silva" />
                                </div>

                                <div className="group/input">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block group-focus-within/input:text-primary transition-colors">Seu E-mail</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Ex: bruno@email.com" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group/input">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block group-focus-within/input:text-primary transition-colors">Senha</label>
                                        <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="••••••" />
                                    </div>
                                    <div className="group/input">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block group-focus-within/input:text-primary transition-colors">Confirmar</label>
                                        <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="••••••" />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-6 relative overflow-hidden">
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
                                    <br />Já tem conta? <Link to="/login" className="text-white hover:text-primary underline decoration-slate-700 underline-offset-4 transition-colors">Fazer Login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- STATS BAR (Prova Social) --- */}
            <div className="border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
                    {[
                        { label: 'Pedidos Entregues', val: '+150 Mil' },
                        { label: 'Clientes Satisfeitos', val: '+3.500' },
                        { label: 'Serviços Ativos', val: '+500' },
                        { label: 'Suporte', val: '24 Horas' },
                    ].map((stat, i) => (
                        <div key={i} className="py-8 text-center group cursor-default hover:bg-white/5 transition-colors">
                            <h4 className="text-2xl md:text-4xl font-black text-white group-hover:text-primary transition-colors">{stat.val}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- NOVA SEÇÃO: MÉTODO SEGURO & COMO FUNCIONA (ID: METODO) --- */}
            <section id="metodo" className="py-24 bg-[#080808] relative border-b border-white/5 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-500/20">
                            Segurança Blindada
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                            Cresça Sem <span className="text-red-500 line-through decoration-4 decoration-red-500/50">Arriscar</span> Sua Conta
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Diferente de apps suspeitos, nós usamos tecnologia de ponta que respeita as diretrizes das redes sociais.
                            <span className="text-white font-bold block mt-2">Sua privacidade é nossa prioridade absoluta.</span>
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {/* Card 1 */}
                        <div className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                <span className="material-symbols-outlined text-3xl">touch_app</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">1. Escolha</h3>
                            <p className="text-slate-400 text-sm">Navegue por nossos serviços e escolha exatamente o impulso que você precisa (Seguidores, Likes, Views).</p>
                        </div>

                        {/* Card 2 (O MAIS IMPORTANTE) */}
                        <div className="bg-[#111] p-8 rounded-2xl border border-emerald-500/20 hover:border-emerald-500 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">ZERO RISCO</div>
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                                <span className="material-symbols-outlined text-3xl">lock</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">2. Insira o Link</h3>
                            <p className="text-slate-400 text-sm">
                                Cole o link do seu perfil ou postagem.
                                <span className="block mt-2 text-white font-bold bg-white/5 p-2 rounded border border-white/10">
                                    ⛔ NUNCA pedimos sua senha.
                                </span>
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                <span className="material-symbols-outlined text-3xl">pix</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">3. Pagamento</h3>
                            <p className="text-slate-400 text-sm">Pague via Pix com aprovação instantânea. Nosso sistema identifica seu pagamento em segundos.</p>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">4. Decolagem</h3>
                            <p className="text-slate-400 text-sm">Pronto! O sistema entrega seu pedido automaticamente enquanto você foca em criar conteúdo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- O PROBLEMA VS A SOLUÇÃO (COMPARAÇÃO) --- */}
            <section className="py-24 px-6 bg-[#050505]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">A Verdade Sobre o <span className="text-primary">Crescimento</span></h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            O Instagram e TikTok priorizam quem já tem números. É um ciclo vicioso: sem números, sem alcance. Sem alcance, sem números.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Lado Ruim */}
                        <div className="bg-[#0f0a0a] border border-red-500/10 p-10 rounded-3xl relative overflow-hidden hover:border-red-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-8xl text-red-500">close</span></div>
                            <h3 className="text-2xl font-bold text-red-400 mb-4">O Jeito Tradicional (Lento)</h3>
                            <ul className="space-y-4 text-slate-400">
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-red-500 shrink-0">sentiment_dissatisfied</span> Postar todo dia e ter 10 likes.</li>
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-red-500 shrink-0">timer</span> Esperar anos para chegar em 10k.</li>
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-red-500 shrink-0">visibility_off</span> Ser ignorado por marcas e parceiros.</li>
                            </ul>
                        </div>

                        {/* Lado Bom (SocialPrime) */}
                        <div className="bg-[#0a0f1a] border border-primary/20 p-10 rounded-3xl relative overflow-hidden shadow-2xl shadow-primary/5 hover:border-primary/50 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-8xl text-primary">check</span></div>
                            <h3 className="text-2xl font-bold text-primary mb-4">O Jeito SocialPrime (Smart)</h3>
                            <ul className="space-y-4 text-slate-300">
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary shrink-0">rocket_launch</span> Impulso inicial para ativar o algoritmo.</li>
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary shrink-0">trending_up</span> Prova social que atrai seguidores orgânicos.</li>
                                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary shrink-0">verified</span> Autoridade instantânea para vender mais.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PLATAFORMAS --- */}
            <section className="py-20 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">Dominamos Todas as Redes</h2>
                    <div className="flex flex-wrap justify-center gap-6">
                        {[
                            { name: 'Instagram', icon: 'photo_camera', color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20' },
                            { name: 'TikTok', icon: 'music_note', color: 'text-white', bg: 'bg-white/10 border-white/20' },
                            { name: 'YouTube', icon: 'play_circle', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
                            { name: 'Twitter', icon: 'flutter', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
                            { name: 'Facebook', icon: 'facebook', color: 'text-blue-600', bg: 'bg-blue-600/10 border-blue-600/20' },
                            { name: 'Twitch', icon: 'videogame_asset', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
                        ].map((net, i) => (
                            <div key={i} className={`flex items-center gap-3 px-6 py-4 rounded-xl border ${net.bg} hover:scale-105 transition-transform cursor-default select-none`}>
                                <span className={`material-symbols-outlined ${net.color}`}>{net.icon}</span>
                                <span className="font-bold text-white">{net.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ REDUZIDO --- */}
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Dúvidas Frequentes</h2>
                <div className="space-y-4">
                    {[
                        { q: 'É seguro? Minha conta pode ser banida?', a: '100% Seguro. Utilizamos métodos que simulam o comportamento real de usuários, respeitando os limites das redes sociais. Nunca pedimos sua senha.' },
                        { q: 'Quanto tempo demora para chegar?', a: 'A maioria dos serviços começa instantaneamente (em até 60 segundos) após a confirmação do pagamento.' },
                        { q: 'Como adiciono saldo?', a: 'Aceitamos Pix automático. O saldo cai na hora em sua conta e você já pode usar.' }
                    ].map((item, i) => (
                        <div key={i} className="bg-[#111] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all">
                            <h4 className="text-lg font-bold text-white mb-2">{item.q}</h4>
                            <p className="text-slate-400">{item.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24 text-center px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full -z-10"></div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Sua Autoridade Começa Agora.</h2>
                <p className="text-xl text-slate-400 mb-10">Não deixe para amanhã os seguidores que você pode ter hoje.</p>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-white text-black hover:bg-slate-200 font-black py-5 px-10 rounded-full text-xl shadow-2xl transition-all hover:scale-105 flex items-center gap-2 mx-auto">
                    CRIAR CONTA GRÁTIS
                    <span className="material-symbols-outlined">arrow_upward</span>
                </button>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-10 border-t border-white/5 bg-[#020204] text-center">
                <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="SocialPrime" className="h-8 grayscale hover:grayscale-0 transition-all" />
                </div>
                <p className="text-slate-600 text-sm">© 2026 SocialPrime. Todos os direitos reservados.</p>
            </footer>

        </div>
    );
};

export default HomeLanding;