"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, Trash2, Loader2 } from 'lucide-react';

interface PendingUser {
    id: string;
    username?: string | null;
    avatar_url?: string | null;
}

interface ApprovalsTabProps {
    pendingUsers: PendingUser[];
    isProcessing: string | null;
    onApprove: (userId: string) => void;
    onDelete: (userId: string) => void;
}

const itemClasses = "p-5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5";

export function ApprovalsTab({ pendingUsers, isProcessing, onApprove, onDelete }: ApprovalsTabProps) {
    return (
        <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-xl">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black">Cadastros Pendentes</CardTitle>
                <CardDescription>Novos usuários que aguardam autorização.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                {pendingUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingUsers.map(u => (
                            <div key={u.id} className={itemClasses}>
                                <div className="flex items-center gap-4 mb-6">
                                    <Link href={`/profile/${u.username}`} className="hover:scale-105 transition-transform">
                                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                                            <AvatarImage src={u.avatar_url || undefined} />
                                            <AvatarFallback className="font-black">{u.username?.[0] || '?'}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/profile/${u.username}`} className="font-black text-lg truncate block hover:text-primary transition-colors">@{u.username}</Link>
                                        <p className="text-[10px] uppercase font-bold opacity-40">Aguardando aprovação</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => onApprove(u.id)} className="flex-1 rounded-xl font-bold bg-primary text-white h-11">
                                        <UserCheck className="mr-2 h-4 w-4" /> Aprovar
                                    </Button>
                                    <Button onClick={() => onDelete(u.id)} disabled={isProcessing === u.id} variant="destructive" className="rounded-xl font-bold h-11 px-4">
                                        {isProcessing === u.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-30 italic">Nenhuma aprovação pendente.</div>
                )}
            </CardContent>
        </Card>
    );
}
