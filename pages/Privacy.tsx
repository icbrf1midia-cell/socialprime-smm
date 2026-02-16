import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#05000a] text-white font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('/bg-galaxy.jpg')] bg-cover bg-center bg-no-repeat opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#05000a]/90 via-[#05000a]/80 to-[#05000a]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-32">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group">
                    <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Voltar para o Início
                </Link>

                <h1 className="text-4xl md:text-6xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Política de Privacidade
                </h1>

                <div className="bg-[#130821]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl">
                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">folder_shared</span>
                            Coelta de Dados
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            Levamos sua privacidade a sério. Coletamos apenas as informações estritamente necessárias para o processamento de seus pedidos e identificação da conta:
                        </p>
                        <ul className="list-disc list-inside mt-4 text-slate-300 space-y-2 ml-4">
                            <li>Nome Completo</li>
                            <li>Endereço de E-mail</li>
                            <li>Detalhes de Pagamento (processados de forma segura)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">security</span>
                            Segurança e Criptografia
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            Seus dados são armazenados em servidores seguros com criptografia de ponta a ponta. <strong>Nunca vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong> para fins de marketing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">cookie</span>
                            Uso de Cookies
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            Utilizamos cookies apenas para manter sua sessão de login ativa e garantir que você tenha a melhor experiência possível em nossa plataforma. Não usamos cookies para rastreamento externo invasivo.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/5 text-center text-slate-500 text-sm">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
