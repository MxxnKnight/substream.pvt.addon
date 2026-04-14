import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Film,
  LogOut,
  Search,
  User,
  Shield,
  Trash2,
  Tv,
  Clapperboard,
  Archive,
  AlertCircle,
  X,
  FileCheck,
  Edit2,
  Check,
  Loader,
  FolderInput,
  Link,
  RefreshCw,
  Globe,
  Sun,
  Moon,
  Palette,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // --- State ---
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  const [subtitles, setSubtitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false); // Mobile nav state

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accent, setAccent] = useState(localStorage.getItem('accent') || 'indigo');
  const [mediaFilter, setMediaFilter] = useState('movie'); // 'movie', 'series'

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('accent', accent);
  }, [accent]);

  const ACCENTS = {
    indigo: { main: 'bg-indigo-600', hover: 'hover:bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-600', shadow: 'shadow-indigo-600/20', ring: 'ring-indigo-500' },
    rose: { main: 'bg-rose-600', hover: 'hover:bg-rose-500', text: 'text-rose-600', border: 'border-rose-600', shadow: 'shadow-rose-600/20', ring: 'ring-rose-500' },
    emerald: { main: 'bg-emerald-600', hover: 'hover:bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-600', shadow: 'shadow-emerald-600/20', ring: 'ring-emerald-500' },
    amber: { main: 'bg-amber-600', hover: 'hover:bg-amber-500', text: 'text-amber-600', border: 'border-amber-600', shadow: 'shadow-amber-600/20', ring: 'ring-amber-500' },
    sky: { main: 'bg-sky-600', hover: 'hover:bg-sky-500', text: 'text-sky-600', border: 'border-sky-600', shadow: 'shadow-sky-600/20', ring: 'ring-sky-500' },
  };

  const a = ACCENTS[accent] || ACCENTS.indigo;


  // Login Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    imdbId: '',
    type: 'movie',       // default: Movie
    season: '',
    episode: '',
    language: 'mal'      // default: Malayalam
  });

  // Staging state for files
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Zip Extraction State
  const [extractingCount, setExtractingCount] = useState(0);
  const isExtracting = extractingCount > 0;
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Metadata for current upload
  const [currentMetadata, setCurrentMetadata] = useState(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  // External Search State
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [externalResults, setExternalResults] = useState([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [importStatus, setImportStatus] = useState({}); // { id: 'idle' | 'importing' | 'success' | 'error' }

  // --- Check Auth on Load ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ username: 'Admin' });
      fetchSubtitles();
    }
  }, []);

  // --- Periodic Log Fetching ---
  useEffect(() => {
    let interval;
    if (user && currentView === 'logs') {
      fetchLogs();
      interval = setInterval(fetchLogs, 3000); // Poll logs every 3 seconds
    }
    return () => clearInterval(interval);
  }, [user, currentView]);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  // --- API Helpers ---

  const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error('Unauthorized');
    }
    return res;
  };

  const fetchSubtitles = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiFetch('/api/admin/subtitles');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(sub => ({
          id: sub.id,
          imdbId: sub.imdb_id,
          fileName: sub.file_path.split('/').pop(),
          date: new Date(sub.created_at).toISOString().split('T')[0],
          size: 'Unknown',
          type: sub.type,
          season: sub.season,
          episode: sub.episode,
          language: sub.language,
          metadata: sub.metadata // Store metadata from backend
        }));
        setSubtitles(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch subtitles", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchCurrentMetadata = async (imdbId) => {
    if (!imdbId || !imdbId.startsWith('tt')) {
      setCurrentMetadata(null);
      return;
    }
    setIsMetadataLoading(true);
    try {
      const res = await apiFetch(`/api/admin/metadata?imdbId=${imdbId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentMetadata(data.error ? null : data);
        return data.error ? null : data;
      } else {
        setCurrentMetadata(null);
      }
    } catch (err) {
      setCurrentMetadata(null);
    } finally {
      setIsMetadataLoading(false);
    }
    return null;
  };

  const searchExternal = async (e) => {
    e?.preventDefault();
    if (!externalSearchQuery) return;
    setIsSearchingExternal(true);
    setExternalResults([]);
    try {
      const res = await apiFetch(`/api/admin/search-external?query=${encodeURIComponent(externalSearchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setExternalResults(data);
      }
    } catch (err) {
      console.error("External search failed", err);
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const inspectLink = async (result) => {
    const importId = result.link;
    setImportStatus(prev => ({ ...prev, [importId]: 'inspecting' }));
    try {
      const res = await apiFetch(`/api/admin/inspect-external?link=${encodeURIComponent(result.link)}`);
      if (res.ok) {
        const data = await res.json();
        // Update the result in the list with detected metadata
        setExternalResults(prev => prev.map(r => 
          r.link === result.link ? { ...r, imdbId: data.imdbId, type: data.type } : r
        ));
        setImportStatus(prev => ({ ...prev, [importId]: 'idle' }));
        return data;
      }
    } catch (err) {
      console.error("Link inspection failed", err);
    }
    setImportStatus(prev => ({ ...prev, [importId]: 'error' }));
    return null;
  };

  const importExternal = async (result, imdbId, type, season, episode) => {
    const importId = result.link;
    setImportStatus(prev => ({ ...prev, [importId]: 'importing' }));
    try {
      const res = await apiFetch('/api/admin/import-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: result.link,
          source: result.source,
          imdb_id: imdbId,
          type,
          season,
          episode
        })
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus(prev => ({ ...prev, [importId]: 'success' }));
        fetchSubtitles();
        // Alert how many were imported
        alert(data.message);
      } else {
        setImportStatus(prev => ({ ...prev, [importId]: 'error' }));
        alert(data.error);
      }
    } catch (err) {
      setImportStatus(prev => ({ ...prev, [importId]: 'error' }));
    }
  };

  // --- Helpers ---

  const extractImdbId = (input) => {
    if (!input) return '';
    const match = input.match(/(tt\d{6,})/);
    return match ? match[0] : input;
  };

  const copyManifestUrl = () => {
    const url = window.location.origin + '/manifest.json';
    navigator.clipboard.writeText(url).then(() => {
        alert('Manifest URL copied!\n\n' + url);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
  };

  const loadJSZip = () => {
    return new Promise((resolve, reject) => {
      if (window.JSZip) return resolve(window.JSZip);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error('Failed to load JSZip'));
      document.head.appendChild(script);
    });
  };

  const handleZipFile = async (file) => {
    setExtractingCount(prev => prev + 1);
    setExtractionProgress(10);
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const extractedFiles = [];
      const totalFiles = Object.keys(contents.files).length;
      let processed = 0;
      for (const relativePath of Object.keys(contents.files)) {
        const zipEntry = contents.files[relativePath];
        processed++;
        setExtractionProgress(60 + Math.floor((processed / totalFiles) * 30));
        if (zipEntry.dir || relativePath.includes('__MACOSX') || relativePath.startsWith('.')) continue;
        if (/\.(srt|vtt|sub|ass)$/i.test(relativePath)) {
          const data = await zipEntry.async('blob');
          const cleanName = relativePath.split('/').pop();
          const fileObj = new File([data], cleanName, { type: 'text/plain' });
          extractedFiles.push({ file: fileObj, name: cleanName, size: data.size, isFromZip: true, isEditing: false, originalZip: file.name });
        }
      }
      setStagedFiles(prev => [...prev, ...extractedFiles]);
    } catch (error) {
      console.error("Zip extraction failed:", error);
    } finally {
      setExtractingCount(prev => Math.max(0, prev - 1));
    }
  };

  // --- Handlers ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser({ username: loginForm.username });
        fetchSubtitles();
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (err) {
      setLoginError('Network error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoginForm({ username: '', password: '' });
    setCurrentView('upload');
  };

  const handleImdbChange = (e) => {
    const rawValue = e.target.value;
    const extracted = extractImdbId(rawValue);
    setUploadForm({ ...uploadForm, imdbId: extracted });
    if (extracted && extracted !== uploadForm.imdbId) fetchCurrentMetadata(extracted);
    else if (!extracted) setCurrentMetadata(null);
  };

  const processFiles = useCallback((files) => {
    if (files.length === 0) return;
    setUploadSuccess(false);
    files.forEach(file => {
      const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip';
      if (isZip) handleZipFile(file);
      else if (/\.(srt|vtt|sub|ass)$/i.test(file.name)) {
        setStagedFiles(prev => [...prev, { file: file, name: file.name, size: file.size, isFromZip: false, isEditing: false }]);
      }
    });
  }, []);

  const handleFileSelection = (e) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExtracting) return;
    processFiles(Array.from(e.dataTransfer.files || []));
  };

  const toggleEditFile = (index) => {
    const newFiles = [...stagedFiles];
    newFiles[index].isEditing = !newFiles[index].isEditing;
    if (newFiles[index].isEditing) newFiles[index].tempName = newFiles[index].name;
    setStagedFiles(newFiles);
  };

  const saveFileName = (index) => {
    const newFiles = [...stagedFiles];
    if (newFiles[index].tempName !== newFiles[index].name) {
       const oldFile = newFiles[index].file;
       newFiles[index].file = new File([oldFile], newFiles[index].tempName, { type: oldFile.type });
       newFiles[index].name = newFiles[index].tempName;
    }
    newFiles[index].isEditing = false;
    setStagedFiles(newFiles);
  };

  const updateTempName = (index, value) => {
    const newFiles = [...stagedFiles];
    newFiles[index].tempName = value;
    setStagedFiles(newFiles);
  };

  const removeStagedFile = (idx) => setStagedFiles(stagedFiles.filter((_, i) => i !== idx));

  const handleDelete = async (id) => {
    if(window.confirm("Delete this subtitle?")) {
      try {
        const res = await apiFetch(`/api/admin/subtitles/${id}`, { method: 'DELETE' });
        if (res.ok) setSubtitles(subtitles.filter(sub => sub.id !== id));
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteSeason = async (imdbId, season, subs) => {
    if(window.confirm(`Delete all ${subs.length} subtitles for S${season}?`)) {
      try {
        await Promise.all(subs.map(sub => apiFetch(`/api/admin/subtitles/${sub.id}`, { method: 'DELETE' })));
        setSubtitles(prev => prev.filter(s => !subs.some(sub => sub.id === s.id)));
      } catch (err) { console.error(err); }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (stagedFiles.length === 0 || !uploadForm.imdbId) return;
    setIsUploading(true);
    let successCount = 0;
    for (const staged of stagedFiles) {
        const formData = new FormData();
        formData.append('file', staged.file);
        formData.append('imdb_id', uploadForm.imdbId);
        formData.append('type', uploadForm.type);
        formData.append('language', uploadForm.language);
        try {
            const res = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
            if (res.ok) successCount++;
        } catch (err) { console.error(err); }
    }
    setIsUploading(false);
    if (successCount > 0) {
        setUploadSuccess(true);
        setStagedFiles([]);
        setUploadForm(prev => ({ ...prev, imdbId: '' }));
        fetchSubtitles();
    }
  };

  const filteredSubtitles = subtitles.filter(sub => {
    const q = searchQuery.toLowerCase().trim();
    if (mediaFilter !== sub.type) return false;
    if (!q) return true;
    return (sub.fileName?.toLowerCase().includes(q) || sub.imdbId?.toLowerCase().includes(q) || sub.metadata?.title?.toLowerCase().includes(q));
  });

  if (!user) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex items-center justify-center p-4 font-sans transition-theme`}>
        <div className={`max-w-md w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-[2.5rem] shadow-2xl overflow-hidden border p-8 lg:p-12 transition-theme`}>
            <div className="text-center mb-10">
              <div className={`${a.main} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${a.shadow}`}>
                <Film className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SubStream</h2>
              <p className="mt-3 text-sm font-bold opacity-50 uppercase tracking-widest">Administrator Portal</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" /><input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className={`w-full ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 ${a.ring}/10 transition-all`} placeholder="username" /></div>
              <div className="relative group"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" /><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className={`w-full ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 ${a.ring}/10 transition-all`} placeholder="password" /></div>
              {loginError && <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl">{loginError}</div>}
              <button type="submit" disabled={loginLoading} className={`w-full ${a.main} ${a.hover} text-white font-black py-4 rounded-2xl transition-all shadow-xl ${a.shadow}`}>Sign In</button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} font-sans flex flex-col lg:flex-row h-screen overflow-hidden transition-theme`}>

      {/* Sidebar */}
      <aside className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex w-full lg:w-72 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} border-b lg:border-b-0 lg:border-r ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} transition-all duration-500 ${isNavOpen ? 'translate-y-0' : '-translate-y-full lg:translate-y-0'}`}>
        <div className="flex flex-col h-full w-full pt-20 lg:pt-0">
          <div className="p-8 flex items-center gap-4"><div className={`${a.main} p-2.5 rounded-2xl`}><Film className="w-5 h-5 text-white" /></div><h1 className="font-black text-xl tracking-tighter">SubStream</h1></div>
          <div className="p-6">
            <button onClick={copyManifestUrl} className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${a.main} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl ${a.shadow}`}>Copy Addon Link</button>
            <nav className="mt-8 space-y-1">
              {[ 
                { id: 'upload', label: 'Upload Feed', icon: Upload }, 
                { id: 'search', label: 'Search & Import', icon: Globe },
                { id: 'list', label: 'Manage Library', icon: Archive }, 
                { id: 'logs', label: 'Live Traffic', icon: Shield } 
              ].map((item) => (
                <button key={item.id} onClick={() => { setCurrentView(item.id); if(item.id === 'list') fetchSubtitles(); setIsNavOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all ${currentView === item.id ? `${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white shadow-sm text-slate-900'} border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}` : 'opacity-40 hover:opacity-100'}`}>
                  <item.icon className={`w-4 h-4 ${currentView === item.id ? a.text : ''}`} /><span className="font-bold text-xs">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-10 pt-10 border-t border-slate-500/10 space-y-6">
               <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black uppercase opacity-40">Appearance</span><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>{theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button></div>
               <div className="px-2 pb-10"><div className="flex flex-wrap gap-2">{Object.keys(ACCENTS).map(c => <button key={c} onClick={() => setAccent(c)} className={`w-6 h-6 rounded-full ${ACCENTS[c].main} transition-all ${accent === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-30'}`} />)}</div></div>
            </div>
          </div>
          <div className="mt-auto p-6 flex flex-col gap-3"><button onClick={handleLogout} className="flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-all text-[10px] uppercase font-black tracking-widest py-4"><LogOut className="w-4 h-4" /> Sign Out</button></div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
        <div className="max-w-screen-2xl mx-auto w-full p-4 lg:p-8 flex flex-col gap-8">
          
          {/* Mobile Header (Floating rounded square) */}
          <header className={`lg:hidden flex flex-col gap-4 p-4 rounded-[1.5rem] sticky top-4 z-50 border shadow-2xl transition-all ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-xl`}>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className={`${a.main} p-2 rounded-xl`}><Film className="w-4 h-4 text-white" /></div><span className="font-black tracking-tighter">SubStream</span></div>
                <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 opacity-50 hover:opacity-100 transition-all">{isNavOpen ? <X className="w-5 h-5" /> : <Palette className="w-5 h-5" />}</button>
             </div>
             {currentView === 'list' && (
                <div className={`flex p-1 rounded-2xl ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-100/50'} border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                   {['movie', 'series'].map(m => (
                      <button key={m} onClick={() => setMediaFilter(m)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mediaFilter === m ? `${a.main} text-white shadow-lg` : 'opacity-40'}`}>{m}</button>
                   ))}
                </div>
             )}
          </header>

          {/* Persistent Desktop Header */}
          <header className={`hidden lg:flex items-center justify-between sticky top-0 z-30 py-4 px-6 border rounded-2xl transition-all ${theme === 'dark' ? 'bg-slate-925/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-xl shadow-sm`}>
             <div className="flex items-center gap-8">
                <h2 className="text-lg font-black tracking-tight">{currentView === 'upload' ? 'Upload Feed' : currentView === 'list' ? 'SubView Library' : currentView === 'search' ? 'Search & Import' : 'Live Traffic'}</h2>
                {currentView === 'list' && (
                  <div className={`flex p-1 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                    {['movie', 'series'].map(m => (
                      <button key={m} onClick={() => setMediaFilter(m)} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mediaFilter === m ? `${a.main} text-white shadow-lg` : 'opacity-40 hover:opacity-100'}`}>{m}</button>
                    ))}
                  </div>
                )}
             </div>
             <div className="flex items-center gap-3">
                {currentView === 'list' && <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`pl-8 pr-4 py-1.5 rounded-lg text-[10px] outline-none border transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400'}`} placeholder="Search IMDB or Files..." /></div>}
                {currentView === 'list' && <button onClick={fetchSubtitles} disabled={isRefreshing} className={`p-2 rounded-lg opacity-40 hover:opacity-100 transition-all ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCw className="w-3.5 h-3.5" /></button>}
             </div>
          </header>

          {currentView === 'upload' ? (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className={`rounded-[2.5rem] border p-8 lg:p-12 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                <form onSubmit={handleUploadSubmit} className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    {['movie', 'series'].map(t => (
                      <button key={t} type="button" onClick={() => setUploadForm({...uploadForm, type: t})} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${uploadForm.type === t ? `${a.main} border-transparent text-white shadow-xl ${a.shadow}` : `${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}`}>
                         {t === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase opacity-40 px-2">Subtitle Language</label><div className="flex gap-2">{[ {code: 'eng', label: 'English'}, {code: 'mal', label: 'Malayalam'} ].map(l => <button key={l.code} type="button" onClick={() => setUploadForm({...uploadForm, language: l.code})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${uploadForm.language === l.code ? `${a.main} border-transparent text-white` : `${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-transparent'}`}`}>{l.label}</button>)}</div></div>
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase opacity-40 px-2">IMDB Identity</label><div className="relative"><input type="text" value={uploadForm.imdbId} onChange={handleImdbChange} placeholder="tt1234567" className={`w-full py-3.5 px-4 rounded-xl border-2 outline-none font-mono text-xs ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-transparent focus:bg-white'}`} />{isMetadataLoading && <RefreshCw className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${a.text} animate-spin`} />}</div></div>
                  </div>
                  {currentMetadata && <div className={`flex gap-6 p-4 rounded-[1.8rem] border-2 animate-in slide-in-from-left-4 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>{currentMetadata.poster_path ? <img src={currentMetadata.poster_path} alt="Poster" className="w-16 h-24 object-cover rounded-xl shadow-lg" /> : <div className="w-16 h-24 bg-slate-900 rounded-xl" />}<div className="flex flex-col justify-center min-w-0"><h4 className="font-black text-lg truncate">{currentMetadata.title}</h4><p className="text-[10px] opacity-40 line-clamp-2">{currentMetadata.overview}</p></div></div>}
                  <div onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} className={`min-h-[160px] border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${theme === 'dark' ? 'border-slate-800 bg-slate-950/20 hover:border-indigo-500/50' : 'border-slate-100 bg-slate-50 hover:border-indigo-400'}`} onClick={()=>fileInputRef.current.click()}><input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelection} /><Archive className="w-8 h-8 opacity-20 mb-4" /><p className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop packs or click to select</p></div>
                  {stagedFiles.length > 0 && <div className={`rounded-2xl border divide-y overflow-hidden ${theme === 'dark' ? 'bg-slate-950 border-slate-800 divide-slate-800' : 'bg-slate-50 border-slate-100 divide-slate-100'}`}>{stagedFiles.map((f, i) => <div key={i} className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"><div className="flex items-center gap-3 min-w-0"><div className="p-2 rounded-lg bg-slate-900"><FileText className="w-3 h-3 opacity-40" /></div><span className="text-xs font-bold truncate opacity-80">{f.name}</span></div><button type="button" onClick={()=>removeStagedFile(i)} className="p-2 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button></div>)}</div>}
                  <button type="button" onClick={handleUploadSubmit} disabled={!uploadForm.imdbId || stagedFiles.length === 0 || isUploading} className={`w-full py-5 rounded-2xl font-black text-white transition-all shadow-2xl ${!uploadForm.imdbId || stagedFiles.length === 0 || isUploading ? 'opacity-20 cursor-not-allowed' : `${a.main} ${a.hover} ${a.shadow} active:scale-95`}`}>{isUploading ? 'Synchronizing Cluster...' : `Commit ${stagedFiles.length} Subtitles`}</button>
                  {uploadSuccess && <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase text-center border border-emerald-500/20">Protocol Complete. Cluster Updated.</div>}
                </form>
              </div>
            </div>
          ) : currentView === 'search' ? (
            <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8">
               <div className={`rounded-[2.5rem] border p-8 lg:p-12 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                  <form onSubmit={searchExternal} className="flex gap-4">
                     <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                        <input 
                           type="text" 
                           value={externalSearchQuery} 
                           onChange={(e) => setExternalSearchQuery(e.target.value)} 
                           placeholder="Search Malayalam Subtitles by Name..." 
                           className={`w-full py-4 pl-12 pr-4 rounded-2xl border-2 outline-none font-bold ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-transparent focus:bg-white'}`} 
                        />
                     </div>
                     <button type="submit" disabled={isSearchingExternal} className={`px-8 rounded-2xl font-black text-white ${a.main} ${a.hover} transition-all active:scale-95 disabled:opacity-50`}>
                        {isSearchingExternal ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
                     </button>
                  </form>

                  {externalResults.length > 0 && (
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {externalResults.map((result, idx) => {
                          const status = importStatus[result.link] || 'idle';
                          return (
                            <div key={idx} className={`p-6 rounded-[2rem] border-2 flex flex-col gap-4 group transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-100 hover:border-indigo-400'}`}>
                               <div className="flex gap-4 items-start">
                                  {result.thumbnail ? (
                                    <img src={result.thumbnail} className="w-16 h-20 object-cover rounded-xl shadow-lg" alt="" />
                                  ) : (
                                    <div className="w-16 h-20 bg-slate-900 rounded-xl flex items-center justify-center"><Film className="w-6 h-6 opacity-20" /></div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                     <span className="text-[8px] font-black uppercase opacity-40 px-2 py-0.5 rounded-full bg-slate-800 text-white mb-2 inline-block">{result.source}</span>
                                     <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-1" title={result.title}>{result.title}</h4>
                                     <a href={result.link} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> View Site</a>
                                  </div>
                               </div>

                               <div className="mt-auto pt-4 border-t border-slate-500/10 space-y-4">
                                  <div className="grid grid-cols-2 gap-2">
                                     <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase opacity-40 px-1">IMDb ID</label>
                                        <input 
                                          type="text" 
                                          placeholder="tt1234567" 
                                          className={`w-full py-2 px-3 rounded-lg text-[10px] font-mono border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                                          onBlur={(e) => { result.imdbId = extractImdbId(e.target.value); }}
                                          defaultValue={result.imdbId || ''}
                                        />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase opacity-40 px-1">Type</label>
                                        <select 
                                          className={`w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                                          onChange={(e) => { result.type = e.target.value; }}
                                          defaultValue={result.type || 'movie'}
                                        >
                                           <option value="movie">Movie</option>
                                           <option value="series">Series</option>
                                        </select>
                                     </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                     <input 
                                       type="number" 
                                       placeholder="S" 
                                       className={`w-12 py-2 px-2 rounded-lg text-[10px] border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                                       onChange={(e) => { result.season = e.target.value; }}
                                     />
                                     <input 
                                       type="number" 
                                       placeholder="E" 
                                       className={`w-12 py-2 px-2 rounded-lg text-[10px] border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                                       onChange={(e) => { result.episode = e.target.value; }}
                                     />
                                     <button 
                                       onClick={() => inspectLink(result)}
                                       className={`p-2 rounded-lg border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} ${status === 'inspecting' ? 'animate-spin' : ''}`}
                                       title="Auto-detect IMDb ID and Type"
                                     >
                                        <RefreshCw className="w-3.5 h-3.5 opacity-40" />
                                     </button>
                                     <button 
                                       onClick={() => importExternal(result, result.imdbId, result.type || 'movie', result.season, result.episode)}
                                       disabled={status !== 'idle' && status !== 'error'}
                                       className={`flex-1 py-2 rounded-lg font-black text-[10px] text-white transition-all ${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : `${a.main} hover:opacity-90`}`}
                                     >
                                        {status === 'importing' ? 'Importing...' : status === 'success' ? 'Imported' : status === 'error' ? 'Failed' : 'Import'}
                                     </button>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                  )}

                  {!isSearchingExternal && externalResults.length === 0 && externalSearchQuery && (
                    <div className="mt-20 text-center opacity-30">
                       <Search className="w-12 h-12 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No results found on external sites</p>
                    </div>
                  )}
               </div>
            </div>
          ) : currentView === 'logs' ? (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                  <div className="h-[600px] overflow-y-auto p-4 lg:p-8 font-mono text-[11px] space-y-2.5 custom-scrollbar">
                     {logs.length > 0 ? logs.map((log, i) => <div key={i} className={`p-4 rounded-xl border flex gap-6 ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><span className="opacity-30 shrink-0">{log.ts}</span><span className="opacity-80 break-all">{log.message}</span></div>) : <div className="h-full flex flex-col items-center justify-center opacity-20"><RefreshCw className="w-10 h-10 animate-spin-slow mb-6" /><p className="font-black uppercase tracking-widest text-[10px]">Awaiting Signal Stream...</p></div>}
                  </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20 animate-in fade-in duration-700">
               {Object.entries(subtitles.filter(sub => {
                 const q = searchQuery.toLowerCase().trim();
                 if (mediaFilter !== sub.type) return false;
                 if (!q) return true;
                 return (sub.fileName?.toLowerCase().includes(q) || sub.imdbId?.toLowerCase().includes(q) || sub.metadata?.title?.toLowerCase().includes(q));
               }).reduce((acc, sub) => {
                 const key = sub.type === 'movie' ? `${sub.imdbId}_${sub.language}` : `${sub.imdbId}_s${sub.season || 0}_${sub.language}`;
                 if (!acc[key]) acc[key] = []; acc[key].push(sub); return acc;
               }, {})).length > 0 ? Object.entries(subtitles.filter(sub => {
                 const q = searchQuery.toLowerCase().trim();
                 if (mediaFilter !== sub.type) return false;
                 if (!q) return true;
                 return (sub.fileName?.toLowerCase().includes(q) || sub.imdbId?.toLowerCase().includes(q) || sub.metadata?.title?.toLowerCase().includes(q));
               }).reduce((acc, sub) => {
                 const key = sub.type === 'movie' ? `${sub.imdbId}_${sub.language}` : `${sub.imdbId}_s${sub.season || 0}_${sub.language}`;
                 if (!acc[key]) acc[key] = []; acc[key].push(sub); return acc;
               }, {})).map(([groupKey, groupSubs]) => {
                  const first = groupSubs[0];
                  const m = first.metadata;
                  const isSeries = first.type === 'series';
                  const title = m?.title || first.imdbId;
                  
                  return (
                     <div key={groupKey} className={`flex flex-col h-full border rounded-[1.8rem] overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="relative h-32 shrink-0 overflow-hidden">
                           {m?.poster_path ? <img src={m.poster_path} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-10" /> : <div className="absolute inset-0 bg-slate-950" />}
                           <div className="absolute inset-0 p-4 flex gap-3 items-end">
                              {m?.poster_path && <img src={m.poster_path} className="w-12 h-18 object-cover rounded-lg shadow-xl" />}
                              <div className="flex-1 min-w-0">
                                 <div className="flex flex-wrap gap-1 mb-1 items-center">
                                    <span className={`text-[6px] font-black uppercase px-2 py-0.5 rounded-full ${isSeries ? 'bg-purple-600' : 'bg-indigo-600'} text-white shadow-sm`}>{first.type}</span>
                                    {isSeries && <span className="text-[6px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-700 text-white shadow-sm">S{String(first.season || 0).padStart(2,'0')}</span>}
                                    <span className={`text-[6px] font-black uppercase px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-600'}`}>{first.language?.toUpperCase()}</span>
                                 </div>
                                 <h4 className={`font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} ${title.length > 20 ? 'text-[10px]' : 'text-xs'} line-clamp-2`} title={title}>{title}</h4>
                                 <p className="text-[8px] opacity-30 font-mono">{first.imdbId}</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-3 flex-grow overflow-hidden flex flex-col">
                           <div className="flex items-center justify-between mb-2 px-1">
                              <span className="text-[8px] font-black uppercase opacity-20 tracking-widest">{isSeries ? 'Episodes' : 'File Pack'} • {groupSubs.length}</span>
                              {isSeries && <button onClick={()=>handleDeleteSeason(first.imdbId, first.season, groupSubs)} className="text-[7px] font-black uppercase px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all">Flush</button>}
                           </div>
                           <div className="space-y-1 overflow-y-auto max-h-[160px] custom-scrollbar pr-1">
                              {groupSubs.sort((a,b)=>(a.episode||0)-(b.episode||0)).map(s => (
                                 <div key={s.id} className={`flex items-center justify-between p-2 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'} group/item`}>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                       {isSeries && <span className={`text-[8px] font-black ${a.text}`}>E{String(s.episode).padStart(2,'0')}</span>}
                                       <span className="text-[10px] font-medium truncate opacity-60" title={s.fileName}>{s.fileName}</span>
                                    </div>
                                    <button onClick={()=>handleDelete(s.id)} className="p-1 opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                              ))}
                           </div>
                        </div>
                        <div className={`p-3 border-t flex items-center justify-between ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                           <div className="flex items-center gap-1 opacity-20"><div className="w-1 h-1 rounded-full bg-emerald-500" /> <span className="text-[7px] font-black uppercase">Synced</span></div>
                           <button onClick={()=>window.open(`https://www.imdb.com/title/${first.imdbId}`, '_blank')} className="opacity-20 hover:opacity-100 transition-all"><ExternalLink className="w-3 h-3" /></button>
                        </div>
                     </div>
                  );
               }) : (
                  <div className="col-span-full py-20 text-center opacity-30"><Archive className="w-12 h-12 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Library Segment Empty</p></div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
