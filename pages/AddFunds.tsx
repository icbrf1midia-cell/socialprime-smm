import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AddFunds: React.FC = () => {
    const [amount, setAmount] = useState<string>('50');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePay = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Você precisa estar logado para adicionar saldo.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('create-abacatepay-checkout', {
                body: {
                    amount: amount,
                    returnUrl: `${window.location.origin}/dashboard`,
                    completionUrl: `${window.location.origin}/dashboard?payment=success`,
                    customer: {
                        name: user.user_metadata.name || user.email,
                        email: user.email,
                        taxId: user.user_metadata.cpf || '00000000000'
                    }
                }
            });

            if (error) {
                console.error('Erro na Edge Function:', error);
                // Log detailed error from function body if available
                if (data && data.error) {
                    console.error('Detalhe do erro:', data.error);
                }
                alert('Erro ao processar pagamento. Verifique o console para mais detalhes.');
                return;
            }

            if (data && data.url) {
                window.location.href = data.url;
            } else {
                console.error('Erro ao criar cobrança (sem URL):', data);
                alert('Erro ao processar pagamento. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const predefinedAmounts = ['20', '50', '100', '200', '500'];

    return (
        <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white">Adicionar Saldo</h1>
                <p className="text-text-secondary">Recarregue sua conta instantaneamente via Pix para continuar impulsionando suas redes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Payment Method Selection */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white">1. Método de Pagamento</h3>

                    <label className="relative flex items-center gap-4 p-4 rounded-xl border-2 border-primary bg-primary/10 cursor-pointer shadow-lg shadow-primary/10 transition-all">
                        <div className="flex items-center justify-center size-10 rounded-full bg-primary text-white">
                            <span className="material-symbols-outlined">qr_code_2</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white">Pix Automático</h4>
                            <p className="text-sm text-text-secondary">Aprovação imediata (24/7)</p>
                        </div>
                        <div className="size-6 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="size-3 rounded-full bg-primary"></div>
                        </div>
                        <input type="radio" name="payment" defaultChecked className="hidden" />
                    </label>

                    <label className="relative flex items-center gap-4 p-4 rounded-xl border border-border-dark bg-card-dark opacity-50 cursor-not-allowed">
                        <div className="flex items-center justify-center size-10 rounded-full bg-gray-700 text-gray-400">
                            <span className="material-symbols-outlined">credit_card</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-400">Cartão de Crédito</h4>
                            <p className="text-sm text-gray-500">Em manutenção</p>
                        </div>
                        <input type="radio" name="payment" disabled className="hidden" />
                    </label>
                </div>

                {/* Amount Selection */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white">2. Valor da Recarga</h3>

                    <div className="bg-card-dark rounded-xl border border-border-dark p-6 shadow-sm">
                        <label className="text-sm font-medium text-text-secondary mb-2 block">Digite o valor (R$)</label>
                        <div className="relative mb-6">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg">R$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-14 pl-12 pr-4 bg-background-dark border border-border-dark rounded-lg text-white text-2xl font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="0,00"
                            />
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
                            {predefinedAmounts.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val)}
                                    className={`py-2 px-1 rounded-lg text-sm font-bold border transition-colors ${amount === val ? 'bg-white text-black border-white' : 'bg-transparent text-text-secondary border-border-dark hover:border-white hover:text-white'}`}
                                >
                                    R$ {val}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Taxa de processamento</span>
                                <span className="text-emerald-500 font-bold">Grátis</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-white border-t border-border-dark pt-3">
                                <span>Total a pagar</span>
                                <span>R$ {Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <button
                                onClick={handlePay}
                                disabled={loading}
                                className="w-full mt-2 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">pix</span>
                                        Pagar com Pix
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-blue-900/20 border border-blue-900/50 text-sm">
                <div className="flex gap-2">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <div className="text-blue-200">
                        <span className="font-bold text-white block">Pagamento Seguro</span>
                        Seus dados são processados com criptografia de ponta a ponta.
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                    <div className="text-blue-200">
                        <span className="font-bold text-white block">Liberação Automática</span>
                        O saldo entra na sua conta segundos após o pagamento.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFunds;