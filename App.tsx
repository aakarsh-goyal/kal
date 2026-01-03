import React, { useState, useEffect, useRef } from 'react';
import { generateAstrologyReport } from './services/geminiService';
import { createPDF } from './services/pdfService';
import { uploadLogo, getLogoPublicUrl, isSupabaseConfigured } from './services/supabaseService';
import { AstrologyReport } from './types';
import { Sparkles, Download, Loader2, ScrollText, Sprout, Key, CheckCircle, Upload, Settings, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AstrologyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  
  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    checkKey();
    if (isSupabaseConfigured()) {
       setLogoUrl(getLogoPublicUrl());
    }
  }, []);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        setHasKey(true);
      }
    } catch (e) {
      console.error("Error checking key", e);
      setHasKey(false);
    } finally {
      setCheckingKey(false);
    }
  };

  const handleConnect = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        setTimeout(checkKey, 1000);
      } catch (e) {
        console.error("Error selecting key", e);
        setError("Could not connect API Key. Please try again.");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isSupabaseConfigured()) {
      alert("Please configure Supabase URL and Key in 'supabaseConfig.ts' first.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadLogo(file);
      setLogoUrl(getLogoPublicUrl());
      setLogoError(false); 
      alert("Logo uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        if (!has) {
          setError("API Key session expired. Please connect again.");
          setHasKey(false);
          setLoading(false);
          return;
        }
      }

      const data = await generateAstrologyReport(inputText);
      setReport(data);
      await createPDF(data);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
        setError("API Key invalid or not found. Please reconnect your key.");
        setHasKey(false);
      } else {
        setError("Failed to generate report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (checkingKey) {
    return (
      <div className="min-h-screen bg-[#004d40] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#fb8c00] animate-spin" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-[#004d40] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm max-w-md w-full border border-white/10 shadow-2xl">
          <Sprout className="w-16 h-16 text-[#fb8c00] mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold text-white mb-4">Kalpvriksha</h1>
          <p className="text-teal-100 mb-8 leading-relaxed">
            Please connect your Google Cloud Project to generate premium astrological reports.
          </p>
          <button 
            onClick={handleConnect}
            className="w-full bg-[#fb8c00] hover:bg-[#f57c00] text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Key className="w-5 h-5" />
            Connect API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    // Updated Background: Warm Cream (#fff8e1)
    <div className="min-h-screen bg-[#fff8e1] text-slate-900 font-sans selection:bg-[#fb8c00] selection:text-white pb-20">
      
      {/* Header */}
      <header className="bg-[#004d40] text-white shadow-lg sticky top-0 z-50 border-b-4 border-[#fb8c00]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Container: Removed bg-white to fix border issue, added slight glow */}
            <div className="w-12 h-12 flex items-center justify-center relative rounded-full overflow-hidden bg-white/5 border border-white/10">
               {logoUrl && !logoError ? (
                 <img 
                   src={logoUrl} 
                   alt="Logo" 
                   className="w-full h-full object-cover"
                   onError={() => {
                     setLogoError(true);
                   }} 
                 />
               ) : (
                 <Sprout className="w-7 h-7 text-[#fb8c00]" />
               )}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-wide text-white">Kalpvriksha</h1>
              <p className="text-xs text-[#fb8c00] font-medium tracking-wider uppercase hidden sm:block">Astrological Wisdom</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 text-teal-100 hover:text-white transition-colors ${logoError ? 'animate-pulse text-orange-300 font-bold' : ''}`}
                title="Settings & Logo"
             >
               {logoError && <span className="text-xs uppercase tracking-wider hidden sm:inline">Upload Logo</span>}
               <Settings className="w-5 h-5" />
             </button>
             <div className="text-sm text-teal-100/80 hidden sm:block font-serif italic border-l border-teal-700 pl-4 ml-2">
                "Rooted in Ancient Wisdom"
             </div>
          </div>
        </div>
        
        {/* Settings / Upload Panel */}
        {showSettings && (
          <div className="bg-[#003d33] border-t border-teal-800 p-4 animate-in slide-in-from-top-2 duration-200">
             <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-teal-200 flex items-center gap-2">
                  {!isSupabaseConfigured() ? (
                    <span className="text-orange-300 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Configure Supabase credentials in code first.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                       <CheckCircle className="w-3 h-3 text-teal-400" />
                       Supabase Connected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isUploading || !isSupabaseConfigured()}
                     className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#fb8c00] hover:bg-[#f57c00] text-white text-xs font-bold px-4 py-2.5 rounded transition-colors disabled:opacity-50 shadow-sm"
                   >
                     {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                     Upload New Logo
                   </button>
                </div>
             </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        
        <div className="bg-white p-8 rounded-xl shadow-xl border border-orange-200 flex flex-col relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ScrollText className="w-6 h-6 text-[#004d40]" />
              <h2 className="text-xl font-bold font-serif text-[#004d40]">Report Generator</h2>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Paste raw client notes here...&#10;&#10;The system will automatically analyze the text, structure the data, design the document with minimalist spiritual visuals, and download the PDF."
              className={`w-full min-h-[300px] p-6 border rounded-lg focus:ring-2 focus:ring-[#fb8c00] focus:border-transparent outline-none resize-y font-mono text-sm leading-relaxed text-slate-700 bg-[#fffdf5] transition-all
                ${loading ? 'opacity-50 border-slate-200' : 'border-orange-100'}
              `}
            />
            
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10">
                 <div className="w-16 h-16 border-4 border-orange-100 border-t-[#fb8c00] rounded-full animate-spin mb-4"></div>
                 <p className="text-[#004d40] font-medium text-sm mt-2">Crafting Astrology Report...</p>
                 <p className="text-slate-400 text-xs">Generating visuals & formatting layout</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
             {/* Status Message Area */}
             <div className="flex-1">
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        {error} {error.includes("reconnect") && <button onClick={handleConnect} className="underline font-bold ml-1">Connect Key</button>}
                    </div>
                  </div>
                )}
                
                {report && !loading && !error && (
                   <div className="flex items-center gap-3 text-[#004d40] bg-teal-50 p-3 rounded-lg border border-teal-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <CheckCircle className="w-5 h-5 text-teal-600" />
                      <div>
                        <p className="font-bold text-sm">PDF Downloaded Successfully</p>
                        <p className="text-xs text-teal-700/80">Check your downloads folder</p>
                      </div>
                   </div>
                )}
             </div>

             {/* Action Button */}
             <button
               onClick={handleGenerate}
               disabled={loading || !inputText.trim()}
               className={`
                 flex items-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all shadow-md min-w-[200px] justify-center
                 ${loading || !inputText.trim() 
                   ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                   : 'bg-[#fb8c00] text-white hover:bg-[#f57c00] hover:shadow-xl active:transform active:scale-95'}
               `}
             >
               {loading ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   <span>Processing...</span>
                 </>
               ) : (
                 <>
                   <Sparkles className="w-5 h-5" />
                   Generate PDF
                 </>
               )}
             </button>
          </div>
        </div>

        {report && !loading && (
           <div className="text-center mt-6">
              <button 
                onClick={() => createPDF(report)} 
                className="inline-flex items-center gap-2 text-slate-500 hover:text-[#fb8c00] transition-colors text-sm font-medium"
              >
                 <Download className="w-4 h-4" />
                 Download PDF Again
              </button>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;