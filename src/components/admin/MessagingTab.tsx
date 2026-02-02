"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserOption {
    id: string;
    username?: string | null;
}

interface MessagingTabProps {
    users: UserOption[];
    selectedUserId: string;
    msgContent: string;
    isSending: boolean;
    onUserChange: (userId: string) => void;
    onContentChange: (content: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function MessagingTab({
    users,
    selectedUserId,
    msgContent,
    isSending,
    onUserChange,
    onContentChange,
    onSubmit
}: MessagingTabProps) {
    return (
        <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-10 max-w-2xl mx-auto shadow-2xl">
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="admin-msg-target-select" className="text-xs uppercase font-black opacity-50 ml-1">Destinatário</Label>
                    <Select onValueChange={onUserChange} value={selectedUserId}>
                        <SelectTrigger id="admin-msg-target-select" className="h-14 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-primary shadow-inner font-bold">
                            <SelectValue placeholder="Escolha um usuário..." />
                        </SelectTrigger>
                        <SelectContent className="glass-panel border-white/10 rounded-xl">
                            {users.map(u => <SelectItem key={u.id} value={u.id} className="font-bold">@{u.username || u.id}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-msg-content-textarea" className="text-xs uppercase font-black opacity-50 ml-1">Mensagem Oficial</Label>
                    <Textarea
                        id="admin-msg-content-textarea"
                        name="admin-official-message"
                        className="min-h-[150px] rounded-xl p-6 bg-black/5 dark:bg-white/5 border-none shadow-inner leading-relaxed"
                        placeholder="Escreva a mensagem oficial..."
                        value={msgContent}
                        onChange={e => onContentChange(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={isSending || !selectedUserId || !msgContent.trim()} className="w-full h-16 rounded-3xl font-black text-xl bg-primary text-white shadow-lg">
                    {isSending ? <Loader2 className="animate-spin" /> : 'Enviar Mensagem'}
                </Button>
            </form>
        </Card>
    );
}
