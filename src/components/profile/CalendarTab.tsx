"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { CalendarEvent, CalendarShare, Profile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Bell, Trash2, Share2, Loader2, Info, UserPlus, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function CalendarTab({ targetUserId, isOwnProfile }: { targetUserId: string, isOwnProfile: boolean }) {
   const { user } = useAuth();
   const [date, setDate] = useState<Date | undefined>(new Date());
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [shares, setShares] = useState<CalendarShare[]>([]);
   const [friends, setFriends] = useState<Profile[]>([]);
   const [loading, setLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars

   const [newTitle, setNewTitle] = useState('');
   const [newDesc, setNewDesc] = useState('');
   const [hasAlert, setHasAlert] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   const fetchData = useCallback(async () => {
      setLoading(true);
      try {
         const { data: sharesData } = await supabase
            .from('calendar_shares')
            .select(`
          *, 
          owner:profiles!calendar_shares_owner_id_fkey(id, username, avatar_url), 
          shared_with:profiles!calendar_shares_shared_with_id_fkey(id, username, avatar_url)
        `)
            .or(`owner_id.eq.${targetUserId},shared_with_id.eq.${targetUserId}`);

         setShares((sharesData as unknown as CalendarShare[]) || []);

         let userIdsToFetch = [targetUserId];
         if (isOwnProfile) {
            const sharedWithMe = (sharesData || [])
               .filter(s => s.shared_with_id === targetUserId)
               .map(s => s.owner_id);
            userIdsToFetch = Array.from(new Set([...userIdsToFetch, ...sharedWithMe]));
         }

         const { data: eventsData } = await supabase
            .from('calendar_events')
            .select('*')
            .in('user_id', userIdsToFetch)
            .order('event_date', { ascending: true });

         const authorIds = Array.from(new Set((eventsData || []).map(e => e.user_id)));
         const { data: profilesData } = await supabase.from('profiles').select('id, username, avatar_url').in('id', authorIds);

         const enrichedEvents = (eventsData || []).map(evt => ({
            ...evt,
            profiles: profilesData?.find(p => p.id === evt.user_id)
         })).filter(evt => {
            if (evt.user_id === targetUserId) return true;
            const shareRecord = (sharesData || []).find(s => s.owner_id === evt.user_id && s.shared_with_id === targetUserId);
            if (!shareRecord) return false;
            if (shareRecord.share_type === 'full') return true;
            return shareRecord.target_date === evt.event_date;
         });

         setEvents(enrichedEvents as unknown as CalendarEvent[]);

         if (isOwnProfile) {
            const { data: f } = await supabase
               .from('friendships')
               .select(`
            friend:profiles!friendships_friend_id_fkey(id, username, avatar_url),
            requester:profiles!friendships_user_id_fkey(id, username, avatar_url)
          `)
               .eq('status', 'accepted')
               .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);

            const friendsList = (f || []).map(item => {
               const friendObj = Array.isArray(item.friend) ? item.friend[0] : item.friend;
               const requesterObj = Array.isArray(item.requester) ? item.requester[0] : item.requester;
               return (friendObj?.id === user?.id ? requesterObj : friendObj) as Profile;
            });
            setFriends(friendsList.filter(Boolean));
         }
      } catch (err) { console.error('Calendar Fetch Error:', err); } finally { setLoading(false); }
   }, [targetUserId, isOwnProfile, user?.id]);

   useEffect(() => { fetchData(); }, [fetchData]);

   const handleAddEvent = async () => {
      if (!date || !newTitle.trim() || !user) return;
      setIsSaving(true);
      try {
         const { error } = await supabase.from('calendar_events').insert({
            user_id: user.id,
            title: newTitle.trim(),
            description: newDesc.trim(),
            event_date: format(date, 'yyyy-MM-dd'),
            has_alert: hasAlert
         });
         if (error) throw error;
         toast.success('Evento agendado!');
         setNewTitle(''); setNewDesc(''); fetchData();
      } catch { toast.error('Falha ao salvar.'); } finally { setIsSaving(false); }
   };

   const handleShare = async (friendId: string, type: 'full' | 'specific_day') => {
      if (type === 'specific_day' && !date) return;
      try {
         const { error } = await supabase.from('calendar_shares').insert({
            owner_id: user?.id,
            shared_with_id: friendId,
            share_type: type,
            target_date: type === 'specific_day' ? format(date!, 'yyyy-MM-dd') : null
         });
         if (error) throw error;
         toast.success(type === 'full' ? 'Agenda compartilhada!' : 'Dia compartilhado!');
         fetchData();
      } catch (err: unknown) {
         if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') toast.info('Já compartilhado com este amigo.');
         else toast.error('Falha ao compartilhar.');
      }
   };

   const dayEvents = events.filter(e => e.event_date === (date ? format(date, 'yyyy-MM-dd') : ''));
   const eventDays = events.map(e => new Date(`${e.event_date}T12:00:00`));

   const modifiers = { hasEvent: eventDays };
   const modifiersStyles = {
      hasEvent: {
         boxShadow: 'inset 0 -4px 0 -2px hsl(var(--primary))',
         fontWeight: 'bold'
      }
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 transition-none">
         <Card
            className="glass-panel rounded-xl sm:rounded-[2.5rem] p-6 shadow-xl h-fit transition-none flex flex-col items-center overflow-hidden border border-white/10"
            style={{ transform: 'translateZ(0)', backgroundClip: 'padding-box' }}
         >
            <div className="w-full flex justify-center transition-none">
               <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-3xl border-none font-bold scale-100 sm:scale-105"
                  locale={ptBR}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  classNames={{
                     selected: "!bg-primary !text-primary-foreground !opacity-100 hover:bg-primary focus:bg-primary rounded-full",
                     today: "!bg-foreground !text-background font-black rounded-full hover:opacity-90",
                     day_button: cn(
                        "h-9 w-9 p-0 font-normal rounded-full transition-all flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:opacity-100"
                     ),
                     day: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                     button_previous: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity rounded-full"
                     ),
                     button_next: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity rounded-full"
                     ),
                  }}
               />
            </div>
            <div className="w-full mt-6 pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
               <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase opacity-40">Dias com compromisso</span>
               </div>

               {isOwnProfile && (
                  <div className="px-2 pt-2">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full h-11 rounded-2xl gap-2 font-bold border-black/5 dark:border-white/10 hover:bg-primary/5 transition-all text-xs uppercase">
                              <Share2 size={16} /> Compartilhar Tudo
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="center" className="w-64 glass-panel-matte border-white/20 p-4 rounded-[2rem] shadow-2xl z-100 opacity-100 backdrop-blur-3xl">
                           <p className="text-[10px] font-black uppercase opacity-60 text-center pb-4 tracking-widest border-b border-white/5 mb-3">Enviar agenda completa</p>
                           <ScrollArea className="h-48 pr-2">
                              {friends.map(f => (
                                 <button key={f.id} onClick={() => handleShare(f.id, 'full')} className="w-full flex items-center justify-between p-2 hover:bg-primary/10 rounded-xl transition-all group mb-1">
                                    <span className="text-xs font-bold truncate">@{f.username}</span>
                                    <PlusCircle size={14} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                 </button>
                              ))}
                              {friends.length === 0 && <p className="text-center py-10 text-[10px] font-bold opacity-30 italic">Nenhum amigo ativo</p>}
                           </ScrollArea>
                        </PopoverContent>
                     </Popover>
                  </div>
               )}
            </div>
         </Card>

         <div className="space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-none px-2">
               <div className="transition-none">
                  <h3 className="text-2xl font-black tracking-tight text-contrast-bg">{date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}</h3>
                  <p className="font-bold opacity-40 uppercase text-xs tracking-widest text-contrast-bg">{dayEvents.length} compromissos registrados</p>
               </div>

               {isOwnProfile && date && (
                  <div className="flex gap-2 w-full sm:w-auto">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="rounded-2xl h-12 px-6 font-black gap-2 border-black/5 dark:border-white/10 hover:bg-white/5 transition-all text-xs uppercase bg-white/5 text-contrast-bg flex-1 sm:flex-none">
                              <UserPlus size={18} className="text-primary" /> Convidar
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" className="w-64 glass-panel-matte border-white/20 p-4 rounded-[2rem] shadow-2xl z-100 opacity-100 backdrop-blur-3xl">
                           <p className="text-[10px] font-black uppercase opacity-60 text-center pb-4 tracking-widest border-b border-white/5 mb-3">Convidar para este dia</p>
                           <ScrollArea className="h-48 pr-2">
                              {friends.map(f => (
                                 <button key={f.id} onClick={() => handleShare(f.id, 'specific_day')} className="w-full flex items-center justify-between p-2 hover:bg-primary/10 rounded-xl transition-all group mb-1">
                                    <span className="text-xs font-bold truncate">@{f.username}</span>
                                    <PlusCircle size={14} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                 </button>
                              ))}
                              {friends.length === 0 && <p className="text-center py-10 text-[10px] font-bold opacity-30 italic">Nenhum amigo ativo</p>}
                           </ScrollArea>
                        </PopoverContent>
                     </Popover>

                     <Dialog>
                        <DialogTrigger asChild>
                           <Button className="rounded-2xl font-black gap-2 neo-button bg-primary text-white px-6 h-12 shadow-lg shadow-primary/20 flex-1 sm:flex-none"><PlusCircle size={18} /> Novo Item</Button>
                        </DialogTrigger>
                        <DialogContent className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] shadow-2xl max-w-md p-8">
                           <DialogHeader><DialogTitle className="text-2xl font-black">Adicionar à Agenda</DialogTitle></DialogHeader>
                           <div className="space-y-5 pt-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Título</Label>
                                 <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-12 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner font-bold" placeholder="Ex: Lançamento de Vídeo Novo" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Descrição</Label>
                                 <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner min-h-[100px]" placeholder="Mais detalhes..." />
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                 <Bell className="text-primary h-5 w-5" />
                                 <div className="flex-1">
                                    <p className="text-xs font-black uppercase tracking-tighter">Ativar Alerta</p>
                                    <p className="text-[9px] opacity-40 font-bold">Você receberá uma notificação no dia do evento.</p>
                                 </div>
                                 <Input type="checkbox" checked={hasAlert} onChange={e => setHasAlert(e.target.checked)} className="h-5 w-5 rounded-md border-primary text-primary" />
                              </div>
                           </div>
                           <DialogFooter className="pt-6">
                              <Button onClick={handleAddEvent} disabled={isSaving} className="w-full h-12 rounded-xl font-black neo-button bg-primary text-white">
                                 {isSaving ? <Loader2 className="animate-spin" /> : 'Confirmar Registro'}
                              </Button>
                           </DialogFooter>
                        </DialogContent>
                     </Dialog>
                  </div>
               )}
            </header>

            <div className="space-y-4 transition-none">
               {dayEvents.map(event => {
                  const isOthersEvent = event.user_id !== targetUserId;
                  const sharedWithUsers = shares.filter(s => s.owner_id === event.user_id && (s.share_type === 'full' || s.target_date === event.event_date));

                  return (
                     <Card key={event.id} className="glass-panel border-none p-6 rounded-xl sm:rounded-[2rem] shadow-xl relative overflow-hidden transition-none group">
                        {event.has_alert && <div className="absolute top-0 right-0 p-3 text-primary animate-pulse"><Bell size={14} /></div>}

                        <div className="space-y-3 transition-none">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h4 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                              {isOthersEvent && (
                                 <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase w-fit">
                                    <ArrowUpRight size={10} /> Compartilhado por @{event.profiles?.username}
                                 </div>
                              )}
                           </div>

                           {event.description && <p className="text-sm opacity-60 font-medium leading-relaxed">{event.description}</p>}

                           <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Acesso de:</span>
                                 <div className="flex -space-x-2">
                                    <TooltipProvider>
                                       <Tooltip>
                                          <TooltipTrigger asChild>
                                             <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
                                                <AvatarImage src={event.profiles?.avatar_url || undefined} />
                                                <AvatarFallback>{event.profiles?.username?.[0]}</AvatarFallback>
                                             </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent className="glass-panel border-white/10 text-xs font-bold">Autor: @{event.profiles?.username}</TooltipContent>
                                       </Tooltip>

                                       {sharedWithUsers.map((s, idx) => (
                                          <Tooltip key={idx}>
                                             <TooltipTrigger asChild>
                                                <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
                                                   <AvatarImage src={s.shared_with?.avatar_url || undefined} />
                                                   <AvatarFallback>{s.shared_with?.username?.[0]}</AvatarFallback>
                                                </Avatar>
                                             </TooltipTrigger>
                                             <TooltipContent className="glass-panel border-white/10 text-xs font-bold">@{s.shared_with?.username}</TooltipContent>
                                          </Tooltip>
                                       ))}
                                    </TooltipProvider>
                                 </div>
                              </div>

                              {isOwnProfile && event.user_id === targetUserId && (
                                 <Button variant="ghost" size="icon" onClick={async () => {
                                    if (!confirm('Excluir evento?')) return;
                                    await supabase.from('calendar_events').delete().eq('id', event.id);
                                    toast.success('Removido.'); fetchData();
                                 }} className="h-8 w-8 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10">
                                    <Trash2 size={14} />
                                 </Button>
                              )}
                           </div>
                        </div>
                     </Card>
                  );
               })}
               {dayEvents.length === 0 && (
                  <div className="py-24 text-center glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent transition-none">
                     <Info className="h-16 w-16 mx-auto mb-4" />
                     <p className="text-xl font-black px-4">{date ? 'Agenda livre para hoje' : 'Selecione um dia no calendário'}</p>
                     <p className="text-xs font-bold uppercase tracking-widest mt-1">Nada planejado para este período.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
