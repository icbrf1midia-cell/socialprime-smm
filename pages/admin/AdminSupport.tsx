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

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    // When ticket selected, fetch messages and mark as read
    useEffect(() => {
        if (!selectedTicket) return;

        const fetchMessages = async () => {
            const { data: msgs } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', selectedTicket.id)
                .order('created_at', { ascending: true });

            if (msgs) setMessages(msgs);

            // Mark user messages as read
            const unreadUserMessages = msgs?.filter(m => !m.is_admin && !m.read_at);
            if (unreadUserMessages && unreadUserMessages.length > 0) {
                await supabase
                    .from('ticket_messages')
                    .update({ read_at: new Date().toISOString() })
                    .eq('ticket_id', selectedTicket.id)
                    .eq('is_admin', false)
                    .is('read_at', null);
            }
        };

        fetchMessages();

        // Realtime messages for selected ticket
        const messageChannel = supabase
            .channel(`admin_messages_${selectedTicket.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT', // Listen for new messages
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${selectedTicket.id}`
                },
                async (payload) => {
                    setMessages(prev => [...prev, payload.new]);

                    // Specific logic: if new message is from user, mark as read immediately if we are looking at it
                    if (!payload.new.is_admin) {
                        await supabase
                            .from('ticket_messages')
                            .update({ read_at: new Date().toISOString() })
                            .eq('id', payload.new.id);
                    }
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
    }, [messages, previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('O arquivo deve ter no máximo 5MB.');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearAttachment = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !selectedTicket) return;

        const msgContent = newMessage.trim();
        setNewMessage('');

        let attachmentUrl = null;

        // Upload attachment if exists
        if (selectedFile) {
            setIsUploading(true);
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${selectedTicket.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('support-attachments')
                .upload(filePath, selectedFile);

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
                alert('Erro ao enviar imagem. Tente novamente.');
                setIsUploading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('support-attachments')
                .getPublicUrl(filePath);

            attachmentUrl = publicUrl;
            setIsUploading(false);
            clearAttachment();
        }

        const { error } = await supabase
            .from('ticket_messages')
            .insert([{
                ticket_id: selectedTicket.id,
                message: msgContent,
                attachment_url: attachmentUrl,
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
                                            {msg.attachment_url && (
                                                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                                                    <img
                                                        src={msg.attachment_url}
                                                        alt="Anexo"
                                                        className="max-w-full max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(msg.attachment_url, '_blank')}
                                                    />
                                                </div>
                                            )}
                                            {msg.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
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
                                {previewUrl && (
                                    <div className="mb-3 flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10 max-w-fit">
                                        <div className="w-12 h-12 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 max-w-[150px]">
                                            <p className="text-white text-xs truncate font-medium">{selectedFile?.name}</p>
                                            <p className="text-slate-400 text-[10px]">{(selectedFile!.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            onClick={clearAttachment}
                                            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={sendMessage} className="flex gap-4 items-end">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-slate-400 hover:text-fuchsia-400 hover:bg-white/5 rounded-xl transition-colors"
                                        title="Anexar imagem"
                                    >
                                        <span className="material-symbols-outlined">attach_file</span>
                                    </button>

                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all placeholder:text-slate-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                                        className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-fuchsia-600/20 font-bold flex items-center gap-2"
                                    >
                                        {isUploading ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <span>Enviar</span>
                                                <span className="material-symbols-outlined">send</span>
                                            </>
                                        )}
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
