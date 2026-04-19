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
  const [isNavExpanded, setIsNavExpanded] = useState(false); // For Nexus header expansion

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

  const ThemeDropdown = ({ isMinimal = false, direction = 'up', align = 'left' }) => (
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
        <div className={`absolute ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} ${align === 'right' ? 'right-0' : 'left-0'} w-56 rounded-3xl border shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in duration-200 ${theme === 'dark' ? 'bg-[#0f0f0f] border-neutral-800' : 'bg-white border-neutral-200'} p-2`}>
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
    setUploadForm(prev => ({ ...prev, imdbId: extracted }));
    if (extracted && extracted !== uploadForm.imdbId) fetchCurrentMetadata(extracted);
    else if (!extracted) setCurrentMetadata(null);
  };

  const attemptAutofillMetadata = async (fileName) => {
    try {
      const res = await apiFetch(`/api/admin/tmdb/search?query=${encodeURIComponent(fileName)}`);
      if (res.ok) {
          const data = await res.json();
          if (data.imdbId) {
             setUploadForm(prev => ({ ...prev, imdbId: data.imdbId, type: data.type || 'movie' }));
             fetchCurrentMetadata(data.imdbId);
          }
      }
    } catch (err) {
      console.error("Autofill failed", err);
    }
  };

  const processFiles = useCallback(async (items) => {
    setUploadSuccess(false);
    
    // items can be FileList or DataTransferItemList
    const entries = Array.from(items);
    let firstFileName = null;
    
    const handleEntry = async (entry) => {
      if (entry.isFile) {
        const file = await new Promise(resolve => entry.file(resolve));
        if (!firstFileName) firstFileName = file.name;
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
         if (!firstFileName) firstFileName = entry.name;
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
    
    // Trigger autofill if we are holding an empty form
    setUploadForm(prev => {
        if (!prev.imdbId && firstFileName) {
            attemptAutofillMetadata(firstFileName);
        }
        return prev;
    });
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
      <div className={`login-page min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Background Orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
        <div className="orb orb-5"></div>
        <div className="orb orb-6"></div>

        <div className="glass-container flex flex-col relative z-20">
           {/* Navigation Header */}
           <header className="w-full p-6 lg:p-10 flex justify-between items-center z-50">
              <div className="flex items-center gap-4">
                 <img src="/logo.png" className="w-10 h-10 rounded-2xl shadow-2xl" alt="SubStream" />
                 <span className="font-black tracking-tighter text-2xl lg:text-3xl">SUBSTREAM</span>
              </div>

              {/* Theme Toggle Button */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10'}`}
              >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
              </button>
           </header>

           {/* Login Card */}
           <main className="flex-1 flex justify-center items-center">
              <div className="w-full max-w-[420px] px-8 lg:px-12">
                  <div className="text-center mb-10 lg:mb-14">
                      <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Sign In</h1>
                      <p className="opacity-50 font-bold text-[10px] lg:text-xs uppercase tracking-widest leading-relaxed">
                        Secure Access Portal <br/>
                        Core Kernel v4.2.0
                      </p>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-6 lg:space-y-8">
                      <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.25em] font-black ml-1 opacity-40">Username</label>
                          <input 
                            type="text" 
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            placeholder="ADMIN IDENTITY" 
                            className={`w-full p-4 lg:p-5 rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-white/40 text-white' : 'bg-black/5 border-black/5 focus:border-black/20 text-black'}`}
                            required 
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.25em] font-black ml-1 opacity-40">Password</label>
                          <input 
                            type="password" 
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            placeholder="••••••••" 
                            className={`w-full p-4 lg:p-5 rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-white/40 text-white' : 'bg-black/5 border-black/5 focus:border-black/20 text-black'}`}
                            required 
                          />
                      </div>
                      
                      {loginError && (
                        <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-4 rounded-2xl animate-in fade-in zoom-in duration-300">
                          {loginError}
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={loginLoading}
                        className={`w-full p-5 lg:p-6 font-black rounded-2xl transition-all shadow-2xl tracking-widest uppercase text-[11px] lg:text-xs ${loginLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                      >
                         {loginLoading ? 'Authenticating...' : 'Access SubStream'}
                      </button>
                  </form>
              </div>
           </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`login-page min-h-screen w-full relative overflow-hidden font-sans ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="orb orb-4"></div>
      <div className="orb orb-5"></div>
      <div className="orb orb-6"></div>

      {/* Floating Header */}
      <header className={`floating-header transition-theme ${isNavExpanded ? 'header-expanded' : ''}`}>
          <div className="header-top">
              <div className="flex items-center gap-3">
                  <img src="/logo.png" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shadow-xl" alt="" />
                  <span className="font-black tracking-tighter text-lg md:text-2xl uppercase">SubStream</span>
              </div>

              <nav className="flex items-center gap-3 md:gap-6">
                  {/* Desktop Links */}
                  <div className="hidden lg:flex items-center gap-6 mr-4 border-r border-white/10 pr-6">
                      {[
                        { id: 'upload', label: 'Feed', icon: Upload },
                        { id: 'search', label: 'Search', icon: Globe },
                        { id: 'list', label: 'Library', icon: Archive },
                        { id: 'logs', label: 'Logs', icon: Shield }
                      ].map(link => (
                        <button 
                          key={link.id}
                          onClick={() => { setCurrentView(link.id); if(link.id === 'list') fetchSubtitles(); }}
                          className={`text-[10px] font-black uppercase tracking-widest transition-all ${currentView === link.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                        >
                          {link.label}
                        </button>
                      ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyManifestUrl}
                      className="hidden md:flex w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-500 hover:scale-105 transition-all"
                      title="Copy Addon Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
                    </button>
                  </div>

                  {/* Mobile Toggle */}
                  <button 
                    onClick={() => {
                        const newExpanded = !isNavExpanded;
                        setIsNavExpanded(newExpanded);
                        document.documentElement.style.setProperty('--header-h', newExpanded ? '380px' : '70px');
                    }}
                    className="lg:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                  >
                      <Menu className={`w-5 h-5 transition-transform ${isNavExpanded ? 'rotate-90' : ''}`} />
                  </button>
              </nav>
          </div>

          {/* Mobile Drawer */}
          <div className="mobile-nav-content lg:hidden pt-4 border-t border-white/10">
              <nav className="space-y-4 px-2">
                  {[
                    { id: 'upload', label: 'Upload Feed', icon: Upload },
                    { id: 'search', label: 'Search & Import', icon: Globe },
                    { id: 'list', label: 'Media Library', icon: Archive },
                    { id: 'logs', label: 'System Logs', icon: Shield }
                  ].map(link => (
                    <button 
                      key={link.id}
                      onClick={() => { 
                        setCurrentView(link.id); 
                        if(link.id === 'list') fetchSubtitles(); 
                        setIsNavExpanded(false);
                        document.documentElement.style.setProperty('--header-h', '70px');
                      }}
                      className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl transition-all ${currentView === link.id ? 'bg-white/10' : 'opacity-40'}`}
                    >
                      <link.icon className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">{link.label}</span>
                    </button>
                  ))}
                  <div className="pt-4 space-y-4">
                    <button onClick={copyManifestUrl} className="w-full py-4 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-500/10">
                       <Share2 className="w-4 h-4" /> Copy Addon Link
                    </button>
                   <button onClick={handleLogout} className="w-full py-4 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/10">
                       <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
              </nav>
          </div>
      </header>

      {/* Main Content */}
      
      
      {/* Main Content Area */}
      <main className="main-frame overflow-hidden transition-theme">
        <div className={`flex-1 flex flex-col min-w-0 bg-transparent relative h-full overflow-y-auto custom-scrollbar`}>
          <div className={`max-w-full mx-auto w-full flex flex-col flex-1 ${currentView === 'logs' ? 'p-0' : 'p-4 lg:p-10 pb-24 gap-6'}`}>

          {/* PAGE CONTENT BLOCKS */}
          {currentView === 'upload' ? (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Media Center</h1>
                <p className="opacity-40 font-bold mb-10 md:mb-14 uppercase text-[10px] md:text-xs tracking-widest">Configure your upload sequence and metadata.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Content Type */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Type</label>
                        <div className="toggle-group flex gap-4">
                            {['movie', 'series'].map(t => (
                              <button 
                                key={t}
                                type="button"
                                onClick={() => setUploadForm({...uploadForm, type: t})} 
                                className={`flex-1 py-7 rounded-2xl text-sm md:text-base font-black uppercase tracking-[0.2em] transition-all ${uploadForm.type === t ? 'active' : ''}`}
                              >
                                {t}
                              </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Subtitle</label>
                        <div className="toggle-group flex gap-4">
                            {[ {code: 'mal', label: 'Malayalam'}, {code: 'eng', label: 'English'} ].map(l => (
                              <button 
                                key={l.code}
                                type="button"
                                onClick={() => setUploadForm({...uploadForm, language: l.code})} 
                                className={`flex-1 py-7 rounded-2xl text-sm md:text-base font-black uppercase tracking-[0.2em] transition-all ${uploadForm.language === l.code ? 'active' : ''}`}
                              >
                                {l.label}
                              </button>
                            ))}
                        </div>
                    </div>
                </div>
                     {/* IMDb ID */}
                    <div className="space-y-4 mb-10">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">IMDb Identification</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={uploadForm.imdbId}
                            onChange={handleImdbChange}
                            placeholder="Paste IMDb URL or ID (tt...)" 
                            className={`imdb-input w-full p-5 lg:p-6 rounded-2xl text-lg md:text-xl font-mono tracking-tight outline-none focus:border-white/20 transition-all ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                          />
                          {isMetadataLoading && <RefreshCw className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 animate-spin" />}
                        </div>
                    </div>

                    {/* DROPZONE */}
                    <div className="space-y-4 mb-10">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Asset Dropzone</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                          onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                          onDrop={(e) => { 
                            e.preventDefault(); 
                            e.currentTarget.classList.remove('dragover'); 
                            processFiles(e.dataTransfer.items); 
                          }}
                          className="dropzone rounded-[32px] p-12 lg:p-20 text-center flex flex-col items-center justify-center cursor-pointer mb-10"
                        >
                            <div className="w-28 h-28 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8">
                                <Upload className="w-14 h-14 opacity-30" />
                            </div>
                            <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">Process Files or ZIP</h3>
                            <p className="text-sm opacity-40 font-bold uppercase tracking-widest leading-relaxed">Automatic extraction and listing enabled</p>
                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelection} />
                        </div>
                    </div>

                    {/* File List */}
                    {stagedFiles.length > 0 && (
                      <div className="space-y-5 mb-10 animate-in slide-in-from-bottom duration-500">
                          <div className="flex justify-between items-center ml-1">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Extracted Sequence ({stagedFiles.length})</label>
                              <button onClick={() => setStagedFiles([])} className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:opacity-100 opacity-60">Clear All</button>
                          </div>
                          <div className="space-y-3">
                             {stagedFiles.map((item, idx) => (
                                <div key={idx} className="file-item p-4 lg:p-5 flex justify-between items-center group transition-all hover:bg-white/10">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                          <FileText className="w-5 h-5 opacity-30" />
                                        </div>
                                        <div className="min-w-0">
                                            {item.isEditing ? (
                                              <input 
                                                autoFocus
                                                className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white outline-none w-full"
                                                value={item.tempName}
                                                onChange={(e) => {
                                                  const newFiles = [...stagedFiles];
                                                  newFiles[idx].tempName = e.target.value;
                                                  setStagedFiles(newFiles);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') saveEdit(idx);
                                                  if (e.key === 'Escape') cancelEdit(idx);
                                                }}
                                              />
                                            ) : (
                                              <div className="text-xs lg:text-sm font-bold truncate max-w-[150px] md:max-w-md">{item.name}</div>
                                            )}
                                            <div className="text-[9px] opacity-30 uppercase font-black mt-1">{(item.size / (1024 * 1024)).toFixed(2)} MB {item.isFromZip ? '• ZIP Source' : ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {item.isEditing ? (
                                        <>
                                          <button onClick={() => saveEdit(idx)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Check className="w-4 h-4" /></button>
                                          <button onClick={() => cancelEdit(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><X className="w-4 h-4" /></button>
                                        </>
                                      ) : (
                                        <>
                                          <button onClick={() => startEditing(idx)} className="p-2 lg:opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                          <button onClick={() => removeStagedFile(idx)} className="p-2 text-red-500/40 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </>
                                      )}
                                    </div>
                                </div>
                             ))}
                          </div>
                      </div>
                    )}

                    <button 
                      onClick={handleUploadSubmit}
                      disabled={isUploading || stagedFiles.length === 0}
                      className={`w-full py-6 bg-[var(--login-btn)] text-[var(--login-btn-text)] rounded-2xl md:rounded-3xl font-black text-xl lg:text-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-2xl uppercase tracking-tighter ${isUploading ? 'opacity-50' : ''}`}
                    >
                        {isUploading ? 'Uploading Sequence...' : uploadSuccess ? 'Successfully Committed' : 'Commit Upload'}
                    </button>
                </div>
          ) : currentView === 'search' ? (
                <div className="max-w-4xl mx-auto w-full flex flex-col gap-10 animate-in fade-in duration-700">
                     <div className="media-card p-10 lg:p-14 rounded-[3rem]">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 uppercase leading-none">Global Importer</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-10">Scan high-availability media clusters.</p>
                        <div className="flex flex-col md:flex-row gap-5">
                           <div className="relative flex-1">
                              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 opacity-20" />
                              <input 
                                type="text" 
                                value={externalSearchQuery} 
                                onChange={(e) => setExternalSearchQuery(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && searchExternal()} 
                                placeholder="Search External Clusters..." 
                                className={`w-full py-6 pl-16 pr-8 rounded-[1.5rem] outline-none border transition-all text-xl font-bold tracking-tight ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-white/20 text-white' : 'bg-black/5 border-black/10 focus:border-black/20 text-black'}`} 
                              />
                           </div>
                           <button 
                             onClick={searchExternal} 
                             disabled={isSearchingExternal} 
                             className="px-14 py-6 md:py-0 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50"
                           >
                             {isSearchingExternal ? <RefreshCw className="w-7 h-7 animate-spin mx-auto" /> : 'Scan Cluster'}
                           </button>
                        </div>
                     </div>

                     {externalResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom duration-500">
                           {externalResults.map((result, idx) => {
                              const status = importStatus[result.link] || 'idle';
                              return (
                                <div key={idx} className="media-card p-8 rounded-[3rem] flex flex-col gap-8 group">
                                   <div className="flex items-start justify-between gap-6">
                                      <div className="flex-1 min-w-0">
                                         <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${result.type === 'Series' ? 'bg-indigo-600' : 'bg-amber-500'} text-white inline-block mb-4 shadow-lg`}>{result.type || 'Media'}</span>
                                         <h3 className="font-black text-2xl md:text-3xl leading-[1.1] mb-2 tracking-tighter text-balance">{result.title}</h3>
                                         <p className="text-[10px] font-mono opacity-20 uppercase tracking-[0.3em] font-bold">{result.imdbId || 'PENDING'}</p>
                                      </div>
                                      <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                         {result.thumbnail ? <img src={result.thumbnail} className="w-full h-full object-cover rounded-[1.5rem]" alt="" /> : <Film className="w-8 h-8 opacity-20" />}
                                      </div>
                                   </div>
                                   <div className="space-y-4">
                                      <div className="flex gap-3">
                                         <input 
                                           type="text" 
                                           value={result.imdbId || ''} 
                                           onChange={(e) => {
                                             const newRes = [...externalResults];
                                             newRes[idx].imdbId = e.target.value;
                                             setExternalResults(newRes);
                                           }}
                                           placeholder="IMDb ID..."
                                           className={`flex-1 px-5 py-4 rounded-xl text-xs font-mono outline-none border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                                         />
                                         <button 
                                           onClick={() => inspectLink(result)}
                                           className={`p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${status === 'inspecting' ? 'animate-spin' : ''}`}
                                         >
                                            <RefreshCw className="w-4 h-4 opacity-40" />
                                         </button>
                                      </div>
                                      <button 
                                        onClick={() => importExternal(result, result.imdbId, result.type || 'movie', result.season, result.episode)}
                                        disabled={status !== 'idle' && status !== 'error'}
                                        className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${status === 'success' ? 'bg-emerald-500 text-white' : status === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:scale-[1.02] shadow-xl'}`}
                                      >
                                         {status === 'importing' ? <RefreshCw className="w-5 h-5 animate-spin" /> : status === 'success' ? 'Synchronized' : 'Pull Metadata'}
                                      </button>
                                   </div>
                                </div>
                              );
                           })}
                        </div>
                     )}
                </div>
          ) : currentView === 'list' ? (
                <div className="animate-in fade-in duration-700 h-full flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                        <div className="toggle-group min-w-[240px] p-2 flex gap-2">
                            {['movie', 'series'].map(m => (
                              <button 
                                key={m} 
                                onClick={() => setMediaFilter(m)} 
                                className={`flex-1 py-5.5 rounded-full text-xs md:text-sm font-black uppercase tracking-[0.15em] transition-all ${mediaFilter === m ? 'active' : ''}`}
                              >
                                {m}
                              </button>
                            ))}
                        </div>
                        <div className="relative flex-1 md:max-w-md w-full">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                          <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className={`w-full pl-14 pr-6 py-4 rounded-2xl text-[12px] font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/20' : 'bg-black/5 border-black/10 text-black focus:border-black/20'}`} 
                            placeholder="Search Library Clusters..." 
                          />
                        </div>
                        <button 
                          onClick={fetchSubtitles} 
                          disabled={isRefreshing} 
                          className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10 shadow-sm'} hover:scale-105 transition-all`}
                        >
                          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {subtitles.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-10 mt-20">
                          <Archive className="w-32 h-32 mb-8" />
                          <p className="text-2xl font-black uppercase tracking-[0.5em]">No Data Clusters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
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
                                <div key={idx} className="media-card rounded-[3rem] p-8 flex flex-col gap-8 group">
                                  <div className="flex gap-6">
                                    <div className="shrink-0 relative">
                                      {first.poster_path ? (
                                        <img src={first.poster_path} className="w-28 h-40 object-cover rounded-[1.5rem] shadow-2xl" alt="" />
                                      ) : (
                                        <div className="w-28 h-40 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 text-white/20">
                                          <Film className="w-12 h-12" />
                                        </div>
                                      )}
                                      <div className="absolute -top-2 -left-2 flex flex-col gap-2">
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${isSeries ? 'bg-indigo-600' : 'bg-amber-500'} text-white shadow-xl`}>
                                          {sub.type}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 flex flex-col">
                                      <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-black text-2xl leading-[1.1] truncate text-balance tracking-tighter">
                                          {sub.title}
                                        </h3>
                                        <button 
                                          onClick={() => handleDeleteSeason(sub.imdbId, null, sub.files)}
                                          className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                      </div>
                                      <p className="text-[10px] font-mono opacity-20 mt-1 uppercase tracking-[0.2em] font-bold">{sub.imdbId}</p>
                                      
                                      <div className="mt-auto flex flex-wrap gap-2">
                                        <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl bg-white/5 text-white/40 border border-white/5">
                                          {sub.files.length} ASSETS
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    {sub?.files?.map((file, fIdx) => (
                                      <div key={fIdx} className="file-item p-4 flex justify-between items-center group/item transition-all hover:bg-white/5">
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11px] font-bold truncate opacity-80 mb-1">
                                            {file.filename.split('-').slice(1).join('-') || file.filename}
                                          </p>
                                          <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                                            {(file.size/1024/1024).toFixed(1)} MB {isSeries && `• EP ${file.episode} S${file.season}`}
                                          </p>
                                        </div>
                                        <button onClick={() => handleDelete(file.id)} className="p-2 opacity-0 group-hover/item:opacity-100 text-red-500 translate-x-4 group-hover/item:translate-x-0 transition-all">
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
                <div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 flex flex-col rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl overflow-hidden h-full">
                        <div className="flex items-center gap-2 px-8 py-6 border-b border-white/5 bg-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            <span className="text-[10px] font-mono opacity-40 ml-6 font-black tracking-[0.3em] uppercase">System Flux Monitor — {logs.length} events</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 font-mono text-xs lg:text-sm leading-relaxed custom-scrollbar selection:bg-emerald-500/30 w-full">
                            {logs.length > 0 ? (
                                <div className="space-y-4">
                                    {logs.map((log, i) => (
                                        <div key={i} className="flex gap-8 group">
                                            <span className="text-emerald-500/40 shrink-0 select-none font-bold">[{log.ts}]</span>
                                            <span className="text-emerald-400/90 break-all leading-relaxed">
                                                <span className="opacity-20 mr-4 font-black">➜</span>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                    <div id="logs-end"></div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center opacity-10">
                                    <Shield className="w-24 h-24" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
          ) : null}
        </div>
      </div>
    </main>
  </div>
);
}
