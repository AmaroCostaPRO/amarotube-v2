"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Report {
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    description?: string;
    created_at: string;
    profiles?: { username?: string };
}

interface ReportsTabProps {
    reports: Report[];
    onDeleteTarget: (type: string, id: string) => void;
    onArchive: (reportId: string) => void;
}

const itemClasses = "p-5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5";

export function ReportsTab({ reports, onDeleteTarget, onArchive }: ReportsTabProps) {
    return (
        <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-xl">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black">Central de Denúncias</CardTitle>
                <CardDescription>Reportes realizados pela comunidade.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                {reports.length > 0 ? (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report.id} className={cn(itemClasses, "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4")}>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">{report.target_type}</span>
                                        <span className="text-xs font-bold opacity-40">{formatDistanceToNow(new Date(report.created_at), { locale: ptBR, addSuffix: true })}</span>
                                    </div>
                                    <p className="font-black text-lg leading-tight">{report.reason}</p>
                                    <p className="text-sm opacity-70">{report.description}</p>
                                    <p className="text-[10px] opacity-40 font-bold uppercase pt-2">Denunciante: @{report.profiles?.username || 'Anônimo'}</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="sm" onClick={() => onDeleteTarget(report.target_type, report.target_id)} className="rounded-xl font-bold text-destructive hover:bg-destructive/10 flex-1 sm:flex-none">
                                        Remover Alvo
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onArchive(report.id)} className="rounded-xl font-bold opacity-50 flex-1 sm:flex-none">Arquivar</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-30 italic">Tudo limpo! Sem denúncias pendentes.</div>
                )}
            </CardContent>
        </Card>
    );
}
