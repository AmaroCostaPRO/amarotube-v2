"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, Video, AlertTriangle, Send, Clock, RefreshCw, Coins } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApprovalsTab,
  UsersTab,
  ContentTab,
  ReportsTab,
  EconomyTab,
  MessagingTab
} from '@/components/admin';

// Local interfaces
interface AdminReport { id: string; created_at: string; reporter_id: string; reason: string; details?: string; target_type: string; target_id: string; profiles?: { username: string; avatar_url: string } }
interface AdminUser extends Profile { points: number }
interface AdminContent { id: string; title: string; created_at: string; user_id: string; thumbnail_url?: string; channel_name?: string }
interface EconomyLog { id: string; created_at: string; user_id: string; amount: number; type: string; source: string; description?: string }

export default function AdminPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [content, setContent] = useState<AdminContent[]>([]);
  const [economyLogs, setEconomyLogs] = useState<EconomyLog[]>([]);
  const [activeTab, setActiveTab] = useState('approvals');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'approvals') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or('is_approved.eq.false,is_approved.is.null')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setPendingUsers(data || []);
      } else if (activeTab === 'reports') {
        const { data: reportsData } = await supabase
          .from('reports')
          .select('*, profiles:reporter_id(username, avatar_url)')
          .order('created_at', { ascending: false });
        setReports(reportsData || []);
      } else if (activeTab === 'users' || activeTab === 'messaging') {
        const { data: profilesData, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .order('username', { ascending: true });
        const { data: gamificationData } = await supabase
          .from('user_gamification')
          .select('user_id, points');
        if (pError) throw pError;
        const formatted = (profilesData || []).map(u => ({
          ...u,
          points: gamificationData?.find(g => g.user_id === u.id)?.points || 0
        }));
        setUsers(formatted);
      } else if (activeTab === 'content') {
        const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(50);
        setContent(data || []);
      } else if (activeTab === 'economy') {
        const { data } = await supabase.from('economy_logs').select('*').order('created_at', { ascending: false });
        setEconomyLogs(data || []);
      }
    } catch (err: unknown) {
      console.error('Admin Fetch Error:', err);
      toast.error('Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push('/');
      return;
    }
    if (isAdmin) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin, profile, router]);

  // Handlers
  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
      if (error) throw error;
      toast.success('Usuário aprovado!');
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      toast.error('Erro ao aprovar.');
    }
  };

  const handleToggleShadowban = async (userProfile: { id: string; is_shadowbanned?: boolean | null }) => {
    const newValue = !userProfile.is_shadowbanned;
    await supabase.from('profiles').update({ is_shadowbanned: newValue }).eq('id', userProfile.id);
    setUsers(prev => prev.map(u => u.id === userProfile.id ? { ...u, is_shadowbanned: newValue } : u));
    toast.success(newValue ? 'Usuário em shadowban.' : 'Restrições removidas.');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ATENÇÃO: Isso excluirá PERMANENTEMENTE o usuário e todo seu conteúdo. Confirmar?')) return;
    setIsProcessing(userId);
    try {
      const { error } = await supabase.functions.invoke('delete-user-admin', { body: { targetUserId: userId } });
      if (error) throw error;
      toast.success('Usuário removido!');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir: ' + message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteTarget = async (type: string, id: string) => {
    if (type === 'user') return handleDeleteUser(id);
    if (!confirm('Deseja excluir permanentemente este item?')) return;
    const table = type === 'video' ? 'videos' : 'profiles';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast.success('Removido com sucesso.');
      fetchData();
    } else {
      toast.error('Erro ao remover.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !msgContent.trim()) return;
    setIsSendingMsg(true);
    try {
      await supabase.from('admin_messages').insert({ user_id: selectedUserId, content: msgContent.trim() });
      toast.success('Enviado!');
      setMsgContent(''); setSelectedUserId('');
    } catch { toast.error('Falha.'); } finally { setIsSendingMsg(false); }
  };

  const handleResetLogs = async () => {
    const confirmReset = window.confirm("TEM CERTEZA? Isso apagará todo o histórico financeiro.");
    if (!confirmReset) return;
    try {
      const { error } = await supabase.rpc('reset_economy_logs');
      if (error) throw error;
      toast.success("Logs resetados com sucesso!");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao resetar logs.");
    }
  };

  if (!isAdmin) return <div className="p-20 text-center font-black opacity-30 text-xl">Acesso Restrito</div>;

  const triggerClasses = "rounded-xl gap-2 font-bold h-full data-[state=active]:bg-black/[0.04] dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-inner data-[state=active]:text-primary relative";

  return (
    <div className="space-y-6 sm:space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 glass-panel p-3 sm:p-8 rounded-xl sm:rounded-[2.5rem] shadow-2xl border-none">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-xl shrink-0"><ShieldCheck size={32} /></div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Painel de Moderação</h1>
            <p className="font-bold opacity-60 mt-1">Gerenciamento centralizado da rede AmaroTube.</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 px-6 font-bold gap-2">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Atualizar Dados
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6 sm:mb-10 glass-panel p-1.5 h-auto lg:h-16 rounded-xl sm:rounded-2xl border-none shadow-2xl gap-1">
          <TabsTrigger value="approvals" className={triggerClasses}>
            <Clock size={16} /> Aprovações
            {pendingUsers.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingUsers.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="reports" className={triggerClasses}><AlertTriangle size={16} /> Denúncias</TabsTrigger>
          <TabsTrigger value="users" className={triggerClasses}><Users size={16} /> Usuários</TabsTrigger>
          <TabsTrigger value="content" className={triggerClasses}><Video size={16} /> Conteúdo</TabsTrigger>
          <TabsTrigger value="economy" className={triggerClasses}><Coins size={16} /> Economia</TabsTrigger>
          <TabsTrigger value="messaging" className={triggerClasses}><Send size={16} /> Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <ApprovalsTab
            pendingUsers={pendingUsers}
            isProcessing={isProcessing}
            onApprove={handleApprove}
            onDelete={handleDeleteUser}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab
            reports={reports}
            onDeleteTarget={handleDeleteTarget}
            onArchive={(id) => handleDeleteTarget('report', id)}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab
            users={users}
            loading={loading}
            searchTerm={searchTerm}
            isProcessing={isProcessing}
            onSearchChange={setSearchTerm}
            onToggleShadowban={handleToggleShadowban}
            onDeleteUser={handleDeleteUser}
          />
        </TabsContent>

        <TabsContent value="content">
          <ContentTab
            content={content}
            onDelete={(id) => handleDeleteTarget('video', id)}
          />
        </TabsContent>

        <TabsContent value="economy">
          <EconomyTab
            logs={economyLogs}
            onResetLogs={handleResetLogs}
          />
        </TabsContent>

        <TabsContent value="messaging">
          <MessagingTab
            users={users}
            selectedUserId={selectedUserId}
            msgContent={msgContent}
            isSending={isSendingMsg}
            onUserChange={setSelectedUserId}
            onContentChange={setMsgContent}
            onSubmit={handleSendMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
