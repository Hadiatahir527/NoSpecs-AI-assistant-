import React, { useState } from 'react';
import { ColorScheme, UserSettings, User } from '../types';
import { LANGUAGES, THEME_STYLES } from '../constants';
import { X, Check, Eye, Type, Palette, LayoutTemplate, Loader2, Database } from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdate: (newSettings: UserSettings) => Promise<void> | void;
  onClose: () => void;
  currentUser: User | null;
}

const VISION_PRESETS = [
  { 
    id: 'myopia', 
    label: 'Nearsighted', 
    desc: 'Standard zoom', 
    vals: { fontSize: 24, diopters: 0, colorScheme: ColorScheme.DEFAULT } 
  },
  { 
    id: 'hyperopia', 
    label: 'Farsighted', 
    desc: '+ Magnification', 
    vals: { fontSize: 32, diopters: 1.5, colorScheme: ColorScheme.DEFAULT } 
  },
  { 
    id: 'low_vision', 
    label: 'Low Vision', 
    desc: 'High Contrast', 
    vals: { fontSize: 40, diopters: 2.5, colorScheme: ColorScheme.HIGH_CONTRAST } 
  },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, onClose, currentUser }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  
  const theme = THEME_STYLES[localSettings.colorScheme];
  const zoomScale = 1 + (localSettings.diopters * 0.1);
  const previewFontSize = localSettings.fontSize * zoomScale;

  const updateLocal = (key: keyof UserSettings, value: any) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const applyPreset = (presetSettings: Partial<UserSettings>) => {
    setLocalSettings({ ...localSettings, ...presetSettings });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(localSettings);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end isolate">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right z-10">
        
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appearance</h2>
            <div className="flex items-center gap-2">
               <p className="text-sm text-slate-500 font-medium">Customize your reading view</p>
               {currentUser && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100 flex items-center gap-1">
                    <Database size={10} /> Qdrant Synced
                  </span>
               )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-slate-50/50">
          
          {/* LIVE PREVIEW */}
          <section>
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview</h3>
             </div>
             <div 
                className={`w-full min-h-[160px] rounded-3xl border transition-all duration-300 shadow-sm flex items-center justify-center text-center p-6 relative overflow-hidden ${theme.bg} ${theme.text} ${theme.border}`}
             >
                <div className="absolute top-3 left-3 flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-current opacity-20"></div>
                   <div className="w-2 h-2 rounded-full bg-current opacity-20"></div>
                </div>
                <p style={{ fontSize: `${previewFontSize}px`, lineHeight: '1.4' }} className="font-accessible transition-all duration-300">
                  The quick brown fox jumps over the lazy dog.
                </p>
             </div>
          </section>

          {/* QUICK PRESETS */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <LayoutTemplate size={20} className="text-indigo-600" />
              Quick Presets
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {VISION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.vals)}
                  className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all group active:scale-95"
                >
                  <span className="font-bold text-slate-700 text-sm mb-1 group-hover:text-indigo-600">{preset.label}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* TYPOGRAPHY */}
          <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Type size={20} className="text-indigo-600" /> Typography
            </h3>
            
            {/* Size */}
            <div className="mb-8">
               <div className="flex justify-between mb-3">
                 <label className="text-sm font-semibold text-slate-600">Font Size</label>
                 <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{localSettings.fontSize}px</span>
               </div>
               <input 
                 type="range" min="12" max="60" step="2"
                 value={localSettings.fontSize}
                 onChange={(e) => updateLocal('fontSize', parseInt(e.target.value))}
                 className="w-full"
               />
            </div>

            {/* Zoom */}
            <div>
               <div className="flex justify-between mb-3">
                 <label className="text-sm font-semibold text-slate-600">Vision Correction</label>
                 <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                    {localSettings.diopters > 0 ? '+' : ''}{localSettings.diopters.toFixed(1)} D
                 </span>
               </div>
               <input 
                 type="range" min="-5" max="5" step="0.5"
                 value={localSettings.diopters}
                 onChange={(e) => updateLocal('diopters', parseFloat(e.target.value))}
                 className="w-full"
               />
            </div>
          </section>

          {/* THEME */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Palette size={20} className="text-indigo-600" /> Color Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(ColorScheme).map((scheme) => {
                const style = THEME_STYLES[scheme];
                const isSelected = localSettings.colorScheme === scheme;
                return (
                  <button
                    key={scheme}
                    onClick={() => updateLocal('colorScheme', scheme)}
                    className={`
                      p-4 rounded-2xl border flex items-center gap-4 transition-all duration-200
                      ${style.bg} ${style.text} 
                      ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 shadow-lg' : 'border-slate-200 hover:border-slate-300'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg ${style.border}`}>
                      Aa
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm">{scheme.replace(/_/g, ' ')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* LANGUAGE */}
          <section className="pb-10">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Translation Target</h3>
            <div className="relative">
              <select
                value={localSettings.targetLanguage}
                onChange={(e) => updateLocal('targetLanguage', e.target.value)}
                className="w-full p-4 pl-5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold appearance-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Eye size={18} />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 z-20">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
          >
            {isSaving ? (
               <><Loader2 className="animate-spin" /> Syncing Qdrant...</>
            ) : (
               <><Check size={22} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;