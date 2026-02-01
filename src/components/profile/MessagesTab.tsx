"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PrivateMessage, ChatConversation, Profile } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Clock, Loader2, Mail, Ghost, ShieldCheck, Search, MessageSquarePlus, Trash2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

export function MessagesTab() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTemp, setIsTemp] = useState(false);
  const [loading, setLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const fetchInbox = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('private_messages')
      .select(`
        *, 
        sender:profiles!private_messages_sender_id_fkey(id, username, avatar_url), 
        receiver:profiles!private_messages_receiver_id_fkey(id, username, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const grouped = new Map();
      (data as unknown as PrivateMessage[]).forEach(msg => {
        const isSender = msg.sender_id === user.id;
        const otherId = isSender ? msg.receiver_id : msg.sender_id;
        const isDeletedByMe = isSender ? msg.deleted_by_sender : msg.deleted_by_receiver;

        if (!grouped.has(otherId) && !isDeletedByMe) {
          grouped.set(otherId, {
            user: isSender ? msg.receiver : msg.sender,
            lastMsg: msg,
            userId: otherId
          });
        }
      });
      setConversations(Array.from(grouped.values()) as ChatConversation[]);
    }
    setLoading(false);
  }, [user]);

  const fetchChatMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      const visible = (data as unknown as PrivateMessage[]).filter(m => {
        const isMeSender = m.sender_id === user.id;
        return isMeSender ? !m.deleted_by_sender : !m.deleted_by_receiver;
      });
      setMessages(visible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return;
    setIsSearching(true);
    const { data } = await supabase.from('profiles').select('id, username, avatar_url').ilike('username', `%${userSearch}%`).neq('id', user?.id).limit(5);
    setSearchResults((data as unknown as Profile[]) || []);
    setIsSearching(false);
  };

  const handleSelectConversation = (conv: ChatConversation) => {
    setSelectedChat(conv);
    activeChatIdRef.current = conv.userId;
    sessionStorage.setItem('active_chat_id', conv.userId);
    setMessages([]);
    fetchChatMessages(conv.userId);

    if (!conv.lastMsg) {
      setConversations(prev => {
        const existing = prev.find(c => c.userId === conv.userId);
        if (existing) return prev;
        return [{ ...conv, lastMsg: { content: 'Nova conversa' } }, ...prev];
      });
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    activeChatIdRef.current = null;
    sessionStorage.removeItem('active_chat_id');
  };

  useEffect(() => {
    if (!user) return;

    const savedChatId = sessionStorage.getItem('active_chat_id');
    if (savedChatId) {
      supabase.from('profiles').select('id, username, avatar_url').eq('id', savedChatId).single().then(({ data }) => {
        if (data) {
          const savedConv = { user: data, userId: data.id, lastMsg: { content: 'Carregando...' } };
          setSelectedChat(savedConv);
          activeChatIdRef.current = data.id;
          fetchChatMessages(data.id);
        }
      });
    }

    fetchInbox();

    const channel = supabase
      .channel(`dm-realtime-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const msg = payload.new as PrivateMessage;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          fetchInbox();
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (activeChatIdRef.current === otherId) {
            setMessages(current => {
              if (current.some(m => m.id === msg.id)) return current;
              return [...current, msg];
            });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchInbox, fetchChatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !selectedChat || isSending) return;
    const content = newMessage.trim();
    const otherId = selectedChat.userId;
    setNewMessage('');
    setIsSending(true);

    try {
      await supabase.from('private_messages').update({ deleted_by_sender: false, deleted_by_receiver: false }).or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`);
      const { error } = await supabase.from('private_messages').insert({ sender_id: user.id, receiver_id: otherId, content: content, is_temporary: isTemp, expires_at: isTemp ? new Date(Date.now() + 86400000).toISOString() : null });
      if (error) throw error;
    } catch { toast.error('Falha ao enviar.'); } finally { setIsSending(false); }
  };

  const handleDeleteChat = async () => {
    if (!user || !selectedChat || !confirm('Ocultar conversa para você?')) return;
    setIsDeleting(true);
    const otherId = selectedChat.userId;
    try {
      await supabase.from('private_messages').update({ deleted_by_sender: true }).match({ sender_id: user.id, receiver_id: otherId });
      await supabase.from('private_messages').update({ deleted_by_receiver: true }).match({ receiver_id: user.id, sender_id: otherId });
      await supabase.from('private_messages').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`).eq('deleted_by_sender', true).eq('deleted_by_receiver', true);
      sessionStorage.removeItem('active_chat_id'); activeChatIdRef.current = null; setSelectedChat(null); setMessages([]); fetchInbox(); toast.success('Conversa removida.');
    } catch { toast.error('Erro ao limpar histórico.'); } finally { setIsDeleting(false); }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="space-y-6">
      <Card className="glass-panel rounded-xl sm:rounded-[2.5rem] h-[600px] overflow-hidden flex shadow-2xl transition-none relative border border-white/10">
        <aside className={cn("w-full sm:w-80 border-r border-black/5 dark:border-white/5 flex flex-col bg-black/[0.01] dark:bg-white/5 transition-none", isMobile && selectedChat && "hidden")}>
          <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2"><Mail className="text-primary" /> Inbox</h3>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-primary/10 text-primary transition-colors"><MessageSquarePlus size={20} /></Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-8 shadow-2xl max-w-sm">
                <DialogHeader><DialogTitle className="text-2xl font-black">Nova Conversa</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input placeholder="Username..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUsers()} className="rounded-xl border-none bg-black/5 dark:bg-white/5 shadow-inner" />
                    <Button onClick={handleSearchUsers} disabled={isSearching} size="icon" className="rounded-xl shrink-0">{isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={18} />}</Button>
                  </div>
                  <div className="space-y-2">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => { setIsNewChatOpen(false); handleSelectConversation({ user: u, userId: u.id, lastMsg: { content: 'Nova conversa' } }); }} className="w-full p-3 rounded-xl bg-white/5 hover:bg-primary/10 border border-white/5 flex items-center gap-3 transition-all text-left">
                        <Avatar className="h-8 w-8 border border-background"><AvatarImage src={u.avatar_url || ''} /><AvatarFallback>{u.username?.[0]}</AvatarFallback></Avatar>
                        <span className="font-bold text-sm">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <button key={conv.userId} onClick={() => handleSelectConversation(conv)} className={cn("w-full p-4 rounded-2xl flex items-center gap-3 hover:bg-primary/5 transition-all text-left group", selectedChat?.userId === conv.userId && "bg-primary/10 shadow-sm")}>
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm"><AvatarImage src={conv.user?.avatar_url || undefined} /><AvatarFallback>{conv.user?.username?.[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">@{conv.user?.username}</p>
                    <p className="text-[10px] opacity-40 font-bold truncate uppercase">{conv.lastMsg?.content || 'Abrir chat...'}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <main className={cn("flex-1 flex flex-col transition-none bg-black/[0.005] dark:bg-transparent", isMobile && !selectedChat && "hidden")}>
          {selectedChat ? (
            <>
              <header className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/5 transition-none">
                <div className="flex items-center gap-3">
                  {isMobile && <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-1 -ml-2 rounded-full active:scale-90"><ArrowLeft size={20} /></Button>}
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md"><AvatarImage src={selectedChat.user?.avatar_url || undefined} /><AvatarFallback>{selectedChat.user?.username?.[0]}</AvatarFallback></Avatar>
                  <div><p className="font-black text-sm sm:text-base">@{selectedChat.user?.username}</p><p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Conexão Segura</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDeleteChat} disabled={isDeleting} className="rounded-xl h-10 w-10 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={18} /></Button>
              </header>

              <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
                <div className="space-y-6">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn("flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] animate-in fade-in", msg.sender_id === user?.id ? "ml-auto items-end" : "items-start")}>
                      <div className={cn("p-3 sm:p-4 rounded-xl text-sm leading-relaxed shadow-sm relative group", msg.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-tl-none")}>
                        {msg.is_temporary && <Ghost size={12} className="absolute -top-4 right-0 text-orange-500 animate-bounce" />}
                        <p className="break-words">{msg.content}</p>
                      </div>
                      <span className="text-[8px] font-black uppercase opacity-30">{formatDistanceToNow(new Date(msg.created_at), { locale: ptBR, addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <footer className="p-4 sm:p-6 border-t border-black/5 dark:border-white/5 space-y-4 bg-black/[0.02] dark:bg-white/5 transition-none">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="temp-mode" className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1"><Clock size={12} /> Mensagem Temporária</Label>
                    <Switch id="temp-mode" checked={isTemp} onCheckedChange={setIsTemp} className="scale-75" />
                  </div>
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input placeholder="Sua mensagem..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="h-12 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner font-bold" disabled={isSending} />
                  <Button type="submit" disabled={isSending || !newMessage.trim()} className="h-12 w-12 rounded-xl neo-button p-0 shrink-0 shadow-lg shadow-primary/20">{isSending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}</Button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-10 transition-none">
              <ShieldCheck size={64} className="mb-6" />
              <h4 className="text-2xl font-black mb-2">Inbox Privado</h4>
              <p className="max-w-xs font-bold leading-tight">Suas mensagens são criptografadas e privadas. Selecione um contato na barra lateral para começar.</p>
            </div>
          )}
        </main>
      </Card>
    </div>
  );
}
