import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { GlobalChatMessage } from '@/types';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Lock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';
import { filterContent } from '@/utils/wordFilter';

export function GlobalChat() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('global_chat')
      .select('*, profiles(username, avatar_url, avatar_border, name_color)')
      .order('created_at', { ascending: true })
      .limit(30);
    
    if (error) return;
    if (data) setMessages(data as GlobalChatMessage[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel('global-chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !session || isSending) return;
    setIsSending(true);
    const sanitizedContent = filterContent(newMessage.trim());
    try {
      const { error } = await supabase.from('global_chat').insert({ content: sanitizedContent, user_id: user.id });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      toast.error('Não foi possível enviar a mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] flex flex-col h-[480px] overflow-hidden shadow-2xl border-none transition-none">
      <CardHeader className="pb-2 border-b border-white/5 bg-white/5 transition-none">
        <CardTitle className="text-lg flex items-center gap-2 transition-none">
          <MessageSquare className="h-5 w-5 text-primary" /> Chat Global
        </CardTitle>
      </CardHeader>
      
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden pt-4 transition-none">
        <ScrollArea className="flex-1 pr-4 transition-none" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="space-y-5 transition-none">
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-1 transition-none">
                  <Link href={`/profile/${msg.profiles?.username}`} className="shrink-0 relative transition-none">
                    {msg.profiles?.avatar_border && msg.profiles.avatar_border !== 'transparent' && (
                      <div className="absolute -inset-1 rounded-full z-0 opacity-50 blur-[1px] transition-none" style={{ background: msg.profiles.avatar_border }} />
                    )}
                    <Avatar className="h-8 w-8 border-2 border-background relative z-10 shadow-sm transition-none">
                      <AvatarImage src={msg.profiles?.avatar_url || ''} />
                      <AvatarFallback className="font-bold text-[10px]">{msg.profiles?.username?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0 transition-none">
                    <div className="flex items-baseline gap-2 mb-0.5 transition-none">
                      <span 
                        className="font-black text-xs truncate group-hover:opacity-80 transition-opacity"
                        style={{ 
                          color: msg.profiles?.name_color || 'inherit',
                          textShadow: msg.profiles?.name_color ? '0px 1px 2px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        @{msg.profiles?.username}
                      </span>
                      <span className="text-[8px] opacity-30 font-bold uppercase whitespace-nowrap transition-none">
                        {formatDistanceToNow(new Date(msg.created_at), { locale: ptBR, addSuffix: true })}
                      </span>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 shadow-sm transition-none">
                       <p className="text-sm opacity-90 leading-tight break-words font-medium transition-none">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-center py-20 opacity-30 italic text-sm">Silêncio total...</div>}
            </div>
          )}
        </ScrollArea>
        
        {session ? (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 pt-2 border-t border-white/5 mt-2 transition-none">
            <div className="flex-1 relative transition-none">
              <Label htmlFor="global-chat-textarea" className="sr-only">Mensagem do Chat</Label>
              <Textarea
                id="global-chat-textarea"
                name="chat-message"
                placeholder="Digite algo"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                rows={1}
                className="min-h-[44px] max-h-[120px] resize-none bg-black/5 dark:bg-white/5 border-none rounded-xl shadow-inner focus-visible:ring-primary py-3 text-sm pr-10 transition-none placeholder:text-black dark:placeholder:text-white placeholder:font-normal"
                disabled={isSending}
              />
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isSending || !newMessage.trim()} 
              className="rounded-xl h-11 w-11 neo-button flex-shrink-0 bg-primary text-white shadow-lg shadow-primary/20 transition-none"
              aria-label="Enviar mensagem para o chat"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        ) : (
          <div className="pt-2 border-t border-white/5 text-center transition-none">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 py-2 transition-none">
              <Lock className="inline h-3 w-3 mr-1 mb-0.5" /> Bate-papo restrito a membros
            </p>
          </div>
        )}
      </div>
    </div>
  );
}