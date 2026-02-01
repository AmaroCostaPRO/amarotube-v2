import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Share2, Copy, Twitter } from 'lucide-react';

interface SharePopoverProps {
  title: string;
  url: string;
  children: React.ReactNode;
}

export function SharePopover({ title, url, children }: SharePopoverProps) {
  const fullUrl = `${window.location.origin}${url}?utm_source=amarotube&utm_medium=share`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleShareOnX = () => {
    const text = encodeURIComponent(`Confira "${title}" no AmaroTube!`);
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${text}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-panel-matte border-white/20 p-6 overflow-hidden rounded-[2rem] shadow-2xl space-y-4 z-[500]">
        <div className="space-y-1">
          <h4 className="font-black text-xl tracking-tight">Compartilhar</h4>
          <p className="text-sm opacity-60 font-medium">
            Espalhe este conteúdo com seus amigos.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input 
            value={fullUrl} 
            readOnly 
            className="h-11 flex-1 bg-black/5 dark:bg-white/5 border-none rounded-xl shadow-inner text-xs font-medium" 
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-11 w-11 rounded-xl neo-button shrink-0" 
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={handleShareOnX} 
          variant="outline" 
          className="w-full h-12 rounded-xl font-bold gap-2 bg-white/5 border-white/10 hover:bg-white/10 transition-all"
        >
          <Twitter className="h-4 w-4 text-[#1DA1F2] fill-current" />
          Compartilhar no X
        </Button>

        <div className="pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center leading-relaxed">
            Para Instagram, copie o link e cole em sua bio ou stories.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}