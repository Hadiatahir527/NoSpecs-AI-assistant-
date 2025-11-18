import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Upload, RefreshCw, X, Image as ImageIcon, AlertCircle, Lock, Zap, ChevronRight } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null); 
  
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Cleanup function: Stops tracks and clears refs
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API is not supported. Please ensure you are using HTTPS.");
      return;
    }

    try {
      stopCamera();
      setIsPermissionDenied(false);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setError(null);
      } catch (highResError) {
        console.warn("High-resolution constraints failed, trying fallback...", highResError);
        
        const fallbackConstraints = {
          video: true,
          audio: false
        };
        
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setError(null);
      }

    } catch (err: any) {
      console.error("Camera Start Error:", err);
      stopCamera();
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission was denied.");
        setIsPermissionDenied(true);
      } else if (err.name === 'NotFoundError') {
        setError("No camera device found.");
      } else if (err.name === 'NotReadableError') {
        setError("Camera is in use by another app.");
      } else {
        setError("Failed to start camera. " + (err.message || "Unknown error."));
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    let isMounted = true;
    if (isCameraOpen && !error) {
      startCamera().catch(e => {
         if(isMounted) console.error("Async camera error", e);
      });
    } else if (!isCameraOpen) {
      stopCamera();
    }
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isCameraOpen, error, startCamera, stopCamera]);

  const captureImage = () => {
    if (!videoRef.current || !streamRef.current) return;
    if (videoRef.current.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(imageSrc);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleRetry = () => {
    setError(null);
  };

  // --- RENDER: LANDING DASHBOARD ---
  if (!isCameraOpen) {
    return (
      <div className="flex flex-col h-full w-full bg-brand-dark items-center justify-center p-6 relative overflow-hidden">
        {/* Organic Background Shapes */}
        <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] bg-indigo-600/20 blur-[100px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-fuchsia-600/20 blur-[100px] rounded-full animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-2">
               <Zap size={14} className="text-yellow-400 fill-yellow-400" />
               <span className="text-xs font-bold text-white/80 tracking-wide uppercase">AI-Powered Vision</span>
            </div>
            <h2 className="text-5xl font-bold text-white tracking-tight leading-tight">
              What would you <br/> like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">read?</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
              Capture text instantly or upload a document to get started.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Live Camera Card */}
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="relative group overflow-hidden aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-1 transition-all duration-300 hover:scale-[1.02] shadow-2xl shadow-indigo-900/50 border border-white/10"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="relative h-full bg-white/5 backdrop-blur-sm rounded-[1.8rem] p-6 flex flex-col justify-between items-center group-hover:bg-white/10 transition-colors">
                <div className="p-4 bg-white/20 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                   <Camera size={40} className="text-white" />
                </div>
                <div className="text-center">
                   <span className="block text-white font-bold text-xl mb-1">Camera</span>
                   <span className="text-indigo-200 text-xs font-medium">Live Capture</span>
                </div>
              </div>
            </button>

            {/* Upload Card */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative group overflow-hidden aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-1 transition-all duration-300 hover:scale-[1.02] shadow-2xl border border-white/10"
            >
              <div className="relative h-full bg-white/5 backdrop-blur-sm rounded-[1.8rem] p-6 flex flex-col justify-between items-center group-hover:bg-white/10 transition-colors">
                <div className="p-4 bg-slate-700/50 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300 border border-white/5">
                   <ImageIcon size={40} className="text-purple-300" />
                </div>
                <div className="text-center">
                   <span className="block text-white font-bold text-xl mb-1">Upload</span>
                   <span className="text-slate-400 text-xs font-medium">From Gallery</span>
                </div>
              </div>
            </button>
          </div>

          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
          
          <div className="glass-dark p-5 rounded-2xl flex items-start gap-4">
             <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
               <AlertCircle size={20} className="text-indigo-300" />
             </div>
             <div className="text-left">
                <p className="text-slate-300 text-sm leading-relaxed">
                   <strong className="text-white">Pro Tip:</strong> You can adjust text size and contrast colors after capturing.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: CAMERA VIEW ---
  return (
    <div className="flex flex-col h-full w-full bg-black relative overflow-hidden animate-scale-in">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center bg-brand-dark z-50">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
             {isPermissionDenied ? <Lock size={40} className="text-red-500" /> : <AlertCircle size={40} className="text-red-500" />}
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Camera Access Needed</h3>
          <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">{error}</p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
             {isPermissionDenied && (
               <p className="text-xs text-slate-500 bg-slate-900 p-4 rounded-xl border border-slate-800 mb-2 text-left">
                 1. Tap the lock icon in your address bar.<br/>
                 2. Select "Site Settings".<br/>
                 3. Allow Camera access.
               </p>
             )}
            
            <button 
                onClick={handleRetry}
                className="py-4 px-6 bg-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-500 active:scale-95 transition-all w-full shadow-lg shadow-indigo-900/50"
            >
                {isPermissionDenied ? "I've Enabled Access" : "Enable Camera"}
            </button>
            <button 
                onClick={() => { setIsCameraOpen(false); setError(null); }}
                className="py-4 px-6 bg-slate-800 rounded-xl font-bold text-lg hover:bg-slate-700 active:scale-95 transition-all w-full"
            >
                Go Back
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* UI Overlay */}
          <div className="absolute inset-0 pointer-events-none">
             {/* Top Bar */}
             <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent h-40 pointer-events-auto">
                <button 
                  onClick={() => setIsCameraOpen(false)}
                  className="p-3.5 rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-white/20 transition-all border border-white/10 active:scale-95 group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>

                <button 
                  onClick={switchCamera}
                  className="p-3.5 rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-white/20 transition-all border border-white/10 active:scale-95"
                >
                  <RefreshCw size={24} />
                </button>
             </div>

             {/* Viewfinder Guide */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] aspect-[3/4] border-2 border-white/20 rounded-3xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl -mb-1 -mr-1"></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                   <p className="text-white/90 text-sm font-semibold">Align text here</p>
                </div>
             </div>

             {/* Bottom Controls */}
             <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end pb-12 items-center pointer-events-auto">
                <button 
                  onClick={captureImage}
                  className="group relative"
                  aria-label="Take Picture"
                >
                  <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform group-active:scale-90">
                     <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform duration-300"></div>
                  </div>
                </button>
                <p className="text-white/50 text-sm mt-4 font-medium">Tap to capture</p>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;