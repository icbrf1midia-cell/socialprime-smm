import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Checkout: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col font-display text-white">
      {/* Simple Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-dark bg-[#111a22]">
        <div className="flex items-center gap-3">
             <div className="flex items-center justify-center size-8 rounded-lg bg-primary/20 text-primary">
               <span className="material-symbols-outlined">rocket_launch</span>
             </div>
             <h2 className="text-lg font-bold">Painel SMM</h2>
        </div>
      </header>

      <div className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-[1100px] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">Checkout Pix</h1>
              <p className="text-text-secondary text-sm sm:text-base">Complete seu pagamento para liberar o pedido <span className="text-white font-medium">#84920</span></p>
            </div>
            <Link to="/new-order" className="flex items-center gap-2 px-4 h-10 bg-surface-dark border border-border-dark rounded-lg text-sm font-bold text-white hover:bg-border-dark transition-colors self-start sm:self-auto">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Voltar
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column */}
            <section className="lg:col-span-5 flex flex-col gap-6">
               <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-border-dark bg-[#1e2c3a]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary">receipt_long</span>
                       Resumo do Pedido
                    </h3>
                  </div>
                  <div className="p-6 flex flex-col gap-6">
                     <div className="flex gap-4">
                        <div className="size-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-inner">
                           <span className="material-symbols-outlined text-white">group_add</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Serviço</span>
                           <span className="font-semibold text-base leading-snug">Seguidores Instagram (Alta Qualidade)</span>
                        </div>
                     </div>
                     <div className="h-px bg-border-dark w-full"></div>
                     <div className="bg-background-dark/30 rounded-lg p-4 flex flex-col gap-1 border border-dashed border-border-dark/50">
                        <div className="flex justify-between items-center mt-2">
                           <span className="font-bold text-base">Total a Pagar</span>
                           <span className="font-black text-2xl tracking-tight text-white">R$ 49,90</span>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* Right Column: Payment */}
            <section className="lg:col-span-7 flex flex-col">
              <div className="bg-surface-dark rounded-xl border border-border-dark shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-400"></div>
                <div className="p-6 md:p-8 flex flex-col items-center gap-6">
                  {/* Timer */}
                  <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 bg-background-dark p-3 rounded-lg border border-border-dark">
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                       </span>
                       <span className="text-sm font-bold text-yellow-500 uppercase tracking-wide">Aguardando Pagamento</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm font-mono">
                       <span className="material-symbols-outlined text-[18px]">timer</span>
                       <span>Expira em <span className="text-white font-bold">{formatTime(timeLeft)}</span></span>
                    </div>
                  </div>
                  
                  {/* QR Code Placeholder */}
                  <div className="flex flex-col items-center gap-4 w-full">
                     <h4 className="text-lg font-bold text-center">Escaneie o QR Code</h4>
                     <div className="p-4 bg-white rounded-xl shadow-inner border-4 border-gray-200">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540549.905802BR5913LojaExemplo6008SaoPaulo" 
                          alt="QR Code Pix" 
                          className="size-48 md:size-56"
                        />
                     </div>
                  </div>

                  <div className="w-full flex flex-col gap-3">
                     <label className="text-sm font-medium text-text-secondary text-center">Ou use o Pix Copia e Cola</label>
                     <div className="flex gap-2">
                       <input 
                         className="w-full h-12 pl-4 rounded-lg bg-background-dark border border-border-dark text-gray-300 text-sm font-mono truncate focus:ring-2 focus:ring-primary outline-none" 
                         readOnly 
                         type="text" 
                         value="00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540549.905802BR5913Loja Exemplo6008Sao Paulo62070503***6304E2CA"
                       />
                       <button className="h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg px-4 flex items-center gap-2 transition-all shadow-lg shrink-0">
                         <span className="material-symbols-outlined text-[20px]">content_copy</span>
                         <span className="hidden sm:inline">Copiar</span>
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;