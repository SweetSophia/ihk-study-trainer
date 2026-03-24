'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, Image as ImageIcon, Network, ArrowLeftRight,
  Binary, Hexagon, Shield, Layers, Cable, Server, Globe, Settings
} from 'lucide-react';

const MODULES = [
  { id: 'bandwidth', name: 'Übertragungszeit', icon: ArrowLeftRight, description: 'Dateitransfer' },
  { id: 'imageCalc', name: 'Bildgröße', icon: ImageIcon, description: 'Speicher' },
  { id: 'overhead', name: 'Overhead', icon: Calculator, description: 'Protokoll' },
  { id: 'subnetting', name: 'Subnetting', icon: Network, description: 'IP-Subnetze' },
  { id: 'unitConversion', name: 'Einheiten', icon: Settings, description: 'Umrechnung' },
  { id: 'binary', name: 'Binär', icon: Binary, description: 'Binär/Dezimal' },
  { id: 'hex', name: 'Hex', icon: Hexagon, description: 'Hex/Dezimal' },
  { id: 'subnetMask', name: 'Subnetzmaske', icon: Shield, description: 'CIDR→Maske' },
  { id: 'aggregation', name: 'Aggregation', icon: Layers, description: 'Summarization' },
  { id: 'ports', name: 'Ports', icon: Server, description: 'Port/Protokoll' },
  { id: 'osi', name: 'OSI', icon: Globe, description: 'OSI-Schichten' },
  { id: 'cables', name: 'Kabel', icon: Cable, description: 'Kabelauswahl' },
];

interface ThemeSelectorProps {
  currentModule: string | null;
  onSelectModule: (module: string) => void;
}

export default function ThemeSelector({ currentModule, onSelectModule }: ThemeSelectorProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  if (isMobile === null) return null;
  
  if (isMobile) {
    return (
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{module.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Desktop: vertical grid cards
  return (
    <div className="grid grid-cols-2 gap-3">
      {MODULES.map((module, index) => {
        const Icon = module.icon;
        const isActive = currentModule === module.id;
        return (
          <motion.button
            key={module.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelectModule(module.id)}
            className={`flex flex-col items-center justify-center text-center p-4 rounded-xl border h-28 ${
              isActive
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg mb-2 ${isActive ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <p className={`font-semibold text-sm ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
              {module.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
