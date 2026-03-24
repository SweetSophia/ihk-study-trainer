'use client';

import { motion } from 'framer-motion';
import { 
  Calculator, 
  Image as ImageIcon, 
  Network, 
  ArrowLeftRight,
  Binary,
  Hexagon,
  Shield,
  Layers,
  Cable,
  Server,
  Globe,
  Settings
} from 'lucide-react';

interface ThemeSelectorProps {
  currentModule: string | null;
  onSelectModule: (module: string) => void;
}

const MODULES = [
  { id: 'bandwidth', name: 'Übertragungszeit', icon: ArrowLeftRight, description: 'Dateitransfer berechnen' },
  { id: 'imageCalc', name: 'Bildgröße', icon: ImageIcon, description: 'Speicherberechnung' },
  { id: 'overhead', name: 'Overhead', icon: Calculator, description: 'Protokoll-Overhead' },
  { id: 'subnetting', name: 'Subnetting', icon: Network, description: 'IP-Subnetze berechnen' },
  { id: 'unitConversion', name: 'Einheiten', icon: Settings, description: 'Byte-Einheiten umrechnen' },
  { id: 'binary', name: 'Binär', icon: Binary, description: 'Binär/Dezimal' },
  { id: 'hex', name: 'Hexadezimal', icon: Hexagon, description: 'Hex/Dezimal' },
  { id: 'subnetMask', name: 'Subnetzmaske', icon: Shield, description: 'CIDR zu Maske' },
  { id: 'aggregation', name: 'Aggregation', icon: Layers, description: 'Route Summarization' },
  { id: 'ports', name: 'Ports', icon: Server, description: 'Port-Protokolle' },
  { id: 'osi', name: 'OSI-Modell', icon: Globe, description: 'OSI-Schichten' },
  { id: 'cables', name: 'Kabel', icon: Cable, description: 'Kabelauswahl' },
];

export default function ThemeSelector({ currentModule, onSelectModule }: ThemeSelectorProps) {
  return (
    <div className="w-full">
      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{module.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-3">
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
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-semibold ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {module.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
