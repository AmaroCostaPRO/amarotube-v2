"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReportDialogProps {
  targetId: string;
  targetType: 'video' | 'user' | 'comment' | 'playlist' | 'community' | 'post';
  children: React.ReactNode;
}

export function ReportDialog({ targetId, targetType, children }: ReportDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return toast.error('Faça login para denunciar.');
    if (!reason) return toast.error('Selecione um motivo.');

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_id: targetId,
        target_type: targetType,
        reason: reason,
        description: description,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Denúncia enviada. Nossa equipe analisará em breve.');
      setIsOpen(false);
      setReason('');
      setDescription('');
    } catch {
      toast.error('Erro ao enviar denúncia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md glass-panel border-white/20 rounded-[2rem] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <AlertTriangle className="text-orange-500" /> Denunciar Conteúdo
          </DialogTitle>
          <DialogDescription className="font-medium opacity-70">
            Ajude-nos a manter o AmaroTube seguro e acolhedor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason" className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Motivo Principal</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger id="report-reason" className="h-12 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner font-bold">
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent className="glass-panel rounded-2xl border-white/20">
                <SelectItem value="spam">Spam ou Fraude</SelectItem>
                <SelectItem value="hate_speech">Discurso de Ódio</SelectItem>
                <SelectItem value="harassment">Assédio ou Bullying</SelectItem>
                <SelectItem value="violence">Conteúdo Violento</SelectItem>
                <SelectItem value="sexual">Conteúdo Sexual</SelectItem>
                <SelectItem value="copyright">Violação de Direitos Autorais</SelectItem>
                <SelectItem value="other">Outro Motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description" className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Detalhes Adicionais</Label>
            <Textarea 
              id="report-description"
              name="report-details"
              placeholder="Descreva o que há de errado..."
              className="rounded-2xl bg-black/5 dark:bg-white/5 border-none shadow-inner min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold h-12 flex-1">Cancelar</Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="rounded-xl font-black h-12 flex-1 shadow-lg shadow-destructive/20"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar Denúncia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}