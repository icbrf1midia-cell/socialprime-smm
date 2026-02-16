import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
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
                    Termos de Uso
                </h1>

                <div className="bg-[#130821]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl">
                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">gavel</span>
                            Aceitaçāo Automática
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            Ao fazer um pedido no <strong>SocialPrime</strong>, você aceita automaticamente estes termos de serviço, independentemente de tê-los lido ou não.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">lock</span>
                            Perfis Privados
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            Não nos responsabilizamos se o usuário colocar o perfil como <strong>privado</strong> durante o envio do pedido. Certifique-se de que sua conta esteja pública antes de solicitar qualquer serviço. Pedidos para perfis privados podem ser considerados concluídos sem reembolso.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">currency_exchange</span>
                            Política de Reembolso
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            Reembolsos só são feitos se o pedido não puder ser entregue pelo nosso sistema após 72 horas. Não fazemos reembolsos se você mudar de ideia, errar o link ou se a conta for privada.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">handshake</span>
                            Isenção de Responsabilidade
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            O <strong>SocialPrime</strong> não tem nenhum vínculo, afiliação ou parceria com Instagram, TikTok, Facebook, YouTube ou qualquer outra rede social. Nossos serviços são para fins de marketing e promoção.
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

export default Terms;
