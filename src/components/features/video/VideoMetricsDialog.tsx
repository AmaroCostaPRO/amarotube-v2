import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { Eye, ThumbsUp, Activity, Loader2, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; name: string; value: number }>;
  label?: string;
}

interface VideoMetricsDialogProps {
  video: Video;
  onMetricsUpdate: (latestMetrics: LatestMetrics | null) => void;
  children: React.ReactNode;
}

interface ChartDataPoint {
  time: string;
  views: number;
  likes: number;
}

interface LatestMetrics {
  views: number;
  likes: number;
  engagement: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-white/40">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-sm font-bold flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            {`${p.name}: ${formatNumber(p.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, isLoading, icon: Icon, gradient }: { title: string, value: string | number, isLoading: boolean, icon: LucideIcon, gradient: string }) => (
  <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-black/5 dark:border-white/5 relative overflow-hidden group min-h-[120px] flex flex-col justify-center">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
       <Icon size={40} className="text-zinc-900 dark:text-white" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-white/40 mb-2">{title}</p>
    {isLoading ? (
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.3s' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.15s' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
    ) : (
      <h3 className={cn("text-4xl font-bold tracking-tighter bg-gradient-to-r bg-clip-text text-transparent", gradient)}>
        {value}
      </h3>
    )}
  </div>
);

export function VideoMetricsDialog({ video, onMetricsUpdate, children }: VideoMetricsDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'matrix' || theme === 'retro-vaporwave';
  
  const [isOpen, setIsOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<LatestMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    views: isDark ? "#22d3ee" : "#0891b2",
    likes: isDark ? "#a855f7" : "#7c3aed"
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-live-metrics', {
        body: { video_id: video.id, youtube_video_id: video.youtube_video_id },
      });

      if (error) throw error;

      const newPoint: ChartDataPoint = {
        time: format(new Date(), 'HH:mm:ss'),
        views: data.view_count,
        likes: data.like_count,
      };

      const engagement = data.view_count > 0 
        ? ((data.like_count + (data.comment_count || 0)) / data.view_count) * 100 
        : 0;

      setLatestMetrics({ views: data.view_count, likes: data.like_count, engagement });
      setChartData(prev => [...prev.slice(-14), newPoint]);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [video.id, video.youtube_video_id]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isOpen) {
      setIsLoading(true);
      fetchMetrics();
      intervalId = setInterval(fetchMetrics, 15000);
    }
    return () => {
      clearInterval(intervalId);
      if (!isOpen) {
        setChartData([]);
        setLatestMetrics(null);
      }
    };
  }, [isOpen, fetchMetrics]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) onMetricsUpdate(latestMetrics);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl bg-white/60 dark:bg-black/40 backdrop-blur-xl border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden sm:h-auto h-[90vh] flex flex-col">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col h-full overflow-hidden"
        >
          <DialogHeader className="p-8 border-b border-black/5 dark:border-white/5 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <BarChart3 size={20} />
               </div>
               <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-black tracking-tight text-zinc-900 dark:text-white line-clamp-1">{video.title}</DialogTitle>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-600/10 dark:bg-green-500/10 border border-green-600/20 dark:border-green-500/20 shrink-0">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-500 animate-pulse" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-green-700 dark:text-green-500">Live HUD</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-white/30 mt-0.5">Terminal de Análise em Tempo Real</p>
               </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto relative">
            <div className="p-8 space-y-10 min-h-full pb-16">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard 
                  title="Total de Views" 
                  value={formatNumber(latestMetrics?.views)} 
                  isLoading={isLoading && !latestMetrics}
                  icon={Eye} 
                  gradient="from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400" 
                />
                <KPICard 
                  title="Total de Likes" 
                  value={formatNumber(latestMetrics?.likes)} 
                  isLoading={isLoading && !latestMetrics}
                  icon={ThumbsUp} 
                  gradient="from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400" 
                />
                <KPICard 
                  title="Taxa de Engajamento" 
                  value={latestMetrics ? `${latestMetrics.engagement.toFixed(2)}%` : '0%'} 
                  isLoading={isLoading && !latestMetrics}
                  icon={Activity} 
                  gradient="from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400" 
                />
              </div>

              {/* Gráficos de Área */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40">Variação de Visualizações</h4>
                     <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Stream Ativo</span>
                  </div>
                  <div className="h-64 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 p-4 overflow-hidden relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors.views} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={colors.views} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke={colors.views} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorViews)" 
                            animationDuration={1500}
                            name="Views"
                          />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40">Fluxo de Curtidas</h4>
                     <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Sincronizado</span>
                </div>
                  <div className="h-64 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 p-4 overflow-hidden relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors.likes} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={colors.likes} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="likes" 
                            stroke={colors.likes} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorLikes)" 
                            animationDuration={1500}
                            name="Likes"
                          />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isLoading && chartData.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-md flex flex-col items-center justify-center z-50"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-white/60">Interceptando Dados...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}