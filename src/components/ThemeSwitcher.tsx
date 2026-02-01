import { Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme, AppTheme } from '@/context/ThemeContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const themes = [
  // { value: 'system', label: 'Sistema (Padrão do SO)' }, // Removido
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'retro-vaporwave', label: 'Vaporwave' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9" />;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="transition-transform duration-200 hover:scale-105">
          <Palette className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-4 bg-background shadow-xl p-4 rounded-xl">
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Personalizar</h4>
          <p className="text-sm text-muted-foreground">
            Escolha seu tema e estilo visual.
          </p>
        </div>
        
        <RadioGroup value={theme} onValueChange={(value) => setTheme(value as AppTheme)} className="space-y-2">
          <Label>Tema</Label>
          {themes.map((item) => (
            <div key={item.value} className="flex items-center space-x-2">
              <RadioGroupItem value={item.value} id={`theme-${item.value}`} />
              <Label htmlFor={`theme-${item.value}`}>{item.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}
