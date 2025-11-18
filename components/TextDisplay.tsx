import React, { useEffect, useState, useRef } from 'react';
import { ProcessedContent, UserSettings } from '../types';
import { THEME_STYLES, LANGUAGES } from '../constants';
import { ArrowLeft, AlertTriangle, CheckCircle, Play, Square, Loader2, Globe, Sparkles, Type, ShieldCheck } from 'lucide-react';
import { generateSpeech, translateText } from '../services/geminiService';
import { submitOpusAudit } from '../services/persistenceService';

interface TextDisplayProps {
  content: ProcessedContent;
  settings: UserSettings;
  onBack: () => void;
}

type TextType = 'original' | 'simplified' | 'translated';

const TextDisplay: React.FC<TextDisplayProps> = ({ content, settings, onBack }) => {
  const theme = THEME_STYLES[settings.colorScheme];
  
  // Audio State
  const [activeAudioType, setActiveAudioType] = useState<TextType | null>(null);
  const [loadingAudioType, setLoadingAudioType] = useState<TextType | null>(null);
  
  // Audit State
  const [auditStatus, setAuditStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Translation State
  const [translatedText, setTranslatedText] = useState(content.translatedText);
  const [currentLanguage, setCurrentLanguage] = useState(settings.targetLanguage);
  const [isTranslating, setIsTranslating] = useState(false);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCache = useRef<Record<string, AudioBuffer>>({});

  const zoomScale = 1 + (settings.diopters * 0.1); 

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setActiveAudioType(null);
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setCurrentLanguage(newLang);
    setIsTranslating(true);
    stopAudio();

    try {
      const newText = await translateText(content.simplifiedText || content.originalText, newLang);
      setTranslatedText(newText);
      if (audioCache.current['translated']) {
        delete audioCache.current['translated'];
      }
    } catch (err) {
      console.error("Fast translation failed", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePlay = async (type: TextType, text: string) => {
    if (activeAudioType === type) {
      stopAudio();
      return;
    }
    stopAudio();
    if (!text) return;
    setLoadingAudioType(type);

    try {
      const cacheKey = type === 'translated' ? `translated_${currentLanguage}` : type;
      let buffer = audioCache.current[cacheKey];
      
      if (!buffer) {
        buffer = await generateSpeech(text, type === 'translated' ? currentLanguage : settings.targetLanguage);
        audioCache.current[cacheKey] = buffer;
      }

      if (!audioContextRef.current) {
         const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
         audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => { setActiveAudioType(null); };
      source.start(0);
      audioSourceRef.current = source;
      setActiveAudioType(type);

    } catch (e) {
      console.error("Playback error", e);
      alert("Could not play audio. Please check connection.");
    } finally {
      setLoadingAudioType(null);
    }
  };

  const handleAudit = async () => {
    setAuditStatus('sending');
    try {
      await submitOpusAudit({
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        imageHash: 'mock-hash',
        status: 'PENDING'
      });
      setAuditStatus('sent');
    } catch (e) {
      setAuditStatus('idle');
      alert("Failed to send to Opus.");
    }
  };

  const TextCard = ({ 
    type, 
    title, 
    icon: Icon,
    text, 
    headerColor,
    isLoadingText,
    headerAction
  }: { 
    type: TextType, 
    title: string, 
    icon: any,
    text: string, 
    headerColor: string,
    isLoadingText?: boolean,
    headerAction?: React.ReactNode
  }) => {
    const isPlaying = activeAudioType === type;
    const isLoadingAudio = loadingAudioType === type;

    return (
      <div className={`mb-8 rounded-3xl overflow-hidden transition-all duration-300 ${theme.card} hover:shadow-lg ring-1 ring-black/5`}>
        {/* Header */}
        <div className={`px-6 py-4 flex justify-between items-center ${headerColor} bg-opacity-10 backdrop-blur-sm border-b border-black/5`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-white/80 shadow-sm ${headerColor.replace('bg-', 'text-').replace('/10', '')}`}>
                 <Icon size={18} />
              </div>
              <span className="font-bold text-sm uppercase tracking-wider opacity-80">{title}</span>
            </div>
            {headerAction}
        </div>
        
        {/* Content */}
        <div className="p-6 relative min-h-[140px]">
            {isLoadingText && (
               <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
                 <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-indigo-100">
                   <Loader2 className="animate-spin text-indigo-600" size={20} />
                   <span className="text-xs font-bold text-indigo-900">Processing...</span>
                 </div>
               </div>
            )}
            
            <p 
              style={{ fontSize: `${settings.fontSize * zoomScale * 0.85}px` }} 
              className="whitespace-pre-wrap leading-relaxed font-accessible"
            >
                {text || <span className="opacity-40 italic">No content available.</span>}
            </p>
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-black/5 bg-gray-50/50 flex justify-end">
            <button 
                onClick={() => handlePlay(type, text)}
                disabled={isLoadingAudio || isLoadingText || (!text)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md active:scale-95
                  ${isPlaying 
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100' 
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-400 hover:text-indigo-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                `}
            >
                {isLoadingAudio ? (
                    <><Loader2 className="animate-spin" size={18} /> Loading Audio...</>
                ) : isPlaying ? (
                    <><Square size={18} fill="currentColor" /> Stop Reading</>
                ) : (
                    <><Play size={18} fill="currentColor" /> Read Aloud</>
                )}
            </button>
        </div>
     </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${theme.bg} ${theme.text} transition-colors duration-500 overflow-hidden`}>
      
      {/* Sticky Header */}
      <div className={`sticky top-0 z-30 px-4 py-4 flex justify-between items-center bg-white/80 backdrop-blur-lg border-b border-black/5 shadow-sm`}>
        <button 
          onClick={onBack}
          className="p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold font-sans tracking-tight text-slate-800">Reader View</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">
        
        {/* Safety Banner */}
        {content.requiresAudit && (
          <div className="animate-fade-in-up bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 shadow-sm ring-1 ring-amber-100">
            <div className="flex gap-4">
              <div className="bg-amber-100 p-3 rounded-full h-fit shrink-0">
                 <AlertTriangle className="text-amber-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg mb-1">Critical Information Detected</h3>
                <p className="text-amber-800/80 text-sm mb-4 leading-relaxed">
                  This text appears to contain medical or safety instructions. 
                  AI simplification may miss nuances.
                </p>
                
                {auditStatus === 'idle' && (
                  <button 
                    onClick={handleAudit}
                    className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 active:scale-95 flex items-center gap-2"
                  >
                    <ShieldCheck size={18} /> Request Human Review
                  </button>
                )}
                
                {auditStatus === 'sending' && (
                   <div className="flex items-center gap-2 text-amber-700 font-bold text-sm bg-amber-100/50 px-4 py-2 rounded-xl w-fit border border-amber-200">
                     <Loader2 size={18} className="animate-spin" /> Sending to Opus...
                   </div>
                )}

                {auditStatus === 'sent' && (
                  <div className="flex items-center gap-2 text-green-700 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl w-fit border border-green-200">
                    <CheckCircle size={18} /> Sent to Opus Audit Queue
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* The 3 Cards */}
        
        {/* 1. Original */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <TextCard 
            type="original" 
            title="Captured Text" 
            icon={Type}
            text={content.originalText} 
            headerColor="bg-slate-500/10"
          />
        </div>

        {/* 2. Simplified */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <TextCard 
            type="simplified" 
            title="Simplified" 
            icon={Sparkles}
            text={content.simplifiedText} 
            headerColor="bg-indigo-500/10"
          />
        </div>

        {/* 3. Translated */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <TextCard 
            type="translated" 
            title="Translated" 
            icon={Globe}
            text={translatedText} 
            headerColor="bg-emerald-500/10"
            isLoadingText={isTranslating}
            headerAction={
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-black/5">
                <select 
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-slate-700 outline-none"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            }
          />
        </div>
        
        <div className="h-20" />
      </div>
    </div>
  );
};

export default TextDisplay;