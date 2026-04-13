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
  Palette
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

  const a = ACCENTS[accent];


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
      } else {
        setCurrentMetadata(null);
      }
    } catch (err) {
      setCurrentMetadata(null);
    } finally {
      setIsMetadataLoading(false);
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
        // Simple temporary toast or alert
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

      setExtractionProgress(30);
      const contents = await zip.loadAsync(file);

      setExtractionProgress(60);
      const extractedFiles = [];
      const totalFiles = Object.keys(contents.files).length;
      let processed = 0;

      for (const relativePath of Object.keys(contents.files)) {
        const zipEntry = contents.files[relativePath];
        processed++;
        setExtractionProgress(60 + Math.floor((processed / totalFiles) * 30));

        if (zipEntry.dir || relativePath.includes('__MACOSX') || relativePath.startsWith('.')) {
          continue;
        }

        if (/\.(srt|vtt|sub|ass)$/i.test(relativePath)) {
          const data = await zipEntry.async('blob');
          const cleanName = relativePath.split('/').pop();
          const fileObj = new File([data], cleanName, { type: 'text/plain' });

          extractedFiles.push({
            file: fileObj,
            name: cleanName,
            size: data.size,
            isFromZip: true,
            isEditing: false,
            originalZip: file.name
          });
        }
      }

      setStagedFiles(prev => [...prev, ...extractedFiles]);
      setExtractionProgress(100);

    } catch (error) {
      console.error("Zip extraction failed:", error);
      alert("Failed to extract zip file.");
    } finally {
      setTimeout(() => setExtractingCount(prev => Math.max(0, prev - 1)), 500);
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
      setLoginError('Network error. Is the backend running?');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoginForm({ username: '', password: '' });
    setCurrentView('upload');
    setSearchQuery('');
    setSubtitles([]);
  };

  const handleImdbChange = (e) => {
    const rawValue = e.target.value;
    const extracted = extractImdbId(rawValue);
    setUploadForm({ ...uploadForm, imdbId: extracted });
    if (extracted && extracted !== uploadForm.imdbId) {
       fetchCurrentMetadata(extracted);
    } else if (!extracted) {
       setCurrentMetadata(null);
    }
  };

  const processFiles = useCallback((files) => {
    if (files.length === 0) return;
    setUploadSuccess(false);

    files.forEach(file => {
      const isZip = file.name.toLowerCase().endsWith('.zip') ||
                   file.type === 'application/zip' ||
                   file.type === 'application/x-zip-compressed';

      const isSubtitle = /\.(srt|vtt|sub|ass)$/i.test(file.name);

      // REMOVED: Auto-switch to series on zip/multi-file logic
      // if ((isZip || files.length > 1) && uploadForm.type === 'movie') {
      //   setUploadForm(prev => ({ ...prev, type: 'series' }));
      // }

      if (isZip) {
        handleZipFile(file);
      } else if (isSubtitle) {
        setStagedFiles(prev => [...prev, {
          file: file,
          name: file.name,
          size: file.size,
          isFromZip: false,
          isEditing: false
        }]);
      }
    });
  }, [uploadForm.type]);

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
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

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  const toggleEditFile = (index) => {
    const newFiles = [...stagedFiles];
    newFiles[index].isEditing = !newFiles[index].isEditing;
    if (newFiles[index].isEditing) {
      newFiles[index].tempName = newFiles[index].name;
    }
    setStagedFiles(newFiles);
  };

  const saveFileName = (index) => {
    const newFiles = [...stagedFiles];
    if (newFiles[index].tempName !== newFiles[index].name) {
       const oldFile = newFiles[index].file;
       const newFile = new File([oldFile], newFiles[index].tempName, { type: oldFile.type });
       newFiles[index].file = newFile;
       newFiles[index].name = newFiles[index].tempName;
    }

    newFiles[index].isEditing = false;
    delete newFiles[index].tempName;
    setStagedFiles(newFiles);
  };

  const updateTempName = (index, value) => {
    const newFiles = [...stagedFiles];
    newFiles[index].tempName = value;
    setStagedFiles(newFiles);
  };

  const removeStagedFile = (indexToRemove) => {
    setStagedFiles(stagedFiles.filter((_, index) => index !== indexToRemove));
  };

  const clearStagedFiles = () => {
    setStagedFiles([]);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this subtitle?")) {
      try {
        const res = await apiFetch(`/api/admin/subtitles/${id}`, { method: 'DELETE' });
        if (res.ok) {
           setSubtitles(subtitles.filter(sub => sub.id !== id));
        } else {
           alert("Failed to delete subtitle");
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (stagedFiles.length === 0 || !uploadForm.imdbId) return;

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    let successCount = 0;
    let failCount = 0;

    for (const staged of stagedFiles) {
        const formData = new FormData();
        formData.append('file', staged.file);
        formData.append('imdb_id', uploadForm.imdbId);
        formData.append('type', uploadForm.type);
        formData.append('language', uploadForm.language); // Use selected language

        try {
            const res = await apiFetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) successCount++;
            else failCount++;
        } catch (err) {
            failCount++;
            console.error(err);
        }
    }

    setIsUploading(false);
    if (successCount > 0) {
        setUploadSuccess(true);
        setStagedFiles([]);
        setUploadForm(prev => ({
            ...prev,
            imdbId: '',
            season: '',
            episode: ''
            // Keep previous language setting or reset? Usually keep.
        }));
        fetchSubtitles();
    }

    if (failCount > 0) {
        setUploadError(`Failed to upload ${failCount} files.`);
    }
  };

  const filteredSubtitles = subtitles.filter(sub => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const epStr = sub.season != null ? `s${String(sub.season).padStart(2,'0')}e${String(sub.episode).padStart(2,'0')}` : '';
    return (
      (sub.fileName && sub.fileName.toLowerCase().includes(query)) ||
      (sub.imdbId && sub.imdbId.toLowerCase().includes(query)) ||
      (sub.type && sub.type.toLowerCase().includes(query)) ||
      (sub.language && sub.language.toLowerCase().includes(query)) ||
      (epStr && epStr.includes(query.replace(/\s/g,'')))
    );
  });

  // --- Render ---

  if (!user) {
    // Login Screen (Simplified & Theme Aware)
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex items-center justify-center p-4 font-sans transition-theme`}>
        <div className={`max-w-md w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-[2.5rem] shadow-2xl overflow-hidden border p-8 lg:p-12`}>
            <div className="text-center mb-10">
              <div className={`${a.main} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${a.shadow}`}>
                <Film className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SubStream Admin</h2>
              <p className={`mt-2 text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Authenticate to manage your subtitles</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-3 ml-1`}>Username</label>
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className={`w-full ${theme === 'dark' ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 text-slate-900'} border rounded-2xl py-4 pl-12 pr-4 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`}
                    placeholder="admin"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-3 ml-1`}>Password</label>
                <div className="relative group">
                  <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={`w-full ${theme === 'dark' ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 text-slate-900'} border rounded-2xl py-4 pl-12 pr-4 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {loginError && (
                <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">{loginError}</div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full ${a.main} ${a.hover} text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50`}
              >
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} font-sans flex flex-col lg:flex-row h-full lg:h-screen lg:overflow-hidden transition-theme`}>

      {/* Mobile Top Bar */}
      <div className={`lg:hidden ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} p-4 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-3">
          <div className={`${a.main} p-2.5 rounded-2xl shadow-lg ${a.shadow}`}>
            <Film className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-black text-xl tracking-tight">SubStream</h1>
        </div>
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className={`p-2 ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'} rounded-2xl transition-all`}
        >
          {isNavOpen ? <X className="w-6 h-6" /> : <div className="space-y-1.5"><div className="w-6 h-0.5 bg-current"></div><div className="w-6 h-0.5 bg-current"></div><div className="w-6 h-0.5 bg-current"></div></div>}
        </button>
      </div>

      {/* Sidebar / Top Drawer */}
      <aside className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex w-full lg:w-80 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} border-b lg:border-b-0 lg:border-r ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} transition-all duration-500 ease-in-out ${isNavOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full lg:translate-y-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto'}`}>
        <div className="flex flex-col h-full w-full pt-20 lg:pt-0 overflow-y-auto custom-scrollbar">
          <div className="p-8 mt-4 lg:mt-0 flex items-center justify-between gap-3 border-b border-transparent">
            <div className="flex items-center gap-4">
               <div className={`${a.main} p-3 rounded-[1.5rem] shadow-xl ${a.shadow}`}>
                  <Film className="w-6 h-6 text-white" />
               </div>
               <h1 className="font-black text-2xl tracking-tighter">SubStream</h1>
            </div>
          </div>

          <div className="p-8">
            <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700/50 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-[2.5rem] p-6 border mb-10 shadow-xl shadow-black/5`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-4`}>Addon URL</p>
              <button
                onClick={copyManifestUrl}
                className={`w-full flex items-center justify-center gap-3 px-5 py-4 ${a.main} ${a.hover} text-white rounded-2xl text-xs font-black transition-all shadow-xl ${a.shadow} group`}
              >
                <Link className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Copy Manifest</span>
              </button>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'upload', label: 'Upload', icon: Upload },
                { id: 'list', label: 'Library', icon: Archive },
                { id: 'logs', label: 'Traffic Logs', icon: Shield },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); if(item.id === 'list') fetchSubtitles(); setIsNavOpen(false); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all group ${
                    currentView === item.id 
                      ? `${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700 shadow-2xl' : 'bg-white text-slate-900 border-slate-200 shadow-xl shadow-black/5'} border` 
                      : `${theme === 'dark' ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === item.id ? `${a.main} text-white shadow-lg` : `${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} group-hover:scale-110`}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm tracking-tight">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Customization Section */}
            <div className="mt-12 pt-12 border-t border-slate-800/10">
               <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} mb-6 px-4`}>Personalization</p>
               
               <div className="flex flex-col gap-8 px-4">
                  {/* Theme Switcher */}
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold opacity-60">Theme</span>
                     <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-900'} transition-all hover:scale-110`}
                     >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                     </button>
                  </div>

                  {/* Accent Picker */}
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-2">
                        <Palette className="w-3 h-3 opacity-40" />
                        <span className="text-xs font-bold opacity-60">Accent Color</span>
                     </div>
                     <div className="flex flex-wrap gap-2.5">
                        {Object.keys(ACCENTS).map((color) => (
                           <button
                             key={color}
                             onClick={() => setAccent(color)}
                             className={`w-8 h-8 rounded-full ${ACCENTS[color].main} transition-all hover:scale-125 hover:rotate-12 ${accent === color ? 'ring-offset-2 ring-2 ring-indigo-500 scale-110' : 'opacity-40 grayscale-[50%]'}`}
                           />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-8 mt-auto border-t border-slate-800/10">
             <div className="flex items-center gap-4 px-4 py-2 mb-6">
                <div className={`w-10 h-10 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'} flex items-center justify-center border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                   <User className={`w-5 h-5 ${a.text}`} />
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-xs font-black truncate">Administrator</span>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">System Ready</span>
                   </div>
                </div>
             </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-3 ${theme === 'dark' ? 'text-slate-600 hover:text-red-400 font-black px-6 py-4 rounded-2xl border border-transparent hover:border-red-500/10' : 'text-slate-400 hover:text-red-500 font-black px-6 py-4 rounded-2xl border border-transparent'} transition-all text-xs uppercase tracking-widest`}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'} pb-24 lg:pb-12 custom-scrollbar`}>
        <div className="max-w-7xl mx-auto p-4 lg:p-12">
          
          {/* Floating Header */}
          <header className={`flex flex-col lg:flex-row lg:justify-between lg:items-center mt-4 lg:mt-0 mb-12 gap-8 sticky top-6 z-30 p-5 rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50/40'} glass shadow-2xl transition-all`}>
            <div className="flex items-center gap-5">
              <div className={`${a.main} p-3 rounded-2xl hidden lg:block`}>
                  {currentView === 'upload' ? <Upload className="w-5 h-5 text-white" /> : currentView === 'list' ? <Archive className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-3xl font-black tracking-tighter">
                  {currentView === 'upload' ? 'Upload Center' : currentView === 'list' ? 'SubView Library' : 'Traffic Monitor'}
              </h2>
              {currentView === 'list' && (
                  <button
                    onClick={fetchSubtitles}
                    disabled={isRefreshing}
                    className={`flex items-center gap-2 px-5 py-2.5 ${theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-100'} rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
              )}
            </div>

            {/* Search Bar */}
            {currentView === 'list' && (
              <div className="relative w-full lg:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`block w-full pl-14 pr-6 py-4 border-none rounded-[1.5rem] leading-5 ${theme === 'dark' ? 'bg-slate-950/80 text-white placeholder-slate-700' : 'bg-white text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-4 ${a.ring}/10 transition-all shadow-inner font-medium`}
                  placeholder="Seach by Movie, ID, or Filename..."
                />
              </div>
            )}
          </header>

        {currentView === 'upload' ? (
          /* UPLOAD PAGE */
          <div className="max-w-2xl">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 md:p-8 shadow-xl">
              <form onSubmit={handleUploadSubmit} className="space-y-6">

                {/* Content Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Content Type</label>
                  <div className="flex gap-4">
                    {['movie', 'series'].map((type) => (
                      <label key={type} className={`flex-1 cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${
                        uploadForm.type === type
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="contentType"
                          className="hidden"
                          checked={uploadForm.type === type}
                          onChange={() => setUploadForm({ ...uploadForm, type: type })}
                        />
                        <div className={`p-2 rounded-xl ${uploadForm.type === type ? 'bg-white/20' : 'bg-slate-800'}`}>
                          {type === 'movie' && <Film className="w-5 h-5" />}
                          {type === 'series' && <Tv className="w-5 h-5" />}
                        </div>
                        <span className="capitalize font-bold text-sm tracking-wide">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Language Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Subtitle Language</label>
                  <div className="flex gap-4">
                    {[
                      { code: 'eng', label: 'English' },
                      { code: 'mal', label: 'Malayalam' }
                    ].map((lang) => (
                      <label key={lang.code} className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${
                        uploadForm.language === lang.code
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-400'
                      }`}>
                        <input
                          type="radio"
                          name="language"
                          className="hidden"
                          checked={uploadForm.language === lang.code}
                          onChange={() => setUploadForm({ ...uploadForm, language: lang.code })}
                        />
                        <Globe className="w-4 h-4" />
                        <span className="capitalize font-medium">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* IMDB ID Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">IMDB ID (or URL)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={uploadForm.imdbId}
                      onChange={handleImdbChange}
                      placeholder="Paste URL (e.g. https://imdb.com/title/tt4574334/) or ID"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    {isMetadataLoading && (
                       <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                       </div>
                    )}
                  </div>

                  {/* Metadata Preview */}
                  {currentMetadata && (
                    <div className="mt-4 flex gap-4 p-4 bg-slate-900/80 rounded-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      {currentMetadata.poster_path ? (
                        <img 
                          src={currentMetadata.poster_path} 
                          alt="Poster" 
                          className="w-20 h-28 object-cover rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-28 bg-slate-800 rounded-lg flex items-center justify-center">
                           <Film className="w-8 h-8 text-slate-700" />
                        </div>
                      )}
                      <div className="flex-1 py-1">
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">{currentMetadata.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{currentMetadata.overview}</p>
                        {currentMetadata.release_date && (
                           <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-bold">
                             {currentMetadata.release_date.split('-')[0]}
                           </span>
                        )}
                      </div>
                    </div>
                  )}

                  {!uploadForm.imdbId && stagedFiles.length > 0 && (
                    <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Required to enable upload
                    </p>
                  )}
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Subtitle Files, Zips, or Folders
                  </label>

                  {/* File Pickers */}
                  <div className={`relative group mb-4 ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Hidden Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".srt,.vtt,.sub,.zip,.ass,application/zip,application/x-zip-compressed,multipart/x-zip"
                      onChange={handleFileSelection}
                      className="hidden"
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleFileSelection}
                      className="hidden"
                    />

                    {/* Drop Zone UI */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-[2rem] hover:bg-slate-900 hover:border-indigo-500/50 transition-all cursor-pointer p-6"
                      onClick={(e) => {
                        // If user clicks the background box, default to file picker
                        if (e.target === e.currentTarget) fileInputRef.current?.click();
                      }}
                    >
                       <div className="text-center pointer-events-none w-full">
                          {isExtracting ? (
                            <div className="flex flex-col items-center">
                              <Loader className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                              <p className="text-sm text-indigo-300">Processing Files...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex items-center gap-4 pointer-events-auto">
                                {/* Select Files Button */}
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-sm text-slate-300 transition-all"
                                >
                                  <Upload className="w-4 h-4" />
                                  <span>Select Files</span>
                                </button>

                                <span className="text-slate-500 text-xs font-medium">OR</span>

                                {/* Select Folder Button */}
                                <button
                                  type="button"
                                  onClick={() => folderInputRef.current?.click()}
                                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-sm text-slate-300 transition-all"
                                >
                                  <FolderInput className="w-4 h-4" />
                                  <span>Select Folder</span>
                                </button>
                              </div>
                              <p className="text-xs text-slate-500 mt-2">
                                Drag and Drop files or zips here
                              </p>
                              <p className="text-[10px] text-slate-600">
                                {stagedFiles.length > 0 ? `${stagedFiles.length} files selected` : 'Supports multiple files, zips, and folders'}
                              </p>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>

                  {/* Extraction Loading Bar */}
                  {isExtracting && (
                    <div className="mb-4 bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${extractionProgress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Staged Files List */}
                  {stagedFiles.length > 0 && (
                    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Files to Upload ({stagedFiles.length})
                        </span>
                        <button
                          type="button"
                          onClick={clearStagedFiles}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <ul className="max-h-60 overflow-y-auto divide-y divide-slate-800">
                        {stagedFiles.map((file, idx) => (
                          <li key={idx} className="flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                              {file.isFromZip ? (
                                <Archive className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}

                              {/* Editable Filename */}
                              {file.isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={file.tempName}
                                  onChange={(e) => updateTempName(idx, e.target.value)}
                                  onBlur={() => saveFileName(idx)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveFileName(idx)}
                                  className="bg-slate-950 text-white text-sm px-2 py-1 rounded border border-indigo-500 focus:outline-none w-full"
                                />
                              ) : (
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm text-slate-200 truncate">{file.name}</span>
                                  <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-2">
                                    {(file.size / 1024).toFixed(0)} KB
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => file.isEditing ? saveFileName(idx) : toggleEditFile(idx)}
                                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Rename File"
                              >
                                {file.isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                              </button>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => removeStagedFile(idx)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Remove File"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    disabled={stagedFiles.length === 0 || !uploadForm.imdbId || isUploading || isExtracting}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                      stagedFiles.length === 0 || !uploadForm.imdbId || isUploading || isExtracting
                        ? 'bg-slate-700 cursor-not-allowed text-slate-500'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 active:scale-[0.98]'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing {stagedFiles.length} file(s)...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload {stagedFiles.length > 0 ? `${stagedFiles.length} Subtitles` : 'Subtitle'}</span>
                      </>
                    )}
                  </button>
                </div>

                {uploadSuccess && (
                  <div className="text-emerald-400 text-center text-sm font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Success! All files added to library.
                  </div>
                )}

                {uploadError && (
                  <div className="text-red-400 text-center text-sm font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  {uploadError}
                  </div>
                )}

              </form>
   
        {currentView === 'upload' ? (
          /* UPLOAD PAGE */
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-black/5'} rounded-[3rem] border p-8 md:p-12 shadow-2xl`}>
              <form onSubmit={handleUploadSubmit} className="space-y-10">

                {/* Content Type Selector */}
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-5 ml-2`}>Content Type</label>
                  <div className="grid grid-cols-2 gap-6">
                    {['movie', 'series'].map((type) => (
                      <label key={type} className={`cursor-pointer border-2 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                        uploadForm.type === type
                          ? `${a.main} ${a.border} text-white shadow-2xl ${a.shadow}`
                          : `${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`
                      }`}>
                        <input
                          type="radio"
                          name="contentType"
                          className="hidden"
                          checked={uploadForm.type === type}
                          onChange={() => setUploadForm({ ...uploadForm, type: type })}
                        />
                        <div className={`p-3 rounded-2xl transition-transform ${uploadForm.type === type ? 'bg-white/20 scale-110' : `${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`}`}>
                          {type === 'movie' && <Film className="w-6 h-6" />}
                          {type === 'series' && <Tv className="w-6 h-6" />}
                        </div>
                        <span className="capitalize font-black text-sm tracking-wide">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Language Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-5 ml-2`}>Subtitle Language</label>
                    <div className="flex gap-4">
                      {[
                        { code: 'eng', label: 'English' },
                        { code: 'mal', label: 'Malayalam' }
                      ].map((lang) => (
                        <label key={lang.code} className={`flex-1 cursor-pointer border-2 rounded-2xl p-4 flex items-center justify-center gap-3 transition-all ${
                          uploadForm.language === lang.code
                            ? `${a.main} ${a.border} text-white shadow-lg`
                            : `${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`
                        }`}>
                          <input
                            type="radio"
                            name="language"
                            className="hidden"
                            checked={uploadForm.language === lang.code}
                            onChange={() => setUploadForm({ ...uploadForm, language: lang.code })}
                          />
                          <Globe className="w-4 h-4" />
                          <span className="capitalize font-black text-xs">{lang.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* IMDB ID Input */}
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-5 ml-2`}>IMDB ID (or URL)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={uploadForm.imdbId}
                        onChange={handleImdbChange}
                        placeholder="tt1234567 or URL"
                        className={`w-full ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border-2 rounded-2xl py-4 px-6 placeholder-slate-600 focus:outline-none focus:ring-4 ${a.ring}/10 font-mono text-sm`}
                      />
                      {isMetadataLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <RefreshCw className={`w-5 h-5 ${a.text} animate-spin`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata Preview */}
                {currentMetadata && (
                  <div className={`flex gap-8 p-6 ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'} border-2 rounded-[2rem] animate-in fade-in zoom-in-95 duration-500`}>
                    {currentMetadata.poster_path ? (
                      <img 
                        src={currentMetadata.poster_path} 
                        alt="Poster" 
                        className="w-32 h-48 object-cover rounded-2xl shadow-2xl ring-4 ring-white/5 flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-32 h-48 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-inner'} rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-800 flex-shrink-0`}>
                          <Clapperboard className="w-10 h-10 text-slate-800" />
                      </div>
                    )}
                    <div className="flex-1 py-2 flex flex-col justify-center">
                      <h4 className="font-black text-white text-3xl leading-none mb-3 tracking-tighter">{currentMetadata.title}</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} line-clamp-3 leading-relaxed mb-4`}>{currentMetadata.overview}</p>
                      {currentMetadata.release_date && (
                          <div className="flex">
                            <span className={`px-3 py-1 ${a.main} text-white rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                              {currentMetadata.release_date.split('-')[0]}
                            </span>
                          </div>
                      )}
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-5 ml-2`}>
                    Subtitle Files & Packages
                  </label>

                  <div className={`relative group mb-8 ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input ref={fileInputRef} type="file" multiple accept=".srt,.vtt,.sub,.zip,.ass" onChange={handleFileSelection} className="hidden" />
                    <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFileSelection} className="hidden" />

                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center w-full min-h-[200px] border-4 border-dashed ${theme === 'dark' ? 'border-slate-800 bg-slate-950/30' : 'border-slate-100 bg-slate-50/30'} rounded-[3rem] hover:border-indigo-500/50 hover:bg-slate-900/10 transition-all cursor-pointer p-8`}
                      onClick={(e) => { if (e.target === e.currentTarget) fileInputRef.current?.click(); }}
                    >
                        {isExtracting ? (
                          <div className="flex flex-col items-center gap-4">
                            <RefreshCw className={`w-10 h-10 ${a.text} animate-spin`} />
                            <p className="font-black text-indigo-400 uppercase tracking-widest text-xs">Extracting content...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-6 text-center">
                            <div className="flex items-center gap-4 pointer-events-auto">
                              <button type="button" onClick={() => fileInputRef.current?.click()} className={`${a.main} ${a.hover} text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl ${a.shadow} transition-all active:scale-95`}>Select Files</button>
                              <span className="text-slate-600 font-black text-[10px] uppercase">or</span>
                              <button type="button" onClick={() => folderInputRef.current?.click()} className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'} hover:bg-slate-700 px-6 py-3 rounded-2xl text-xs font-black text-slate-400 transition-all active:scale-95 border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>Select Folder</button>
                            </div>
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                              {stagedFiles.length > 0 ? `${stagedFiles.length} files staged` : 'Drag and drop zips, folders, or srt files'}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Staged Files List */}
                  {stagedFiles.length > 0 && (
                    <div className={`${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} rounded-3xl border overflow-hidden animate-in slide-in-from-top-4 duration-500`}>
                      <div className={`px-6 py-4 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white'} border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex justify-between items-center`}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staged Files ({stagedFiles.length})</span>
                        <button type="button" onClick={clearStagedFiles} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">Clear All</button>
                      </div>
                      <ul className="max-h-64 overflow-y-auto divide-y divide-slate-800/20 custom-scrollbar">
                        {stagedFiles.map((file, idx) => (
                          <li key={idx} className="flex items-center justify-between p-4 hover:bg-indigo-500/5 transition-colors group">
                            <div className="flex items-center gap-4 min-w-0 mr-4">
                              <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                                 {file.isFromZip ? <Archive className="w-4 h-4 text-indigo-400" /> : <FileText className="w-4 h-4 text-slate-500" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                 {file.isEditing ? (
                                   <input type="text" autoFocus value={file.tempName} onChange={(e) => updateTempName(idx, e.target.value)} onBlur={() => saveFileName(idx)} onKeyDown={(e) => e.key === 'Enter' && saveFileName(idx)} className="bg-slate-900 text-white text-xs px-2 py-1 rounded border border-indigo-500 outline-none" />
                                 ) : (
                                   <span className="text-sm font-bold truncate text-slate-300 group-hover:text-white transition-colors">{file.name}</span>
                                 )}
                                 <span className="text-[9px] font-black text-slate-600 uppercase">{(file.size / 1024).toFixed(0)} KB</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                               <button type="button" onClick={() => file.isEditing ? saveFileName(idx) : toggleEditFile(idx)} className="p-2 text-slate-600 hover:text-indigo-400 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                               <button type="button" onClick={() => removeStagedFile(idx)} className="p-2 text-slate-600 hover:text-red-400 transition-all"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={stagedFiles.length === 0 || !uploadForm.imdbId || isUploading || isExtracting}
                  className={`w-full py-6 rounded-3xl font-black text-lg text-white shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    stagedFiles.length === 0 || !uploadForm.imdbId || isUploading || isExtracting
                      ? 'bg-slate-800 cursor-not-allowed text-slate-600 border border-slate-700'
                      : `${a.main} ${a.hover} ${a.shadow} active:scale-95`
                  }`}
                >
                  {isUploading ? (
                    <><RefreshCw className="w-6 h-6 animate-spin" /><span>Syncing to Database...</span></>
                  ) : (
                    <><Upload className="w-6 h-6" /><span>Upload {stagedFiles.length} Subtitles</span></>
                  )}
                </button>

                {uploadSuccess && (
                  <div className="text-emerald-400 text-center text-xs font-black uppercase tracking-widest bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 animate-in zoom-in duration-500">
                    Done! Everything added to your stream library.
                  </div>
                )}
                {uploadError && (
                  <div className="text-red-400 text-center text-xs font-black uppercase tracking-widest bg-red-500/10 p-5 rounded-3xl border border-red-500/20">
                    {uploadError}
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : currentView === 'logs' ? (
          /* LOGS PAGE */
          <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-5 duration-700 px-2 lg:px-0">
             <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' : 'bg-white border-slate-100 shadow-2xl shadow-black/5'} rounded-[3rem] border overflow-hidden`}>
               <div className={`px-8 py-6 ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50/50'} border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'} flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                     <div className={`${a.main} p-3 rounded-2xl shadow-lg ${a.shadow}`}>
                        <Shield className="w-5 h-5 text-white" />
                     </div>
                     <h3 className="text-xl font-black tracking-tight">System Traffic</h3>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active</span>
                  </div>
               </div>
               <div className={`p-8 h-[650px] overflow-y-auto font-mono text-[13px] space-y-3 custom-scrollbar ${theme === 'dark' ? 'bg-slate-950/20' : 'bg-white'}`}>
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className={`flex gap-6 p-4 rounded-2xl border ${theme === 'dark' ? 'border-slate-800/40 bg-slate-900/10' : 'border-slate-100 bg-slate-50/10'} hover:scale-[1.01] transition-all duration-300`}>
                       <span className="text-slate-600 font-bold shrink-0">{log.ts}</span>
                       <span className={`${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} break-all font-medium leading-relaxed`}>{log.message}</span>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 grayscale saturate-0 text-center">
                       <RefreshCw className={`w-16 h-16 mb-8 ${a.text} animate-spin-slow`} />
                       <h4 className="font-black text-3xl uppercase tracking-tighter mb-2">Awaiting Signals</h4>
                       <p className="text-xs font-bold uppercase tracking-widest">Connect your stremio addon to see live data</p>
                    </div>
                  )}
               </div>
             </div>
          </div>
        ) : (
          /* LIBRARY PAGE (Enhanced, Grouped, Responsive) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {Object.keys(
              filteredSubtitles.reduce((acc, sub) => {
                if (!acc[sub.imdbId]) acc[sub.imdbId] = [];
                acc[sub.imdbId].push(sub);
                return acc;
              }, {})
            ).length > 0 ? (
              Object.entries(
                filteredSubtitles.reduce((acc, sub) => {
                  if (!acc[sub.imdbId]) acc[sub.imdbId] = [];
                  acc[sub.imdbId].push(sub);
                  return acc;
                }, {})
              ).map(([imdbId, groupSubtitles]) => {
                const firstSub = groupSubtitles[0];
                const metadata = firstSub.metadata;
                const mediaTitle = metadata?.title || imdbId;
                
                return (
                  <div key={imdbId} className={`group ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-2xl shadow-black/5'} rounded-[3rem] border hover:border-indigo-500/30 transition-all duration-500 flex flex-col h-full overflow-hidden relative group`}>
                    
                    {/* Media Header (Poster & Background) */}
                    <div className="relative h-64 overflow-hidden">
                       {metadata?.poster_path ? (
                          <>
                             <img src={metadata.poster_path} alt="Backdrop" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-150 group-hover:scale-110 transition-transform duration-1000" />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                          </>
                       ) : (
                          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`} />
                       )}
                       
                       <div className="absolute bottom-0 left-0 p-8 flex gap-6 items-end w-full">
                          {metadata?.poster_path ? (
                             <img src={metadata.poster_path} alt="Poster" className="w-28 h-40 object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-2 ring-white/10 z-10 group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                             <div className={`w-24 h-36 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'} rounded-2xl flex items-center justify-center border-2 border-dashed ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} z-10`}>
                                <Clapperboard className="w-10 h-10 text-slate-700 opacity-20" />
                             </div>
                          )}
                          <div className="flex-1 min-w-0 z-10 mb-2">
                             <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${firstSub.type === 'movie' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>{firstSub.type}</span>
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Synced</span>
                             </div>
                             <h3 className={`font-black tracking-tighter leading-[0.9] text-white ${mediaTitle.length > 20 ? 'text-xl' : 'text-3xl'} truncate`} title={mediaTitle}>
                                {mediaTitle}
                             </h3>
                             <div className="flex items-center gap-3 mt-4">
                                <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'} font-black`}>{imdbId}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Subtitles List (Scrollable Area) */}
                    <div className="p-6 flex-grow">
                       <p className={`px-4 text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} mb-5`}>Linked Files • {groupSubtitles.length}</p>
                       <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                          {groupSubtitles.sort((a,b) => {
                             if (a.type === 'movie') return -1;
                             return (a.season * 1000 + a.episode) - (b.season * 1000 + b.episode);
                          }).map((sub) => (
                             <div key={sub.id} className={`flex items-center justify-between p-4 rounded-[1.5rem] ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-slate-100'} border hover:border-indigo-500/30 transition-all duration-300 group/item`}>
                                <div className="flex flex-col min-w-0 flex-1 mr-4">
                                   <div className="flex items-center gap-2 mb-2">
                                      {sub.type !== 'movie' && (
                                         <span className={`text-[10px] font-black ${a.text} bg-indigo-500/10 px-2 py-0.5 rounded-lg`}>S{String(sub.season).padStart(2,'0')}E{String(sub.episode).padStart(2,'0')}</span>
                                      )}
                                      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-lg uppercase">{sub.language || 'MAL'}</span>
                                   </div>
                                   <p className={`text-[11px] font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} truncate-2-lines`} title={sub.fileName}>{sub.fileName}</p>
                                </div>
                                <button
                                   onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}
                                   className="p-3 rounded-2xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all sm:opacity-0 group-hover/item:opacity-100 ring-4 ring-transparent hover:ring-red-500/5 shadow-inner"
                                   title="Remove"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Footer / Meta */}
                    <div className={`px-10 py-6 ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-50/50'} border-t ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'} flex items-center justify-between ring-white/5`}>
                       <div className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 text-slate-700" />
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Added {firstSub.date}</span>
                       </div>
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 group-hover:scale-110 transition-transform" />)}
                       </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-40 text-center animate-in fade-in duration-1000">
                 <div className={`w-32 h-32 rounded-[3.5rem] ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center mx-auto mb-10 border-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} shadow-2xl relative overflow-hidden`}>
                    <Archive className={`w-12 h-12 ${theme === 'dark' ? 'text-slate-800' : 'text-slate-200'}`} />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                 </div>
                 <h3 className="text-4xl font-black mb-5 tracking-tighter">Library is Empty</h3>
                 <p className={`text-sm ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} max-w-sm mx-auto font-bold uppercase tracking-widest leading-loose`}>
                    {searchQuery ? `Zero matches for "${searchQuery}"` : "Your cinema collection is waiting for its first subtitle pack."}
                 </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  </div>
);
}
