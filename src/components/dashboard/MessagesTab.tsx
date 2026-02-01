"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AdminMessage {
  id: string;
  created_at: string;
  content: string;
  is_read: boolean;
}

interface MessagesTabProps {
  adminMessages: AdminMessage[];
  deleteMessage: (id: string) => void;
}

export function MessagesTab({ adminMessages, deleteMessage }: MessagesTabProps) {
  return (
    <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden transition-none shadow-xl">
      <CardHeader className="p-8 pb-4 transition-none">
        <CardTitle className="text-2xl font-black transition-none">Alertas do Sistema</CardTitle>
        <CardDescription className="transition-none">Mensagens oficiais da moderação do AmaroTube.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 transition-none">
        {adminMessages.length > 0 ? (
          <div className="space-y-4 transition-none">
            {adminMessages.map(msg => {
              const statusClasses = msg.is_read
                ? "bg-white/5 border-white/5 opacity-60"
                : "bg-primary/5 border-primary/10 shadow-lg";

              return (
                <div key={msg.id} className={cn(
                  "p-6 rounded-xl border relative overflow-hidden group transition-all",
                  statusClasses
                )}>
                  {!msg.is_read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary transition-none" />}
                  <div className="flex items-start gap-4 transition-none">
                    <ShieldCheck size={24} className={cn("shrink-0 mt-1 transition-none", msg.is_read ? "text-muted-foreground" : "text-primary")} />
                    <div className="space-y-1 flex-1 transition-none">
                      <p className="font-bold text-lg leading-tight transition-none">{msg.content}</p>
                      <p className="text-[10px] font-black uppercase opacity-40 transition-none">{format(new Date(msg.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 rounded-full h-8 w-8 hover:bg-destructive/10 text-destructive transition-all"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 opacity-30 italic transition-none">Você não possui mensagens oficiais.</div>
        )}
      </CardContent>
    </Card>
  );
}
