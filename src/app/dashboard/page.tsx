"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGamification } from '@/context/GamificationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, ShoppingBag, BellRing, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { ProfileTab } from '@/components/dashboard/ProfileTab';
import { CustomizeTab } from '@/components/dashboard/CustomizeTab';
import { StoreTab } from '@/components/dashboard/StoreTab';

import { StoreReward } from '@/types';

interface AdminMessage {
  id: string;
  created_at: string;
  content: string;
  is_read: boolean;
  user_id: string;
}

export default function DashboardPage() {
  const { session, user, profile, signOut, refreshProfile } = useAuth();
  const {
    wallpaper, setWallpaper, addCustomWallpaper, removeCustomWallpaper,
    showCursor, setShowCursor, pointerColor, setPointerColor,
    avatarBorder, setAvatarBorder
  } = useTheme(); // [MODIFIED]
  const { stats, unlockItem, isLoading: isLoadingStats } = useGamification();

  const [isUploading, setIsUploading] = useState(false); // [NEW]
  const [storeRewards, setStoreRewards] = useState<StoreReward[]>([]); // [NEW]
  const [isLoadingStore, setIsLoadingStore] = useState(true); // [NEW]

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('customize');

  const fetchStoreItems = useCallback(async () => {
    setIsLoadingStore(true);
    try {
      const { data, error } = await supabase.from('store_items').select('*').order('cost', { ascending: true });
      if (error) throw error;

      const formatted = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        cost: item.cost,
        type: item.type,
        value: item.metadata?.value
      }));
      setStoreRewards(formatted);
    } catch (err) {
      console.error('Erro ao buscar itens da loja:', err);
    } finally {
      setIsLoadingStore(false);
    }
  }, []);

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
    fetchStoreItems();
  }, [profile, user, fetchAdminMessages, fetchStoreItems]);

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

  const handleWallpaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    setIsUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/wp_${Date.now()}.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage.from('wallpapers').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('wallpapers').getPublicUrl(filePath);
      addCustomWallpaper(publicUrl);
      toast.success('Papel de parede enviado!');
    } catch {
      toast.error('Erro no upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUnlock = async (reward: StoreReward) => {
    const success = await unlockItem(reward.id, reward.cost);
    if (success) {
      if (reward.type === 'cursor') setPointerColor(reward.value);
      if (reward.type === 'border') setAvatarBorder(reward.value);
      if (reward.type === 'wallpaper') setWallpaper(reward.value);
      if (reward.type === 'name_color') {
        await supabase.from('profiles').update({ name_color: reward.value }).eq('id', user?.id);
        await refreshProfile();
        toast.success('Cor equipada com sucesso!');
      }
    }
  };

  const handleUseReward = async (reward: StoreReward) => {
    if (reward.type === 'cursor') setPointerColor(reward.value);
    if (reward.type === 'border') setAvatarBorder(reward.value);
    if (reward.type === 'wallpaper') setWallpaper(reward.value);
    if (reward.type === 'name_color') {
      await supabase.from('profiles').update({ name_color: reward.value }).eq('id', user?.id);
      await refreshProfile();
      toast.success('Cor equipada!');
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
          {isLoadingStore ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
          ) : (
            <CustomizeTab
              wallpaper={wallpaper}
              setWallpaper={setWallpaper}
              // addCustomWallpaper={addCustomWallpaper}
              removeCustomWallpaper={removeCustomWallpaper}
              showCursor={showCursor}
              setShowCursor={setShowCursor}
              pointerColor={pointerColor}
              setPointerColor={setPointerColor}
              avatarBorder={avatarBorder}
              setAvatarBorder={setAvatarBorder}
              stats={stats}
              isUploading={isUploading}
              handleFileUpload={handleWallpaperUpload}
              rewards={storeRewards}
            />
          )}
        </TabsContent>
        
        <TabsContent value="store" className="transition-none">
          {isLoadingStore ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
          ) : (
            <StoreTab stats={stats} rewards={storeRewards} onUnlock={handleUnlock} onUse={handleUseReward} />
          )}
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
