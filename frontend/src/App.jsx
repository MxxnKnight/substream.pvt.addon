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
  Menu,
  Palette,
  ExternalLink, Share2
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
  const [accent, setAccent] = useState(localStorage.getItem('accent') || 'gold');
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
    mint: { label: 'Ocean Mint', main: 'bg-emerald-500', hover: 'hover:bg-emerald-400', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500' },
    rose: { label: 'Rose Pink', main: 'bg-rose-500', hover: 'hover:bg-rose-400', text: 'text-rose-500', border: 'border-rose-500', ring: 'ring-rose-500' },
    lavender: { label: 'Lavender', main: 'bg-violet-500', hover: 'hover:bg-violet-400', text: 'text-violet-500', border: 'border-violet-500', ring: 'ring-violet-500' },
    peach: { label: 'Peach', main: 'bg-orange-500', hover: 'hover:bg-orange-400', text: 'text-orange-500', border: 'border-orange-500', ring: 'ring-orange-500' },
    sky: { label: 'Sky Blue', main: 'bg-sky-500', hover: 'hover:bg-sky-400', text: 'text-sky-500', border: 'border-sky-500', ring: 'ring-sky-500' },
  };

  const a = ACCENTS[accent] || ACCENTS.mint;
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
            setIsThemeMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ThemeDropdown = ({ isMinimal = false }) => (
    <div className="relative" ref={themeMenuRef}>
      <button 
        onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} 
        className={`flex items-center gap-2 ${isMinimal ? 'p-2 rounded-xl' : 'p-1.5 px-3 rounded-full'} border transition-all ${theme === 'dark' ? 'bg-[#111] border-neutral-800 hover:border-neutral-700 text-white' : 'bg-white border-neutral-300 hover:border-neutral-400 text-neutral-900 shadow-sm'}`}
      >
        <div className={`w-3 h-3 rounded-full ${a.main}`} />
        {!isMinimal && <span className="text-[10px] font-black uppercase tracking-widest">{a.label}</span>}
        <Palette className="w-3.5 h-3.5 opacity-40" />
      </button>

      {isThemeMenuOpen && (
        <div className={`absolute ${isMinimal ? 'right-0 top-full' : 'left-0 bottom-full mb-3'} mt-3 w-56 rounded-3xl border shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in duration-200 ${theme === 'dark' ? 'bg-[#0f0f0f] border-neutral-800' : 'bg-white border-neutral-200'} p-2`}>
           <div className="px-5 py-3 border-b border-neutral-800/10 mb-2">
             <span className="text-[10px] font-black uppercase opacity-40">Select Theme</span>
           </div>
           {Object.keys(ACCENTS).map(c => (
              <button key={c} onClick={() => { setAccent(c); setIsThemeMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${accent === c ? (theme === 'dark' ? 'bg-neutral-800/50' : 'bg-neutral-100') : 'hover:bg-white/5'}`}>
                 <div className="flex items-center gap-3">
                   <div className={`w-4 h-4 rounded-full ${ACCENTS[c].main}`} />
                   <span className={`text-[11px] font-bold ${accent === c ? 'opacity-100' : 'opacity-60'}`}>{ACCENTS[c].label}</span>
                 </div>
                 {accent === c && <Check className="w-3 h-3 text-emerald-500" />}
              </button>
           ))}
           <div className={`mt-2 pt-2 border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'}`}>
              <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setIsThemeMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-neutral-800/10 transition-all opacity-80 hover:opacity-100">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="text-[11px] font-bold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );


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
  const scrollRef = useRef(null);
  const stagedScrollRef = useRef(null);
  const themeRef = useRef(null);

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
        // Group by IMDb ID and Season
        const groups = {};
        data.forEach(sub => {
          const isSeries = sub.type === 'series';
          const groupKey = isSeries ? `${sub.imdb_id}-S${sub.season || 1}` : sub.imdb_id;
          
          if (!groups[groupKey]) {
            groups[groupKey] = {
              imdbId: sub.imdb_id,
              groupKey: groupKey,
              title: sub.metadata?.title || 'Unknown Title',
              type: sub.type,
              season: sub.season,
              files: []
            };
          }
          groups[groupKey].files.push({
            id: sub.id,
            filename: decodeURIComponent(sub.file_path.split('/').pop()).replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/, ''),
            season: sub.season,
            episode: sub.episode,
            language: sub.language,
            poster_path: sub.metadata?.poster_path,
            type: sub.type
          });
        });
        setSubtitles(Object.values(groups));
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
      const res = await apiFetch(`/api/admin/inspect-external?link=${encodeURIComponent(result.link)}&title=${encodeURIComponent(result.title)}`);
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
          title: result.title,
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
          extractedFiles.push({ file: fileObj, name: cleanName, size: data.size, isFromZip: true, isEditing: false, tempName: cleanName, originalZip: file.name });
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

  const processFiles = useCallback(async (items) => {
    setUploadSuccess(false);
    
    // items can be FileList or DataTransferItemList
    const entries = Array.from(items);
    
    const handleEntry = async (entry) => {
      if (entry.isFile) {
        const file = await new Promise(resolve => entry.file(resolve));
        if (/\.(srt|vtt|sub|ass)$/i.test(file.name)) {
          setStagedFiles(prev => [...prev, { file: file, name: file.name, size: file.size, isFromZip: false, isEditing: false, tempName: file.name }]);
        } else if (file.name.toLowerCase().endsWith('.zip')) {
          handleZipFile(file);
        }
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readEntries = () => {
          reader.readEntries(async (subEntries) => {
            if (subEntries.length > 0) {
              for (const sub of subEntries) await handleEntry(sub);
              readEntries();
            }
          });
        };
        readEntries();
      } else if (entry instanceof File) {
         // Fallback for standard selection
         if (entry.name.toLowerCase().endsWith('.zip')) {
           handleZipFile(entry);
         } else if (/\.(srt|vtt|sub|ass)$/i.test(entry.name)) {
           setStagedFiles(prev => [...prev, { file: entry, name: entry.name, size: entry.size, isFromZip: false, isEditing: false, tempName: entry.name }]);
         }
      }
    };

    for (const item of entries) {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) await handleEntry(entry);
      } else {
        await handleEntry(item);
      }
    }
  }, []);

  const handleFileSelection = (e) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.items) processFiles(e.dataTransfer.items);
    else processFiles(e.dataTransfer.files);
  };

  const removeStagedFile = (idx) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const startEditing = (idx) => {
    setStagedFiles(prev => prev.map((f, i) => i === idx ? { ...f, isEditing: true, tempName: f.name } : f));
  };

  const saveEdit = (idx) => {
    setStagedFiles(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      let newName = f.tempName.trim();
      if (!newName.match(/\.(srt|vtt|sub|ass)$/i)) newName += '.srt';
      return { ...f, isEditing: false, name: newName };
    }));
  };

  const cancelEdit = (idx) => {
    setStagedFiles(prev => prev.map((f, i) => i === idx ? { ...f, isEditing: false } : f));
  };

  const handleNameChange = (idx, val) => {
    setStagedFiles(prev => prev.map((f, i) => i === idx ? { ...f, tempName: val } : f));
  };



  const handleDelete = async (id) => {
    if(window.confirm("Delete this subtitle?")) {
      try {
        const res = await apiFetch(`/api/admin/subtitles/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSubtitles(prev => prev.map(group => ({
            ...group,
            files: group.files.filter(f => f.id !== id)
          })).filter(group => group.files.length > 0));
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteSeason = async (imdbId, season, subs) => {
    const msg = season ? `Delete all ${subs.length} subtitles for S${season}?` : `Delete all ${subs.length} subtitles?`;
    if(window.confirm(msg)) {
      try {
        await Promise.all(subs.map(sub => apiFetch(`/api/admin/subtitles/${sub.id}`, { method: 'DELETE' })));
        setSubtitles(prev => prev.map(group => {
          if (group.imdbId !== imdbId) return group;
          return {
            ...group,
            files: group.files.filter(f => !subs.some(s => s.id === f.id))
          };
        }).filter(group => group.files.length > 0));
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
      formData.append('file', staged.file, staged.name);
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
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-neutral-100' : 'bg-neutral-100 text-neutral-900'} flex items-center justify-center p-4 font-sans transition-theme`}>
        <div className={`max-w-md w-full ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'} rounded-[1rem]  overflow-hidden border p-8 lg:p-12 transition-theme`}>
            <div className="text-center mb-10">
              <div className={`${a.main} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6  ${a.shadow}`}>
                <Film className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>SubStream</h2>
              <p className="mt-3 text-sm font-bold opacity-50 uppercase tracking-widest">Administrator Portal</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" /><input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className={`w-full ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-200'} border rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 ${a.ring}/10 transition-all`} placeholder="username" /></div>
              <div className="relative group"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" /><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className={`w-full ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-200'} border rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 ${a.ring}/10 transition-all`} placeholder="password" /></div>
              {loginError && <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl">{loginError}</div>}
              <button type="submit" disabled={loginLoading} className={`w-full ${a.main} ${a.hover} text-white font-black py-4 rounded-2xl transition-all  ${a.shadow}`}>Sign In</button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-neutral-100' : 'bg-white text-neutral-900'} font-sans flex flex-col lg:flex-row h-screen overflow-hidden transition-theme`}>

      {/* Sidebar */}
      <aside className={`hidden lg:flex lg:relative lg:z-0 lg:w-72 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-neutral-50'} border-r ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <div className="flex flex-col h-full w-full pt-20 lg:pt-0">
          <div className="p-8 flex items-center gap-4"><div className={`${a.main} p-2.5 rounded-2xl`}><Film className="w-5 h-5 text-white" /></div><h1 className="font-black text-xl tracking-tighter">SubStream</h1></div>
          <div className="p-6">
            <button onClick={copyManifestUrl} className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${a.main} text-white rounded-xl text-[10px] font-black uppercase tracking-widest  ${a.shadow}`}>Copy Addon Link</button>
            <nav className="mt-8 space-y-1">
              {[ 
                { id: 'upload', label: 'Upload Feed', icon: Upload }, 
                { id: 'search', label: 'Search & Import', icon: Globe },
                { id: 'list', label: 'Manage Library', icon: Archive }, 
                { id: 'logs', label: 'Live Traffic', icon: Shield } 
              ].map((item) => (
                <button key={item.id} onClick={() => { setCurrentView(item.id); if(item.id === 'list') fetchSubtitles(); setIsNavOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all ${currentView === item.id ? `${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-white  text-neutral-900'} border ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}` : 'opacity-40 hover:opacity-100'}`}>
                  <item.icon className={`w-4 h-4 ${currentView === item.id ? a.text : ''}`} /><span className="font-bold text-xs">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-10 pt-10 border-t border-neutral-500/10 space-y-6">
                <div className="px-2"><ThemeDropdown /></div>
            </div>
          </div>
          <div className="mt-auto p-6 flex flex-col gap-3"><button onClick={handleLogout} className="flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-all text-[10px] uppercase font-black tracking-widest py-4"><LogOut className="w-4 h-4" /> Sign Out</button></div>
        </div>
      </aside>

      {/* Main Content */}
      
      
      <main className={`flex-1 flex flex-col relative ${currentView === 'logs' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
        <div className={`max-w-full mx-auto w-full flex flex-col flex-1 ${currentView === 'logs' ? 'p-0 h-full overflow-hidden' : 'p-4 lg:p-6 pb-20 gap-4'}`}>
          
          {/* Mobile Header */}
          <header className={`lg:hidden flex flex-col sticky top-0 z-50 p-2`}> 
             <div className={`flex flex-col rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur-xl shadow-lg`}>
                <div className="flex items-center justify-between p-4 px-6">
                   <div className="flex items-center gap-3">
                      <div className={`${a.main} p-2 rounded-xl`}>
                         <Film className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-black tracking-tighter">SubStream</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <ThemeDropdown isMinimal={true} />
                      <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 opacity-50 hover:opacity-100 transition-all">
                         {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </button>
                   </div>
                </div>
                
                {currentView === 'list' && !isNavOpen && (
                   <div className="px-6 pb-5 space-y-3">
                      <div className={`flex p-1 rounded-full ${theme === 'dark' ? 'bg-neutral-900/50' : 'bg-neutral-100'} border ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
                         {['movie', 'series'].map(m => (
                            <button key={m} onClick={() => setMediaFilter(m)} className={`flex-1 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mediaFilter === m ? `${a.main} text-white` : 'opacity-40'}`}>{m}</button>
                         ))}
                      </div>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                         <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-8 pr-4 py-2 rounded-xl text-[10px] outline-none border transition-all ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`} placeholder="Search IMDB or Files..." />
                      </div>
                   </div>
                )}

                {isNavOpen && (
                   <div className={`lg:hidden border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'} animate-in slide-in-from-top duration-300`}>
                      <nav className="p-4 space-y-1">
                         {[ 
                           { id: 'upload', label: 'Upload Feed', icon: Upload }, 
                           { id: 'search', label: 'Search & Import', icon: Globe },
                           { id: 'list', label: 'Manage Library', icon: Archive }, 
                           { id: 'logs', label: 'Live Traffic', icon: Shield } 
                         ].map((item) => (
                           <button key={item.id} onClick={() => { setCurrentView(item.id); if(item.id === 'list') fetchSubtitles(); setIsNavOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-3 rounded-xl ${currentView === item.id ? (theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-neutral-100/50 text-neutral-900') : 'opacity-40'}`}>
                             <item.icon className={`w-4 h-4 ${currentView === item.id ? a.text : ''}`} /><span className="font-bold text-xs">{item.label}</span>
                           </button>
                         ))}
                         <div className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'} flex items-center justify-center pb-2`}>
                           <button onClick={handleLogout} className="flex items-center gap-2 opacity-40 text-[10px] uppercase font-black"><LogOut className="w-4 h-4" /> Sign Out</button>
                         </div>
                      </nav>
                   </div>
                )}
             </div>
          </header>

          {/* Desktop Header */}
          <header className={`hidden lg:flex sticky top-0 z-50 px-4 pt-4 mb-2`}> 
             <div className={`flex-1 flex items-center justify-between py-4 px-8 border rounded-full transition-all ${theme === 'dark' ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur-xl shadow-lg`}>
                <div className="flex items-center gap-4">
                   <h2 className="text-lg font-black tracking-tight">{currentView === 'upload' ? 'Upload Feed' : currentView === 'list' ? 'SubView Library' : currentView === 'search' ? 'Search & Import' : 'Live Traffic'}</h2>
                   {currentView === 'list' && (
                     <div className={`flex p-1 rounded-full ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'} border ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
                       {['movie', 'series'].map(m => (
                         <button key={m} onClick={() => setMediaFilter(m)} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mediaFilter === m ? `${a.main} text-white` : 'opacity-40 hover:opacity-100'}`}>{m}</button>
                       ))}
                     </div>
                   )}
                </div>
                 <div className="flex items-center gap-3">
                   <ThemeDropdown isMinimal={false} />
                 </div>
                   {currentView === 'list' && (
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                         <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`pl-8 pr-4 py-1.5 rounded-lg text-[10px] outline-none border transition-all ${theme === 'dark' ? 'bg-black border-neutral-800 focus:border-indigo-500' : 'bg-neutral-50 border-neutral-200 focus:border-indigo-400'}`} placeholder="Search Library..." />
                      </div>
                   )}
                   {currentView === 'list' && <button onClick={fetchSubtitles} disabled={isRefreshing} className={`p-2 rounded-lg opacity-40 hover:opacity-100 transition-all ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCw className="w-3.5 h-3.5" /></button>}
                </div>
           </header>

          {/* PAGE CONTENT BLOCKS */}
          {currentView === 'upload' ? (
            <div className="max-w-full mx-auto w-full animate-in fade-in duration-700">
              <div className={`rounded-[1rem] border p-6 lg:p-10 ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-100'}`}>
                <form className="space-y-8">
                  <div className="flex gap-4">
                    {['movie', 'series'].map(t => (
                      <button key={t} type="button" onClick={() => setUploadForm({...uploadForm, type: t})} className={`flex-1 p-6 rounded-[0.8rem] border-2 transition-all flex flex-col items-center gap-3 ${uploadForm.type === t ? `${a.main} border-transparent text-white ${a.shadow}` : `${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-100'}`}`}>
                         {t === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase opacity-40 px-2">Subtitle Language</label><div className="flex gap-2">{[ {code: 'eng', label: 'English'}, {code: 'mal', label: 'Malayalam'} ].map(l => <button key={l.code} type="button" onClick={() => setUploadForm({...uploadForm, language: l.code})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${uploadForm.language === l.code ? `${a.main} border-transparent text-white` : `${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-100 border-transparent'}`}`}>{l.label}</button>)}</div></div>
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase opacity-40 px-2">IMDB Identity</label><div className="relative"><input type="text" value={uploadForm.imdbId} onChange={handleImdbChange} placeholder="tt1234567" className={`w-full py-3.5 px-4 rounded-xl border-2 outline-none font-mono text-xs ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-transparent focus:bg-white'}`} />{isMetadataLoading && <RefreshCw className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${a.text} animate-spin`} />}</div></div>
                  </div>
                  {currentMetadata && <div className={`flex gap-6 p-4 rounded-[0.8rem] border-2 animate-in slide-in-from-left-4 ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-100'}`}>{currentMetadata.poster_path ? <img src={currentMetadata.poster_path} alt="Poster" className="w-16 h-24 object-cover rounded-xl" /> : <div className="w-16 h-24 bg-black rounded-xl" />}<div className="flex flex-col justify-center min-w-0"><h4 className="font-black text-lg truncate">{currentMetadata.title}</h4><p className="text-[10px] opacity-40 line-clamp-2">{currentMetadata.overview}</p></div></div>}
                  <div onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} className={`min-h-[160px] border-4 border-dashed rounded-[1rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${theme === 'dark' ? 'border-neutral-800 bg-[#0a0a0a]/20 hover:border-indigo-500/50' : 'border-neutral-100 bg-neutral-50 hover:border-indigo-400'}`} onClick={()=>fileInputRef.current.click()}>
                    <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelection} />
                    <input ref={folderInputRef} type="file" webkitdirectory="true" hidden onChange={handleFileSelection} />
                    <div className="flex gap-4 mb-4">
                       <div className="p-4 rounded-3xl bg-indigo-500/10"><Archive className="w-8 h-8 text-indigo-500" /></div>
                       <div className="p-4 rounded-3xl bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); folderInputRef.current.click(); }}><FolderInput className="w-8 h-8 text-emerald-500" /></div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop packs, folders or click to select</p>
                  </div>
                  {stagedFiles.length > 0 && (
                    <div className={`rounded-2xl border divide-y overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800 divide-neutral-800' : 'bg-neutral-50 border-neutral-100 divide-neutral-100'}`}>
                      {stagedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-black"><FileText className="w-3 h-3 opacity-40" /></div>
                            {f.isEditing ? (
                              <input 
                                autoFocus
                                value={f.tempName} 
                                onChange={(e) => handleNameChange(i, e.target.value)}
                                className={`flex-1 bg-transparent border-b border-indigo-500 outline-none text-xs font-bold py-1`}
                                onKeyDown={(e) => { if(e.key === 'Enter') saveEdit(i); if(e.key === 'Escape') cancelEdit(i); }}
                              />
                            ) : (
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold truncate opacity-80">{f.name}</span>
                                {f.isFromZip && <span className="text-[8px] opacity-30 uppercase font-black tracking-tighter">From {f.originalZip}</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {f.isEditing ? (
                              <>
                                <button type="button" onClick={() => saveEdit(i)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"><Check className="w-4 h-4" /></button>
                                <button type="button" onClick={() => cancelEdit(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                              </>
                            ) : (
                              <>
                                <button type="button" onClick={() => startEditing(i)} className="p-2 opacity-30 hover:opacity-100 hover:text-indigo-500 transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button type="button" onClick={() => removeStagedFile(i)} className="p-2 opacity-30 hover:opacity-100 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={handleUploadSubmit} disabled={!uploadForm.imdbId || stagedFiles.length === 0 || isUploading} className={`w-full py-5 rounded-2xl font-black text-white transition-all ${!uploadForm.imdbId || stagedFiles.length === 0 || isUploading ? 'opacity-20 cursor-not-allowed' : `${a.main} ${a.hover} active:scale-95`}`}>{isUploading ? 'Synchronizing Cluster...' : `Commit ${stagedFiles.length} Subtitles`}</button>
                  {uploadSuccess && <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase text-center border border-emerald-500/20">Protocol Complete. Cluster Updated.</div>}
                </form>
              </div>
            </div>
          ) : currentView === 'search' ? (
            <div className="max-w-full mx-auto w-full animate-in fade-in duration-700 space-y-6">
               <div className={`rounded-[1rem] border p-6 lg:p-10 ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-100'}`}>
                  <form onSubmit={searchExternal} className="flex gap-4">
                     <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                        <input type="text" value={externalSearchQuery} onChange={(e) => setExternalSearchQuery(e.target.value)} placeholder="Search Malayalam Subtitles by Name..." className={`w-full py-4 pl-12 pr-4 rounded-2xl border-2 outline-none font-bold ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-transparent focus:bg-white'}`} />
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
                            <div key={idx} className={`p-6 rounded-[0.8rem] border-2 flex flex-col gap-4 group transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800 hover:border-indigo-500/50' : 'bg-neutral-50 border-neutral-100 hover:border-indigo-400'}`}>
                               <div className="flex gap-4 items-start">
                                  {result.thumbnail ? <img src={result.thumbnail} className="w-16 h-20 object-cover rounded-xl" alt="" /> : <div className="w-16 h-20 bg-black rounded-xl flex items-center justify-center"><Film className="w-6 h-6 opacity-20" /></div>}
                                  <div className="flex-1 min-w-0">
                                     <span className="text-[8px] font-black uppercase opacity-40 px-2 py-0.5 rounded-full bg-neutral-800 text-white mb-2 inline-block">{result.source}</span>
                                     <h3 className="font-black text-sm truncate">{result.title}</h3>
                                     <div className="flex flex-wrap gap-2 mt-2">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100 text-neutral-600'}`}>
                                           <Globe className="w-2.5 h-2.5 opacity-40" />
                                           {result.type || 'Detecting...'}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <div className="space-y-3 pt-2">
                                  <div className="flex gap-2">
                                     <input 
                                       type="text" 
                                       value={result.imdbId || ''} 
                                       onChange={(e) => {
                                         const newRes = [...externalResults];
                                         newRes[idx].imdbId = e.target.value;
                                         setExternalResults(newRes);
                                       }}
                                       placeholder="IMDb ID..."
                                       className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-mono outline-none border ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}
                                     />
                                     <button 
                                       onClick={() => inspectLink(result)}
                                       className={`p-2 rounded-lg border ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'} ${status === 'inspecting' ? 'animate-spin' : ''}`}
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
               </div>
            </div>
          ) : currentView === 'list' ? (
            <div className="max-w-full mx-auto w-full animate-in fade-in duration-700">
               {subtitles.length === 0 ? (
                 <div className="mt-40 text-center opacity-30">
                    <Archive className="w-16 h-16 mx-auto mb-6" />
                    <p className="text-sm font-black uppercase tracking-widest">Library Empty</p>
                 </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {subtitles
                      .filter(s => {
                        const title = s?.title?.toLowerCase() || '';
                        const imdbId = s?.imdbId || '';
                        const query = searchQuery?.toLowerCase() || '';
                        return s?.type === mediaFilter && (title.includes(query) || imdbId.includes(query));
                      })
                      .map((sub, idx) => {
                        const first = sub?.files?.[0] || {};
                        const isSeries = sub.type === 'series';
                        return (
                          <div key={idx} className={`group flex flex-col rounded-3xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-300 hover:border-neutral-400'} overflow-hidden transition-colors shadow-sm`}>
                            {/* Card Header/Info */}
                            <div className="p-5 flex gap-5">
                              <div className="shrink-0 relative">
                                {first.poster_path ? (
                                  <img src={first.poster_path} className="w-24 h-36 object-cover rounded-2xl shadow-2xl" alt="" />
                                ) : (
                                  <div className="w-24 h-36 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800 text-neutral-700">
                                    <Film className="w-10 h-10" />
                                  </div>
                                )}
                                <div className="absolute -top-2 -left-2 flex flex-col gap-1">
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${isSeries ? 'bg-indigo-600' : 'bg-amber-500'} text-white shadow-xl`}>
                                    {first.type}
                                  </span>
                                  {isSeries && (
                                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white text-black shadow-xl border border-neutral-200">
                                      S{String(first.season).padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="font-black text-xl leading-tight truncate text-balance">
                                    {sub.title} {sub.season ? `Season ${sub.season}` : ''}
                                  </h3>
                                  <button 
                                    onClick={() => handleDeleteSeason(sub.imdbId, null, sub.files)}
                                    className="p-2 -mt-1 -mr-1 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all text-neutral-600"
                                    title="Delete All Subtitles"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                                <p className="text-xs font-mono opacity-40 mt-1 uppercase tracking-tighter">{sub.imdbId}</p>
                                
                                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                                  {isSeries && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-neutral-800 text-white opacity-60">
                                      {sub.files.length} EPISODES
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                    {sub.files.length} FILES
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Subtitles List */}
                            <div className={`mt-auto border-t ${theme === 'dark' ? 'border-neutral-800 bg-black/40' : 'bg-neutral-100 border-neutral-200'} p-3 space-y-2`}>
                              {sub?.files?.map((file, fIdx) => (
                                <div key={fIdx} className={`group/item flex items-center justify-between gap-3 p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#0e0e0e] border-neutral-800' : 'bg-white border-neutral-300'} transition-all`}>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold truncate opacity-90 leading-none mb-1.5">
                                      {file.filename.split('-').slice(1).join('-') || file.filename}
                                    </p>
                                    {isSeries && (
                                      <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">
                                        EPISODE {file.episode} <span className="mx-1">•</span> S{file.season}
                                      </p>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => handleDelete(file.id)}
                                    className="p-1.5 rounded-lg opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all text-neutral-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
               )}
            </div>
          ) : currentView === 'logs' ? (
            <div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col h-full">
               <div className={`flex-1 flex flex-col rounded-none lg:rounded-[1rem] border-x-0 lg:border-x border-y shadow-2xl h-full flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0f] border-neutral-800' : 'bg-black border-neutral-800'}`}>
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-800 bg-black/50">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                     </div>
                     <span className="text-[10px] font-mono opacity-40 ml-4 font-black tracking-widest uppercase">System Flux Monitor.sh — {logs.length} events</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 lg:p-10 pb-20 font-mono text-[11px] lg:text-[13px] leading-relaxed custom-scrollbar bg-black/20 selection:bg-emerald-500/30 w-full overflow-x-hidden">
                     {logs.length > 0 ? (
                       <div className="space-y-3">
                         {logs.map((log, i) => (
                           <div key={i} className="flex gap-6 group">
                              <span className="text-emerald-500/40 shrink-0 select-none">[{log.ts}]</span>
                              <span className="text-emerald-400 break-all">
                                 <span className="opacity-30 mr-3">➜</span>
                                 {log.message}
                              </span>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="h-full flex items-center justify-center opacity-10">
                          <Shield className="w-20 h-20" />
                       </div>
                     )}
                  </div>
               </div>
            </div>
          ) : null}
        </div>
</main>
    </div>
  );
}
