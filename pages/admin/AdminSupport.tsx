import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Helper to format date
const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const AdminSupport: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch all tickets on mount
    useEffect(() => {
        fetchTickets();

        // Subscribe to new tickets
        const ticketChannel = supabase
            .channel('admin_tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                () => fetchTickets()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ticketChannel);
        };
    }, []);

    const fetchTickets = async () => {
        const { data: ticketsData } = await supabase
            .from('tickets')
            .select(`
                *,
                profiles:user_id (email, full_name)
            `)
            .order('updated_at', { ascending: false }); // Show recent activity first

        if (ticketsData) {
            // If user profile is missing, fallback to auth table logic would be needed, 
            // but for now we assume profiles exist or we show ID.
            setTickets(ticketsData);
        }
    };

    // When ticket selected, fetch messages
    useEffect(() => {
        if (!selectedTicket) return;

        const fetchMessages = async () => {
            const { data: msgs } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', selectedTicket.id)
                .order('created_at', { ascending: true });

            if (msgs) setMessages(msgs);
        };

        fetchMessages();

        // Realtime messages for selected ticket
        const messageChannel = supabase
            .channel(`admin_messages_${selectedTicket.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${selectedTicket.id}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
        };
    }, [selectedTicket]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket) return;

        const msgContent = newMessage.trim();
        setNewMessage('');

        const { error } = await supabase
            .from('ticket_messages')
            .insert([{
                ticket_id: selectedTicket.id,
                message: msgContent,
                is_admin: true // Important for admin view
            }]);

        if (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem.');
        } else {
            // Update ticket updated_at
            await supabase
                .from('tickets')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', selectedTicket.id);
        }
    };

    const closeTicket = async () => {
        if (!selectedTicket) return;
        if (!window.confirm('Tem certeza que deseja encerrar este atendimento?')) return;

        const { error } = await supabase
            .from('tickets')
            .update({ status: 'closed' })
            .eq('id', selectedTicket.id);

        if (error) {
            alert('Erro ao fechar ticket');
        } else {
            // Send a system message indicating closure
            await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: selectedTicket.id,
                    message: 'Atendimento encerrado pelo suporte.',
                    is_admin: true
                }]);

            setSelectedTicket(null);
            fetchTickets();
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
            {/* LEFT COLUMN: Ticket List */}
            <div className="w-1/3 min-w-[300px] bg-card-dark border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-[#130821]/50 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-fuchsia-500">inbox</span>
                        Atendimentos
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedTicket?.id === ticket.id
                                ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-[0_0_15px_rgba(192,38,211,0.1)]'
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                                    }`}>
                                    {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                                </span>
                                <span className="text-[10px] text-slate-500">{formatTime(ticket.updated_at)}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white truncate mb-0.5">
                                {ticket.profiles?.full_name || 'Usuário sem nome'}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">
                                {ticket.profiles?.email || ticket.user_id}
                            </p>
                        </div>
                    ))}
                    {tickets.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            Nenhum ticket encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Chat Area */}
            <div className="flex-1 bg-card-dark border border-white/5 rounded-2xl flex flex-col overflow-hidden relative">
                {selectedTicket ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 bg-[#130821]/50 backdrop-blur-sm flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white">
                                    {selectedTicket.profiles?.full_name || 'Usuário'}
                                </h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">alternate_email</span>
                                    {selectedTicket.profiles?.email}
                                </p>
                            </div>
                            {selectedTicket.status === 'open' && (
                                <button
                                    onClick={closeTicket}
                                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center gap-2 border border-red-500/20 hover:border-red-500/50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">block</span>
                                    Encerrar Atendimento
                                </button>
                            )}
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0f172a] relative">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

                            {messages.map((msg) => {
                                const isAdminMsg = msg.is_admin; // True if sent by admin
                                return (
                                    <div key={msg.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[70%] rounded-2xl p-4 relative shadow-lg ${isAdminMsg
                                                ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white rounded-tr-sm border border-fuchsia-400/20'
                                                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isAdminMsg ? 'text-white/60' : 'text-slate-500'}`}>
                                                {formatTime(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        {selectedTicket.status === 'open' ? (
                            <div className="p-4 bg-[#0f172a] border-t border-white/5 relative z-20">
                                <form onSubmit={sendMessage} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all placeholder:text-slate-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-fuchsia-600/20 font-bold flex items-center gap-2"
                                    >
                                        <span>Enviar</span>
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-900 border-t border-white/5 text-center text-slate-500 text-sm">
                                Este atendimento foi encerrado.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-[#0f172a] relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
                        <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">chat_bubble_outline</span>
                        <p className="text-lg font-medium">Selecione um atendimento para visualizar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
