import React, { useState, useEffect } from 'react';
import { AppState, ProcessedContent, UserSettings, User } from './types';
import { DEFAULT_SETTINGS } from './constants';
import CameraCapture from './components/CameraCapture';
import TextDisplay from './components/TextDisplay';
import SettingsPanel from './components/SettingsPanel';
import { processImage } from './services/geminiService';
import { getSettings, getStoredUser, opusLogin, saveSettings, syncQdrantPreferences } from './services/persistenceService';
import { Settings, Loader2, Glasses, ShieldCheck, ArrowRight, Fingerprint, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [content, setContent] = useState<ProcessedContent | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = getStoredUser();
    const savedSettings = getSettings();
    setUserSettings(savedSettings);

    if (storedUser) {
      setCurrentUser(storedUser);
      setAppState(AppState.HOME);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      const user = await opusLogin(email, password);
      setCurrentUser(user);
      setAppState(AppState.HOME);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCapture = async (imageSrc: string) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    try {
      const result = await processImage(imageSrc, settings);
      setContent(result);
      setAppState(AppState.READING);
    } catch (err: any) {
      setError(err.message || "Failed to process image");
      setAppState(AppState.HOME); 
    }
  };

  const handleSettingsUpdate = async (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    if (currentUser) {
      // Sync to Qdrant
      await syncQdrantPreferences(currentUser.id, newSettings);
    } else {
      saveSettings(newSettings);
    }
  };

  // --- RENDER: AUTH SCREEN (OPUS ID) ---
  if (appState === AppState.AUTH) {
    return (
      <div className="h-screen w-screen overflow-hidden relative bg-brand-dark flex flex-col items-center justify-center text-white p-6">
        {/* Background Ambient Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-600/30 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-fuchsia-600/20 blur-[120px] rounded-full animate-pulse-slow delay-1000" />
        
        <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
          
          <div className="flex flex-col items-center mb-10">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/10 mb-6 ring-1 ring-white/20">
               <Glasses size={48} className="text-indigo-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 via-white to-indigo-100 text-center">
              NoSpecs
            </h1>
            <p className="text-indigo-200/80 mt-2 font-medium">Sign in with Opus ID</p>
          </div>

          <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
             <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Email or Opus ID</label>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                    <Fingerprint size={16} />
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <><Loader2 className="animate-spin" size={20} /> Authenticating...</>
                  ) : (
                    <>Sign In <ArrowRight size={20} /></>
                  )}
                </button>
             </div>
          </form>

          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-white/60">Secured by Opus API</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel 
          settings={settings} 
          onUpdate={handleSettingsUpdate} 
          onClose={() => setShowSettings(false)}
          currentUser={currentUser} 
        />
      )}

      {/* Main View Switcher */}
      {appState === AppState.HOME && (
        <>
          <CameraCapture onCapture={handleCapture} />
          
          {/* Floating Settings Button */}
          <div className="absolute top-6 right-6 z-20">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all shadow-2xl border border-white/20 group"
            >
              <Settings size={26} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
          
          {/* Error Toast */}
          {error && (
            <div className="absolute top-24 left-6 right-6 glass-card bg-white/90 text-red-600 p-4 rounded-2xl shadow-2xl border-l-4 border-red-500 flex items-center justify-between animate-fade-in-up z-50">
              <span className="font-medium ml-2">{error}</span>
              <button onClick={() => setError(null)} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                <span className="font-bold text-sm uppercase">Dismiss</span>
              </button>
            </div>
          )}
        </>
      )}

      {appState === AppState.PROCESSING && (
        <div className="h-full flex flex-col items-center justify-center bg-brand-dark relative overflow-hidden text-white p-8 text-center">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full animate-pulse-slow"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
               <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 animate-pulse"></div>
               <Loader2 size={80} className="animate-spin text-white relative z-10" />
            </div>
            
            <h2 className="text-3xl font-bold mt-10 mb-3">Enhancing Vision</h2>
            <div className="space-y-1">
               <p className="text-indigo-200 text-lg">Analyzing text structure...</p>
               <p className="text-indigo-300/70 text-sm">Translating to {settings.targetLanguage}</p>
            </div>
          </div>
        </div>
      )}

      {appState === AppState.READING && content && (
        <TextDisplay 
          content={content} 
          settings={settings} 
          onBack={() => setAppState(AppState.HOME)} 
        />
      )}

    </div>
  );
};

export default App;