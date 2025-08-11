import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";

export type ColorPalette = {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  context: 'default' | 'focus' | 'accessibility' | 'night' | 'professional';
};

const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'default',
    name: 'Default Blue',
    description: 'Standard professional blue theme',
    context: 'default',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b',
    },
  },
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'Reduced distractions with calm colors',
    context: 'focus',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      accent: '#10b981',
      background: '#f9fafb',
      surface: '#f3f4f6',
      text: '#111827',
      textSecondary: '#6b7280',
    },
  },
  {
    id: 'accessibility',
    name: 'High Contrast',
    description: 'Enhanced contrast for better visibility',
    context: 'accessibility',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#dc2626',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#000000',
      textSecondary: '#374151',
    },
  },
  {
    id: 'night',
    name: 'Night Mode',
    description: 'Easy on the eyes for low light',
    context: 'night',
    colors: {
      primary: '#8b5cf6',
      secondary: '#64748b',
      accent: '#a855f7',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate-friendly color scheme',
    context: 'professional',
    colors: {
      primary: '#1e40af',
      secondary: '#475569',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#475569',
    },
  },
];

export function ColorPaletteSwitcher() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(COLOR_PALETTES[0]);
  const [isAutoMode, setIsAutoMode] = useState(false);

  // Load saved palette from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('colorPalette');
    const autoMode = localStorage.getItem('autoColorMode') === 'true';
    
    if (saved) {
      const palette = COLOR_PALETTES.find(p => p.id === saved);
      if (palette) {
        setCurrentPalette(palette);
      }
    }
    
    setIsAutoMode(autoMode);
  }, []);

  // Apply color palette to document
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentPalette;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    
    // Update document background
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
    
    // Store in localStorage
    localStorage.setItem('colorPalette', currentPalette.id);
  }, [currentPalette]);

  // Context-aware auto-switching logic
  useEffect(() => {
    if (!isAutoMode) return;

    const updatePalette = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 22 || hour <= 6;
      const isFocusTime = hour >= 9 && hour <= 17; // Work hours
      
      let contextPalette: ColorPalette;
      
      if (isNight) {
        contextPalette = COLOR_PALETTES.find(p => p.context === 'night') || COLOR_PALETTES[0];
      } else if (isFocusTime) {
        contextPalette = COLOR_PALETTES.find(p => p.context === 'focus') || COLOR_PALETTES[0];
      } else {
        contextPalette = COLOR_PALETTES.find(p => p.context === 'default') || COLOR_PALETTES[0];
      }
      
      setCurrentPalette(contextPalette);
    };

    updatePalette();
    const interval = setInterval(updatePalette, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isAutoMode]);

  const handlePaletteChange = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    setIsAutoMode(false);
    localStorage.setItem('autoColorMode', 'false');
  };

  const toggleAutoMode = () => {
    const newAutoMode = !isAutoMode;
    setIsAutoMode(newAutoMode);
    localStorage.setItem('autoColorMode', newAutoMode.toString());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0"
          title="Switch Color Palette"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium">Color Palette</div>
        <DropdownMenuSeparator />
        
        {COLOR_PALETTES.map((palette) => (
          <DropdownMenuItem
            key={palette.id}
            onClick={() => handlePaletteChange(palette)}
            className="flex items-start gap-3 p-3"
          >
            <div className="flex items-center gap-2 flex-1">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: palette.colors.primary }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{palette.name}</span>
                  {currentPalette.id === palette.id && (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {palette.description}
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={toggleAutoMode}
          className="flex items-center gap-2 p-3"
        >
          <div 
            className={`w-4 h-4 rounded border ${
              isAutoMode 
                ? 'bg-blue-600 border-blue-600' 
                : 'border-gray-300'
            } flex items-center justify-center`}
          >
            {isAutoMode && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          <div>
            <span className="font-medium">Auto Mode</span>
            <p className="text-xs text-gray-500">
              Automatically switch based on time and context
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}