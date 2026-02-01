"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGamification } from '@/context/GamificationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, ShoppingBag, BellRing, User, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Componentes
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { ProfileTab } from '@/components/dashboard/ProfileTab';

interface AdminMessage {
  id: string;
  created_at: string;
  content: string;
  is_read: boolean;
  user_id: string;
}

export default function DashboardPage() {
  const { session, user, profile, signOut, refreshProfile } = useAuth();
  const { avatarBorder } = useTheme();
  const { stats, isLoading: isLoadingStats } = useGamification();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('customize');

  const fetchAdminMessages = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('admin_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) {
      setAdminMessages(data);
      setUnreadCount(data.filter(m => !m.is_read).length);
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile?.username) setNewUsername(profile.username);
    if (user?.id) fetchAdminMessages();
  }, [profile, user, fetchAdminMessages]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;

    setIsUploadingAvatar(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Foto de perfil atualizada!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error('Erro no upload: ' + msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!user || !newUsername.trim() || newUsername === profile?.username) return;
    setIsSavingUsername(true);
    try {
      const { error } = await supabase.from('profiles').update({ username: newUsername.trim() }).eq('id', user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success('Nome de usuário atualizado!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error('Erro ao atualizar: ' + msg);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleUpdatePrivacy = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Configuração de privacidade atualizada!');
    } catch {
      toast.error('Erro ao atualizar privacidade.');
    }
  };

  const triggerClasses = "rounded-xl gap-2 font-bold transition-none h-full data-[state=active]:bg-black/[0.04] dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-inner data-[state=active]:text-primary relative disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed";

  return (
    <div className="smart-container--wide py-4 sm:py-8 transition-none">
      <DashboardHeader
        profile={profile}
        user={user}
        stats={stats}
        avatarBorder={avatarBorder}
        isUploadingAvatar={isUploadingAvatar}
        handleAvatarUpload={handleAvatarUpload}
        isLoadingStats={isLoadingStats}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full transition-none">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6 sm:mb-10 glass-panel p-1.5 h-auto md:h-16 rounded-xl transition-none border-none shadow-2xl gap-1">
          <TabsTrigger value="customize" className={triggerClasses}><Palette className="h-4 w-4" /> Visual</TabsTrigger>
          <TabsTrigger value="store" disabled={!session} className={triggerClasses}><ShoppingBag className="h-4 w-4" /> Loja</TabsTrigger>
          <TabsTrigger value="messages" disabled={!session} className={triggerClasses}>
            <BellRing className="h-4 w-4" /> Mensagens
            {session && unreadCount > 0 && <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="profile" disabled={!session} className={triggerClasses}><User className="h-4 w-4" /> Conta</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customize" className="transition-none">
          <div className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black">Personalização Visual</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              Escolha fundos, cores de cursor e bordas para personalizar sua experiência.
            </p>
            {!session ? (
              <div className="text-center py-16 opacity-50">
                <Lock className="h-16 w-16 mx-auto mb-4" />
                <p className="text-xl font-black">Faça login para acessar</p>
                <p className="text-sm">Personalize seu perfil após autenticar-se.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary flex items-center justify-center">
                  <span className="text-xs font-bold opacity-60">Tema Atual</span>
                </div>
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-white/10 opacity-60 hover:opacity-100 cursor-pointer transition-all" />
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-white/10 opacity-60 hover:opacity-100 cursor-pointer transition-all" />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="store" className="transition-none">
          <div className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black">Loja de Itens</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              Use seus créditos para desbloquear itens exclusivos.
            </p>
            <div className="text-center py-16 opacity-50">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4" />
              <p className="text-xl font-black">Em breve</p>
              <p className="text-sm">Novos itens serão adicionados em atualizações futuras.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="messages" className="transition-none">
          <MessagesTab adminMessages={adminMessages} deleteMessage={() => { }} />
        </TabsContent>
        
        <TabsContent value="profile" className="transition-none">
          <ProfileTab
            user={user}
            profile={profile}
            stats={stats}
            newUsername={newUsername}
            setNewUsername={setNewUsername}
            handleUpdateUsername={handleUpdateUsername}
            isSavingUsername={isSavingUsername}
            handleSignOut={signOut}
            onUpdatePrivacy={handleUpdatePrivacy}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
