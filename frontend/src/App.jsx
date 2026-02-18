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
  Globe
} from 'lucide-react';

export default function App() {
  // --- State ---
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  const [subtitles, setSubtitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Login Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    imdbId: '',
    type: 'series',
    season: '',
    episode: '',
    language: 'eng' // Default to English (ISO 639-2)
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

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // --- Check Auth on Load ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ username: 'Admin' });
      fetchSubtitles();
    }
  }, []);

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
          language: sub.language
        }));
        setSubtitles(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch subtitles", err);
    } finally {
      setIsRefreshing(false);
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
      alert('Manifest URL copied to clipboard: ' + url);
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
    const query = searchQuery.toLowerCase();
    return (
      (sub.fileName && sub.fileName.toLowerCase().includes(query)) ||
      (sub.imdbId && sub.imdbId.toLowerCase().includes(query)) ||
      (sub.type && sub.type.toLowerCase().includes(query)) ||
      (sub.language && sub.language.toLowerCase().includes(query))
    );
  });

  // --- Render ---

  if (!user) {
    // Login Screen (Unchanged structure)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Film className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">SubStream Admin</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="admin"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {loginError && (
                <div className="text-red-400 text-sm text-center">{loginError}</div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50"
              >
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-800 border-r border-slate-700 flex-shrink-0">
        <div className="p-6 flex items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500 p-2 rounded-lg">
                <Film className="w-5 h-5 text-white" />
             </div>
             <h1 className="font-bold text-lg">SubStream</h1>
          </div>
          <button
             onClick={copyManifestUrl}
             title="Copy Manifest URL"
             className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
             <Link className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setCurrentView('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Subtitle</span>
          </button>
          <button
            onClick={() => { setCurrentView('list'); fetchSubtitles(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Current Library</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 px-4 py-2 text-sm">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white whitespace-nowrap">
                {currentView === 'upload' ? 'Upload New Subtitle' : 'Subtitle Library'}
            </h2>
            {currentView === 'list' && (
                <button
                  onClick={fetchSubtitles}
                  disabled={isRefreshing}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
                  title="Refresh Library"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            )}
          </div>

          {/* Search Bar */}
          {currentView === 'list' && (
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Search by name, ID, language..."
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
                    {['movie', 'series', 'anime'].map((type) => (
                      <label key={type} className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${
                        uploadForm.type === type
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-400'
                      }`}>
                        <input
                          type="radio"
                          name="contentType"
                          className="hidden"
                          checked={uploadForm.type === type}
                          onChange={() => setUploadForm({ ...uploadForm, type: type })}
                        />
                        {type === 'movie' && <Film className="w-4 h-4" />}
                        {type === 'series' && <Tv className="w-4 h-4" />}
                        {type === 'anime' && <Clapperboard className="w-4 h-4" />}
                        <span className="capitalize font-medium">{type}</span>
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
                  <input
                    type="text"
                    value={uploadForm.imdbId}
                    onChange={handleImdbChange}
                    placeholder="Paste URL (e.g. https://imdb.com/title/tt4574334/) or ID"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
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
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 bg-slate-900/50 rounded-xl hover:bg-slate-900 hover:border-indigo-400 transition-all cursor-pointer"
                      onClick={(e) => {
                        // If user clicks the background box, default to file picker
                        if (e.target === e.currentTarget) fileInputRef.current?.click();
                      }}
                    >
                       <div className="text-center pointer-events-none">
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
            </div>
          </div>
        ) : (
          /* CURRENT LIBRARY PAGE */
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase">IMDB ID</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Lang</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Details</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase">File Name</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredSubtitles.length > 0 ? (
                    filteredSubtitles.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-700/30">
                        <td className="p-4 font-mono text-indigo-300 text-sm">{sub.imdbId}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            sub.type === 'movie' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            sub.type === 'series' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-pink-500/10 text-pink-400 border-pink-500/20'
                          }`}>
                            {sub.type === 'movie' && <Film className="w-3 h-3" />}
                            {sub.type === 'series' && <Tv className="w-3 h-3" />}
                            {sub.type === 'anime' && <Clapperboard className="w-3 h-3" />}
                            <span className="capitalize">{sub.type}</span>
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 text-sm uppercase">{sub.language || 'ENG'}</td>
                        <td className="p-4 text-slate-300 text-sm">
                          {sub.type !== 'movie' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-slate-900 border border-slate-600 text-indigo-300 shadow-sm">
                              S{sub.season} <span className="mx-1 text-slate-600">|</span> E{sub.episode}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-200 text-sm max-w-xs truncate" title={sub.fileName}>
                          {sub.fileName}
                        </td>
                        <td className="p-4 text-slate-400 text-sm">{sub.date}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg group"
                            title="Delete Subtitle"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-500">
                        {searchQuery ? 'No matching subtitles found.' : 'No subtitles found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
