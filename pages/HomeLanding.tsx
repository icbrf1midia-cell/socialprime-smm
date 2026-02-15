import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const HomeLanding: React.FC = () => {
    // --- Lógica do Formulário de Registro (Cópia do Register.tsx) ---
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

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
                if (profileError) throw profileError;
                alert('Cadastro realizado com sucesso! Bem-vindo ao SocialPrime.');
                navigate('/dashboard');
            }
        } catch (error: any) {
            alert('Erro no cadastro: ' + (error.message || 'Tente novamente.'));
        } finally {
            setLoading(false);
        }
    };
    // ---------------------------------------------------------

    return (
        <div className="min-h-screen bg-[#0b111a] text-white overflow-x-hidden">
            {/* Navbar Simples */}
            <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-lg">
                        <span className="material-symbols-outlined text-white">rocket_launch</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        Social<span className="text-primary">Prime</span>
                    </h1>
                </div>
                <div>
                    <Link to="/login" className="text-slate-400 hover:text-white font-bold transition-colors">Entrar</Link>
                </div>
            </nav>

            {/* === HERO SECTION + REGISTRO (A Dobra Principal) === */}
            <header className="relative max-w-7xl mx-auto px-6 pt-10 pb-24 lg:pt-20 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/20 blur-[120px] -z-10 rounded-full opacity-50 pointer-events-none"></div>

                {/* Coluna da Esquerda: Copy Persuasiva */}
                <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-bold text-primary/80 backdrop-blur-md">
                        <span className="animate-pulse h-2 w-2 bg-primary rounded-full"></span>
                        A plataforma #1 para crescimento acelerado.
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                        Destrave o Algoritmo e <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Decole Sua Autoridade</span> Digital.
                    </h1>
                    <p className="text-lg text-slate-400 md:max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Não espere anos para ser notado. Adquira a prova social necessária para atrair seguidores reais, fechar parcerias e vender mais. Rápido, seguro e automático.
                    </p>
                    {/* Trust Badges */}
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 pt-4 text-slate-500 font-medium text-sm">
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check_circle</span> Entrega Imediata</div>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check_circle</span> Seguro & Sigiloso</div>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check_circle</span> Suporte 24/7</div>
                    </div>
                </div>

                {/* Coluna da Direita: Formulário de Registro Integrado */}
                <div className="lg:col-span-5 relative z-10">
                    <div className="bg-[#161f2c]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl shadow-primary/10">
                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Crie sua Conta Gratuita</h3>
                            <p className="text-slate-400">Comece a impulsionar suas redes em segundos.</p>
                        </div>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-4">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                                    <input type="text" placeholder="Nome Completo" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#0b111a]/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600" required />
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">mail</span>
                                    <input type="email" placeholder="Seu melhor e-mail" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#0b111a]/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600" required />
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                                    <input type="password" placeholder="Crie uma senha" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#0b111a]/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600" required />
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock_reset</span>
                                    <input type="password" placeholder="Confirme a senha" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-[#0b111a]/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600" required />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 text-lg mt-6">
                                {loading ? 'Criando conta...' : 'ACESSAR PAINEL AGORA'}
                                {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform font-bold">arrow_forward</span>}
                            </button>
                        </form>
                        <p className="mt-6 text-center text-slate-400">
                            Já tem uma conta? <Link to="/login" className="text-primary font-bold hover:underline">Fazer Login</Link>
                        </p>
                    </div>
                </div>
            </header>

            {/* === SOCIAL PROOF BANNER === */}
            <div className="border-y border-white/5 bg-white/[0.02] py-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 font-medium uppercase tracking-widest mb-6 text-sm">A escolha de criadores e marcas em crescimento</p>
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Logos Fakes para exemplo de Prova Social */}
                        <h4 className="text-2xl font-black text-white flex items-center gap-2"><span className="material-symbols-outlined text-pink-500">photo_camera</span> Instagram</h4>
                        <h4 className="text-2xl font-black text-white flex items-center gap-2"><span className="material-symbols-outlined text-white">music_note</span> TikTok</h4>
                        <h4 className="text-2xl font-black text-white flex items-center gap-2"><span className="material-symbols-outlined text-red-500">play_circle</span> YouTube</h4>
                        <h4 className="text-2xl font-black text-white flex items-center gap-2"><span className="material-symbols-outlined text-blue-500">facebook</span> Facebook</h4>
                    </div>
                </div>
            </div>

            {/* === HOW IT WORKS SECTION === */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black mb-4">Como Funciona o <span className="text-primary">SocialPrime</span></h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">Processo simplificado em 3 etapas para você focar no que importa: criar conteúdo.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="bg-[#161f2c] p-8 rounded-2xl border border-white/5 relative group hover:border-primary/30 transition-all">
                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/30">1</div>
                        <div className="mt-4 mb-6 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-3xl">person_add</span></div>
                        <h3 className="text-xl font-bold mb-3 text-white">Crie sua Conta Gratuita</h3>
                        <p className="text-slate-400 leading-relaxed">Preencha o formulário acima em segundos. Sem taxas de adesão, sem cartões de crédito obrigatórios para começar.</p>
                    </div>
                    {/* Step 2 */}
                    <div className="bg-[#161f2c] p-8 rounded-2xl border border-white/5 relative group hover:border-primary/30 transition-all">
                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/30">2</div>
                        <div className="mt-4 mb-6 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-3xl">add_shopping_cart</span></div>
                        <h3 className="text-xl font-bold mb-3 text-white">Escolha Seu Impulso</h3>
                        <p className="text-slate-400 leading-relaxed">Navegue por centenas de serviços para Instagram, TikTok, YouTube. Selecione a quantidade e cole seu link.</p>
                    </div>
                    {/* Step 3 */}
                    <div className="bg-[#161f2c] p-8 rounded-2xl border border-white/5 relative group hover:border-primary/30 transition-all">
                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/30">3</div>
                        <div className="mt-4 mb-6 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-3xl">rocket</span></div>
                        <h3 className="text-xl font-bold mb-3 text-white">Decole Sua Autoridade</h3>
                        <p className="text-slate-400 leading-relaxed">Nosso sistema automatizado inicia a entrega quase instantaneamente. Veja seus números e sua prova social crescerem.</p>
                    </div>
                </div>
            </section>

            {/* === FOOTER SIMPLE === */}
            <footer className="py-12 text-center text-slate-500 border-t border-white/5 bg-[#080c12]">
                <p className="mb-4 text-lg font-bold text-white">Pronto para começar?</p>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-primary font-bold hover:underline flex items-center gap-2 mx-auto">
                    Voltar ao topo e cadastrar <span className="material-symbols-outlined">arrow_upward</span>
                </button>
                <p className="mt-8 text-sm">© 2024 SocialPrime SMM. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default HomeLanding;
