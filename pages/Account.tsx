import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    balance: number;
    avatar_url: string | null;
}

const Account: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Tratamento da URL do Avatar
            let finalAvatarUrl = null;
            if (data.avatar_url) {
                if (data.avatar_url.startsWith('http')) {
                    finalAvatarUrl = data.avatar_url;
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(data.avatar_url);
                    finalAvatarUrl = publicUrlData.publicUrl;
                }
            }

            setProfile({
                ...data,
                email: user.email || '',
                avatar_url: finalAvatarUrl
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setMessage(null);
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file || !profile) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: filePath })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfile({ ...profile, avatar_url: publicUrl });
            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });

            window.dispatchEvent(new Event('userUpdated')); // Atualiza sidebar

        } catch (error: any) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: 'Erro ao enviar foto.' });
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!profile?.email) return;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'E-mail de redefinição enviado!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Erro ao solicitar redefinição.' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="border-b border-border-dark pb-6">
                <h2 className="text-3xl font-black text-white">Minha Conta</h2>
                <p className="text-text-secondary">Visualize suas informações pessoais e saldo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Balance */}
                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="bg-card-dark p-6 rounded-xl border border-border-dark flex flex-col items-center text-center">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border-dark group-hover:border-primary transition-all">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-background-dark flex items-center justify-center text-text-secondary">
                                        <span className="material-symbols-outlined text-4xl">person</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white">photo_camera</span>
                                </div>
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        <h3 className="mt-4 text-xl font-bold text-white">{profile?.full_name || 'Usuário'}</h3>
                        <p className="text-sm text-text-secondary">{profile?.email}</p>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 p-6 rounded-xl border border-primary/20 relative overflow-hidden">
                        <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">Saldo Disponível</p>
                        <h3 className="text-3xl font-black text-white mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profile?.balance || 0)}
                        </h3>
                        <div className="mt-4">
                            <Link to="/add-funds" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">
                                <span className="material-symbols-outlined">add_card</span>
                                Adicionar Saldo
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Personal Info Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card-dark p-6 rounded-xl border border-border-dark">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">badge</span>
                            Dados Pessoais
                        </h3>

                        {message && (
                            <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    value={profile?.full_name || ''}
                                    readOnly
                                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-text-secondary focus:outline-none cursor-default"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">E-mail</label>
                                <input
                                    type="email"
                                    value={profile?.email || ''}
                                    readOnly
                                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-text-secondary focus:outline-none cursor-default"
                                />
                            </div>
                            <p className="text-xs text-text-secondary pt-2">
                                * Dados pessoais não podem ser alterados. Entre em contato com o suporte se precisar de ajuda.
                            </p>
                        </form>
                    </div>

                    {/* Security Section */}
                    <div className="bg-card-dark p-6 rounded-xl border border-border-dark">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">lock_person</span>
                            Segurança
                        </h3>
                        <div className="p-4 border border-border-dark rounded-lg bg-background-dark/30">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary">key</span>
                                <h4 className="font-bold text-white">Senha de Acesso</h4>
                            </div>
                            <p className="text-sm text-text-secondary mb-4">
                                Recomendamos alterar sua senha periodicamente para manter sua conta segura.
                            </p>
                            <button
                                onClick={handlePasswordReset}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-border-dark transition-colors"
                            >
                                Redefinir Senha
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;