import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Helper to format date
const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const SupportWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    // Restored state variables
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingUser, setCheckingUser] = useState(true);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Initial check for admin
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'brunomeueditor@gmail.com') {
                setIsAdmin(true);
            }
            setCheckingUser(false);
        };
        checkUser();
    }, []);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, previewUrl]);

    // Handle toggle event from Sidebar
    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggleSupport', handleToggle);
        return () => window.removeEventListener('toggleSupport', handleToggle);
    }, []);

    // Initialize user and ticket
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchActiveTicket(user.id);
            }
        };
        if (isOpen) init();
    }, [isOpen]);

    // Real-time subscription
    useEffect(() => {
        if (!ticket) return;

        const channel = supabase
            .channel('ticket_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticket.id}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ticket]);

    const fetchActiveTicket = async (uid: string) => {
        setLoading(true);
        // Find open ticket
        const { data: tickets } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', uid)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1);

        if (tickets && tickets.length > 0) {
            const activeTicket = tickets[0];
            setTicket(activeTicket);
            // Fetch messages
            const { data: msgs } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', activeTicket.id)
                .order('created_at', { ascending: true });

            if (msgs) setMessages(msgs);
        } else {
            setTicket(null);
            setMessages([]);
        }
        setLoading(false);
    };

    const createTicket = async () => {
        if (!userId) return;
        setLoading(true);

        // Create new ticket
        const { data: newTicket, error } = await supabase
            .from('tickets')
            .insert([{ user_id: userId, status: 'open' }])
            .select()
            .single();

        if (newTicket) {
            setTicket(newTicket);
        } else {
            console.error('Error creating ticket:', error);
        }
        setLoading(false);
    };

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
        if ((!newMessage.trim() && !selectedFile) || !userId || !ticket) return;

        const msgContent = newMessage.trim();
        setNewMessage('');

        let attachmentUrl = null;

        // Upload attachment if exists
        if (selectedFile) {
            setIsUploading(true);
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${ticket.id}/${fileName}`;

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
                ticket_id: ticket.id,
                sender_id: userId,
                message: msgContent,
                attachment_url: attachmentUrl,
                is_admin: false
            }]);

        if (error) {
            console.error('Error sending message:', error);
        }
    };

    if (checkingUser) return null;
    if (isAdmin) return null;
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[380px] h-[600px] max-h-[80vh] bg-[#0f172a] border border-fuchsia-500/50 rounded-2xl shadow-[0_0_30px_rgba(192,38,211,0.2)] flex flex-col z-[60] overflow-hidden animate-slide-up font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-fuchsia-900/50 to-purple-900/50 p-4 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                        <span className="material-symbols-outlined text-fuchsia-300">support_agent</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Suporte SocialPrime</h3>
                        <p className="text-xs text-fuchsia-300/70 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online agora
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f172a] relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !ticket ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 relative z-10">
                        <div className="w-20 h-20 bg-fuchsia-500/10 rounded-full flex items-center justify-center mb-4 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(192,38,211,0.1)]">
                            <span className="material-symbols-outlined text-4xl text-fuchsia-400">rocket_launch</span>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">Precisa de ajuda?</h4>
                        <p className="text-slate-400 text-sm mb-6">
                            Nossa equipe de especialistas está pronta para decolar com você. Inicie um atendimento abaixo.
                        </p>
                        <button
                            onClick={createTicket}
                            className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-fuchsia-600/20 transition-all hover:scale-105 active:scale-95 w-full flex items-center justify-center gap-2"
                        >
                            <span>Iniciar Atendimento</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-4">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold bg-white/5 px-2 py-1 rounded-full">
                                Início do Atendimento
                            </span>
                        </div>

                        {messages.map((msg) => {
                            const isMe = msg.sender_id === userId;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3 relative group ${isMe
                                            ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-fuchsia-900/20'
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
                                        {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-slate-500'}`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            {ticket && (
                <div className="p-4 bg-[#0f172a] border-t border-white/5 relative z-20">
                    {previewUrl && (
                        <div className="mb-3 flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
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

                    <form onSubmit={sendMessage} className="flex gap-2 relative items-end">
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
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all placeholder:text-slate-600"
                        />
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                            className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-fuchsia-600/20 flex items-center justify-center aspect-square"
                        >
                            {isUploading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined">send</span>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SupportWidget;
