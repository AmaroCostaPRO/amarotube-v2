"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PartyMessage } from '@/types/party';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function PartyChat({ partyId }: { partyId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('watch_party_messages')
        .select('*, profiles(username, avatar_url, name_color)')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data) setMessages(data as PartyMessage[]);
    };

    fetchHistory();

    const channel = supabase
      .channel(`party-chat-${partyId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'watch_party_messages', 
        filter: `party_id=eq.${partyId}` 
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, name_color')
          .eq('id', payload.new.user_id)
          .single();

        const msgWithProfile = {
          ...payload.new,
          profiles: profile
        } as PartyMessage;

        setMessages(prev => [...prev, msgWithProfile]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partyId]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    
    const { error } = await supabase
      .from('watch_party_messages')
      .insert({
        party_id: partyId,
        user_id: user.id,
        content: newMessage.trim()
      });

    if (error) {
      toast.error("Erro ao enviar mensagem.");
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-2" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-7 w-7 shrink-0 border border-background shadow-sm">
                <AvatarImage src={msg.profiles?.avatar_url} />
                <AvatarFallback>{msg.profiles?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[80%] space-y-1 ${msg.user_id === user?.id ? 'items-end' : ''}`}>
                 <div className={`flex items-baseline gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    <span 
                      className="text-[10px] font-black uppercase"
                      style={{ color: msg.profiles?.name_color || 'inherit', opacity: msg.profiles?.name_color ? 1 : 0.4 }}
                    >
                      {msg.profiles?.username}
                    </span>
                    <span className="text-[8px] opacity-30 font-bold">{formatDistanceToNow(new Date(msg.created_at), { locale: ptBR, addSuffix: true })}</span>
                 </div>
                 <div className={`p-3 rounded-2xl text-sm leading-snug shadow-sm ${
                   msg.user_id === user?.id 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-white/5 border border-white/5 rounded-tl-none'
                 }`}>
                    {msg.content}
                 </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-10 opacity-30 italic text-xs">A sala está silenciosa... Diga oi!</div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
        <Input 
          placeholder="Comente as cenas..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="h-11 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner"
          disabled={isSending}
        />
        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className="rounded-xl h-11 w-11 neo-button shrink-0">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
