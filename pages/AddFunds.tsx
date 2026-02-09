import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AddFunds: React.FC = () => {
    const [amount, setAmount] = useState<string>('50');
    const [cpf, setCpf] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixCode, setPixCode] = useState('');
    const [qrCodeBase64, setQrCodeBase64] = useState('');
    const navigate = useNavigate();

    const maskCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    // Load saved data from profile
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('cpf, cellphone')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.cpf) setCpf(profile.cpf); // Already masked if saved masked, but better save clean? Let's assume saved as is or clean. 
                    // Actually let's mask it for display if it's clean
                    if (profile.cpf) setCpf(maskCPF(profile.cpf));
                    if (profile.cellphone) setPhone(maskPhone(profile.cellphone));
                }
            }
        };
        loadProfile();
    }, []);

    const isValid = () => {
        const cleanCpf = cpf.replace(/\D/g, '');
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanCpf.length === 11 && cleanPhone.length >= 10;
    };

    const handlePay = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Você precisa estar logado para adicionar saldo.');
                setLoading(false);
                return;
            }

            const numericAmount = parseFloat(amount.replace(',', '.'));
            const cleanCpf = cpf.replace(/\D/g, '');
            const cleanPhone = phone.replace(/\D/g, '');

            // Save to profile
            await supabase
                .from('profiles')
                .update({ cpf: cleanCpf, cellphone: cleanPhone })
                .eq('id', user.id);

            const { data, error } = await supabase.functions.invoke('create-abacatepay-checkout', {
                body: {
                    userId: user.id, // Pass userId for metadata
                    amount: numericAmount,
                    // ReturnURL is no longer used for redirect, but we can leave it or remove it.
                    customer: {
                        name: user.user_metadata.name || user.email,
                        email: user.email,
                        taxId: cleanCpf,
                        cellphone: cleanPhone
                    }
                }
            });

            if (error) {
                console.error('Erro na Edge Function:', error);
                if (data && data.error) {
                    console.error('Detalhe do erro:', data.error);
                }
                alert('Erro ao processar pagamento. Verifique o console para mais detalhes.');
                return;
            }

            // New Mercado Pago Response Handling
            if (data?.success && data?.pixCode && data?.qrCodeBase64) {
                setPixCode(data.pixCode);
                setQrCodeBase64(data.qrCodeBase64);
                setShowPixModal(true);
            } else {
                console.error('Erro ao criar cobrança (sem dados Pix):', data);
                alert('Erro ao gerar Pix. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pixCode).then(() => {
            alert("Código Pix copiado!");
        });
    };

    const predefinedAmounts = ['20', '50', '100', '200', '500'];

    return (
        <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white">Adicionar Saldo</h1>
                <p className="text-text-secondary">Recarregue sua conta instantaneamente via Pix para continuar impulsionando suas redes.</p>
            </div>

            {/* Pix Modal / Success State */}
            {showPixModal ? (
                <div className="bg-card-dark rounded-xl border border-emerald-500/50 p-8 shadow-lg shadow-emerald-900/20 animate-in fade-in zoom-in duration-300 flex flex-col items-center gap-6 text-center">
                    <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white">Pix Gerado com Sucesso!</h2>
                    <p className="text-text-secondary max-w-md">
                        Escaneie o QR Code abaixo ou use o "Pix Copia e Cola" no app do seu banco.
                        <br />
                        <span className="text-sm text-yellow-500 mt-2 block">O saldo será creditado automaticamente assim que o pagamento for confirmado.</span>
                    </p>

                    <div className="bg-white p-4 rounded-lg">
                        <img
                            src={`data:image/png;base64,${qrCodeBase64}`}
                            alt="QR Code Pix"
                            className="w-48 h-48 object-contain"
                        />
                    </div>

                    <div className="w-full max-w-md flex flex-col gap-2">
                        <label className="text-sm font-medium text-text-secondary text-left">Pix Copia e Cola</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={pixCode}
                                className="flex-1 bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-sm text-gray-300 outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                Copiar
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => { setShowPixModal(false); navigate(0); }}
                        className="mt-4 text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4"
                    >
                        Fazer outro pagamento
                    </button>
                </div>
            ) : (
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

                    {/* Personal Data for PIX */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-white">2. Dados para Nota Fiscal</h3>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
                            <span className="material-symbols-outlined text-yellow-500 text-sm mt-0.5">info</span>
                            <p className="text-sm text-yellow-200/80">
                                Para sua segurança e emissão do Pix, CPF e Telefone são obrigatórios.
                            </p>
                        </div>

                        <div className="bg-card-dark rounded-xl border border-border-dark p-6 shadow-sm flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-2 block">CPF</label>
                                <input
                                    type="text"
                                    value={cpf}
                                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                                    className="w-full h-12 pl-4 pr-4 bg-background-dark border border-border-dark rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-2 block">Celular / WhatsApp</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                                    className="w-full h-12 pl-4 pr-4 bg-background-dark border border-border-dark rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amount Selection */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-white">3. Valor da Recarga</h3>

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
                                    step="any"
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
                                    disabled={loading || !isValid()}
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
            )}

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