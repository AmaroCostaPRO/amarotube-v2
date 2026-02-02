"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoContent {
    id: string;
    title: string;
    thumbnail_url?: string;
    channel_name?: string;
}

interface ContentTabProps {
    content: VideoContent[];
    onDelete: (videoId: string) => void;
}

const itemClasses = "p-5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5";

export function ContentTab({ content, onDelete }: ContentTabProps) {
    return (
        <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-xl">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black">Auditoria de Conteúdo</CardTitle>
                <CardDescription>Lista dos últimos vídeos postados na rede.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.map(v => (
                        <div key={v.id} className={cn(itemClasses, "flex items-center gap-4 py-3")}>
                            <Link href={`/watch/${v.id}`} className="shrink-0 hover:scale-105 transition-transform">
                                {v.thumbnail_url ? (
                                    <Image src={v.thumbnail_url} width={96} height={54} className="w-24 aspect-video object-cover rounded-xl shadow-md border border-black/5 dark:border-white/5" alt="" />
                                ) : (
                                    <div className="w-24 aspect-video bg-muted rounded-xl" />
                                )}
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link href={`/watch/${v.id}`} className="text-sm font-black truncate block hover:text-primary transition-colors">{v.title}</Link>
                                <p className="text-[10px] opacity-40 font-bold uppercase truncate">{v.channel_name}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => onDelete(v.id)}>
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
