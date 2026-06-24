'use client';

import { motion } from 'framer-motion';
import { BASE_MODULES, SQL_MODULE, type ModuleDescriptor } from '../lib/modules';

interface ThemeSelectorProps {
  currentModule: string | null;
  onSelectModule: (module: string) => void;
  isAuthenticated: boolean;
}

export default function ThemeSelector({ currentModule, onSelectModule, isAuthenticated }: ThemeSelectorProps) {
  const modules: readonly ModuleDescriptor[] = isAuthenticated
    ? [...BASE_MODULES, SQL_MODULE]
    : BASE_MODULES;

  return (
    <>
      {/* Mobile: wrapped grid of topic cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 lg:hidden">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = currentModule === module.id;
          return (
            <button
              key={module.id}
              onClick={() => onSelectModule(module.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{module.shortName ?? module.name}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: vertical grid cards */}
      <div className="hidden lg:grid grid-cols-2 gap-3">
        {modules.map((module, index) => {
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
                {module.shortName ?? module.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
