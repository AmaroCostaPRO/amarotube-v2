"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Ghost, UserCheck, Trash2, Loader2, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
    id: string;
    username?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    is_approved?: boolean | null;
    is_shadowbanned?: boolean | null;
    points?: number;
}

interface UsersTabProps {
    users: UserProfile[];
    loading: boolean;
    searchTerm: string;
    isProcessing: string | null;
    onSearchChange: (value: string) => void;
    onToggleShadowban: (user: { id: string; is_shadowbanned?: boolean | null }) => void;
    onDeleteUser: (userId: string) => void;
}

const itemClasses = "p-5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5";

export function UsersTab({
    users,
    loading,
    searchTerm,
    isProcessing,
    onSearchChange,
    onToggleShadowban,
    onDeleteUser
}: UsersTabProps) {
    const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-xl">
            <CardHeader className="p-8 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl font-black">Base de Usuários</CardTitle>
                        <CardDescription>Gerencie acessos e aplique sanções.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Input
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="h-11 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 h-4 w-4" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(u => (
                            <div key={u.id} className={itemClasses}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Link href={`/profile/${u.username}`}>
                                        <Avatar className="h-10 w-10 border border-black/10 dark:border-white/10 shadow-sm hover:scale-110 transition-transform">
                                            <AvatarImage src={u.avatar_url || undefined} />
                                            <AvatarFallback className="font-black">{u.username?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/profile/${u.username}`} className="font-black truncate block hover:text-primary transition-colors">@{u.username || 'Sem nome'}</Link>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[9px] opacity-40 uppercase font-black">{u.role === 'admin' ? 'Administrador' : 'Membro'}</p>
                                            {!u.is_approved && <span className="text-[8px] bg-red-500/10 text-red-500 px-1 rounded font-black">PENDENTE</span>}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-primary font-black text-xs">
                                            <Coins size={12} /> {u.points || 0} PTS
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onToggleShadowban(u)}
                                        className={cn(
                                            "rounded-xl font-bold h-10 flex-1 gap-2",
                                            u.is_shadowbanned
                                                ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30"
                                                : "bg-black/10 dark:bg-white/10 opacity-100 hover:bg-black/20 dark:hover:bg-white/20"
                                        )}
                                    >
                                        {u.is_shadowbanned ? <Ghost className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                        {u.is_shadowbanned ? 'Em Shadowban' : 'Shadowban'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        disabled={isProcessing === u.id}
                                        onClick={() => onDeleteUser(u.id)}
                                        className="rounded-xl h-10 w-10 shrink-0"
                                    >
                                        {isProcessing === u.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
