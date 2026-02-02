"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, History, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EconomyLog {
    id: string;
    source: string;
    amount: number;
    description?: string;
    created_at: string;
}

interface EconomyTabProps {
    logs: EconomyLog[];
    onResetLogs: () => void;
}

export function EconomyTab({ logs, onResetLogs }: EconomyTabProps) {
    const totalTaxed = logs.reduce((acc, log) => acc + log.amount, 0);

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] p-8 shadow-xl bg-primary/5">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><TrendingDown size={32} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Retirado de Circulação</p>
                        <h3 className="text-5xl font-black tracking-tighter text-primary flex items-center gap-3">
                            {totalTaxed.toLocaleString()} <span className="text-xl opacity-40">PTS</span>
                        </h3>
                    </div>
                </div>
            </Card>

            {/* Logs Table */}
            <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-xl">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <History className="text-primary h-6 w-6" />
                            <CardTitle className="text-2xl font-black">Logs da Tesouraria</CardTitle>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onResetLogs}
                            className="rounded-xl font-bold gap-2 shadow-lg hover:shadow-red-500/20 transition-all active:scale-95"
                        >
                            <Trash2 size={16} /> Resetar Logs
                        </Button>
                    </div>
                    <CardDescription>Rastreamento de taxas e queimas de pontos automáticas.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <div className="rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-50">
                                    <th className="p-4">Data/Hora</th>
                                    <th className="p-4">Fonte</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Descrição</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold opacity-60">{format(new Date(log.created_at), 'dd/MM HH:mm')}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                                log.source === 'admin_adjustment' ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                                            )}>{log.source}</span>
                                        </td>
                                        <td className="p-4 font-black text-primary">
                                            {log.source === 'admin_adjustment' ? '' : '-'}{log.amount} PTS
                                        </td>
                                        <td className="p-4 opacity-70 italic text-xs">{log.description}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan={4} className="p-10 text-center opacity-30 italic">Nenhum log registrado ainda.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
