import React, { useState, useEffect } from 'react';
import {
  Lock,
  Key,
  Upload,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  Layout,
  Wand2,
  RefreshCw,
  Table,
  Download,
  Trash2,
  FileArchive,
  Database,
  Search,
  ExternalLink
} from 'lucide-react';
import JSZip from 'jszip';
import { removeWhiteColorFromImage } from '../utils/whiteColorRemover';
import {
  UserUploadRecord,
  listenToUserUploads,
  deleteUserUploadRecord,
  saveAppSettingsToFirebase
} from '../lib/firebase';

interface AdminSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBrandIcon: string | null;
  onUpdateBrandIcon: (iconUrl: string | null) => void;
  currentFrameBg: string | null;
  onUpdateFrameBg: (bgUrl: string | null) => void;
}

export const AdminSetupModal: React.FC<AdminSetupModalProps> = ({
  isOpen,
  onClose,
  currentBrandIcon,
  onUpdateBrandIcon,
  currentFrameBg,
  onUpdateFrameBg,
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('admin_pin') || '1234');
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [whiteThreshold, setWhiteThreshold] = useState(235);

  // Active Tab: 'branding' | 'sheet'
  const [activeTab, setActiveTab] = useState<'branding' | 'sheet'>('sheet');

  // Firebase Upload Records State
  const [uploadsList, setUploadsList] = useState<UserUploadRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Listen to Firebase Realtime Database User Uploads
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = listenToUserUploads((records) => {
      setUploadsList(records);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPin) {
      setIsAuthenticated(true);
      setErrorMessage('');
      setPassword('');
    } else {
      setErrorMessage('Incorrect PIN code. Default PIN is 1234');
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const iconData = event.target.result as string;
        onUpdateBrandIcon(iconData);
        await saveAppSettingsToFirebase({ brandIcon: iconData });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFrameBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG)');
      return;
    }

    setIsProcessingBg(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawDataUrl = event.target.result as string;
        // Scan & remove white area automatically so uploaded photo displays inside white space
        const transparentFrame = await removeWhiteColorFromImage(rawDataUrl, whiteThreshold);
        onUpdateFrameBg(transparentFrame);
        await saveAppSettingsToFirebase({ frameBg: transparentFrame });
        setIsProcessingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReScanWhite = async () => {
    if (!currentFrameBg) return;
    setIsProcessingBg(true);
    const processed = await removeWhiteColorFromImage(currentFrameBg, whiteThreshold);
    onUpdateFrameBg(processed);
    await saveAppSettingsToFirebase({ frameBg: processed });
    setIsProcessingBg(false);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.trim().length < 4) {
      alert('PIN must be at least 4 characters long.');
      return;
    }
    const trimmed = newPin.trim();
    localStorage.setItem('admin_pin', trimmed);
    setAdminPin(trimmed);
    await saveAppSettingsToFirebase({ adminPin: trimmed });
    setNewPin('');
    setPinSuccessMsg('Admin PIN updated successfully!');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  // Delete an upload record
  const handleDeleteUpload = async (id: string) => {
    if (confirm('Are you sure you want to delete this upload from Realtime Database?')) {
      await deleteUserUploadRecord(id);
    }
  };

  // Bulk ZIP Download for all images
  const handleDownloadAllZip = async () => {
    if (uploadsList.length === 0) {
      alert('No user uploaded photos found in database.');
      return;
    }

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder('Shoccholota_User_Photos');

      uploadsList.forEach((item, index) => {
        // Choose framed image or original image
        const imgData = item.framedImage || item.originalImage;
        if (imgData) {
          // Extract base64 content
          const base64Content = imgData.split(',')[1] || imgData;
          const cleanName = item.fileName ? item.fileName.replace(/\s+/g, '_') : `Photo_${index + 1}.png`;
          folder?.file(cleanName, base64Content, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Shoccholota_All_User_Photos_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
      alert('Failed to compress ZIP archive. Please try again.');
    } finally {
      setIsZipping(false);
    }
  };

  const filteredUploads = uploadsList.filter((item) =>
    (item.fileName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.fileType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.formattedTime || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative text-slate-100 my-4 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!isAuthenticated ? (
          /* Password Form */
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/10">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-1">
              Protected Admin Setup
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              Enter security PIN code to access Realtime Database photos sheet & site branding.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 text-left mb-1.5">
                  Security PIN Code
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter PIN (Default: 1234)"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono tracking-widest text-center"
                    autoFocus
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                </div>
                {errorMessage && (
                  <p className="text-xs text-rose-400 mt-2 font-medium">
                    {errorMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                Unlock Admin Controls
              </button>

              <div className="pt-2 text-[11px] text-slate-500">
                Default PIN: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-sky-400 font-mono">1234</code>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Setup Controls */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Title & Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">
                    Shoccholota Admin Center
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Database className="w-3 h-3 text-sky-400" />
                    <span>Connected to Firebase Realtime Database</span>
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('sheet')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'sheet'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>User Uploads Sheet</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-white font-mono">
                    {uploadsList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'branding'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Branding & Frame</span>
                </button>
              </div>
            </div>

            {/* TAB 1: User Uploads Sheet Table View & ZIP Download */}
            {activeTab === 'sheet' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Search & Bulk ZIP Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search photo name, type or date..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isZipping || uploadsList.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>Download All as ZIP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Realtime Database Sheet Table */}
                <div className="flex-1 overflow-auto bg-slate-950 border border-slate-800 rounded-2xl">
                  {filteredUploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Table className="w-8 h-8 mb-2 stroke-1" />
                      <p className="text-xs font-semibold">No uploads found in Realtime Database</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        User photos will automatically stream live into this sheet.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Preview</th>
                          <th className="py-2.5 px-3">File Name</th>
                          <th className="py-2.5 px-3">File Type</th>
                          <th className="py-2.5 px-3">Size / Dimensions</th>
                          <th className="py-2.5 px-3">Upload Time</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {filteredUploads.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2 px-3">
                              <div
                                onClick={() => setPreviewImage(item.framedImage || item.originalImage)}
                                className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-sky-500 transition-colors relative group"
                              >
                                <img
                                  src={item.framedImage || item.originalImage}
                                  alt={item.fileName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              </div>
                            </td>

                            <td className="py-2 px-3 font-semibold text-white max-w-[150px] truncate">
                              {item.fileName}
                            </td>

                            <td className="py-2 px-3 font-mono text-[11px] text-sky-400">
                              <span className="bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                {item.fileType || 'image/png'}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                              {item.fileSize || '1200 x 1200'}
                            </td>

                            <td className="py-2 px-3 text-slate-400 text-[11px]">
                              {item.formattedTime || new Date(item.timestamp).toLocaleString()}
                            </td>

                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={item.framedImage || item.originalImage}
                                  download={item.fileName || 'Shoccholota.png'}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-400 border border-slate-800 transition-colors"
                                  title="Download Single Image"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUpload(item.id)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Branding & Middle Box Frame Setup */}
            {activeTab === 'branding' && (
              <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
                {/* 1. Middle Picture Card Fixed Frame / Background Setup */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                      <Layout className="w-4 h-4" />
                      <span>Middle Box Frame / Background</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> Auto White-Cutout Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Upload frame background image. <strong className="text-white">White color pixels will automatically be removed</strong> so uploaded photos show through inside the white area.
                  </p>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                      {currentFrameBg ? (
                        <img
                          src={currentFrameBg}
                          alt="Fixed Frame Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 border border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 text-[10px] text-center p-1">
                          No Frame
                        </div>
                      )}

                      {isProcessingBg && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center text-sky-400">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isProcessingBg ? 'Scanning & Removing White...' : 'Upload Frame Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFrameBgUpload}
                          disabled={isProcessingBg}
                          className="hidden"
                        />
                      </label>

                      {currentFrameBg && (
                        <button
                          type="button"
                          onClick={async () => {
                            onUpdateFrameBg(null);
                            await saveAppSettingsToFirebase({ frameBg: null });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Remove Background</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* White Scan Threshold Fine-tuning */}
                  {currentFrameBg && (
                    <div className="pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                        <span className="flex items-center gap-1">
                          <Wand2 className="w-3 h-3 text-sky-400" /> White Cutout Sensitivity:
                        </span>
                        <span className="font-mono text-sky-400 font-bold">{whiteThreshold}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="200"
                          max="255"
                          value={whiteThreshold}
                          onChange={(e) => setWhiteThreshold(Number(e.target.value))}
                          className="flex-1 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={handleReScanWhite}
                          disabled={isProcessingBg}
                          className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold border border-slate-700"
                        >
                          Re-scan White
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Navbar Logo Icon Setup */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1">
                    <ImageIcon className="w-4 h-4" />
                    <span>Navbar Logo / Page Icon</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Upload a custom site logo icon to display on the top-left of the navbar.
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {currentBrandIcon ? (
                        <img
                          src={currentBrandIcon}
                          alt="Brand Icon"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center text-slate-950">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer border border-slate-700">
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>Upload Custom Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconUpload}
                          className="hidden"
                        />
                      </label>

                      {currentBrandIcon && (
                        <button
                          type="button"
                          onClick={async () => {
                            onUpdateBrandIcon(null);
                            await saveAppSettingsToFirebase({ brandIcon: null });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Logo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Security PIN Change */}
                <form onSubmit={handleChangePin} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Change Admin Security PIN
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="New Security PIN"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                    >
                      Save PIN
                    </button>
                  </div>
                  {pinSuccessMsg && (
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{pinSuccessMsg}</span>
                    </p>
                  )}
                </form>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              Done & Save Changes
            </button>
          </div>
        )}

        {/* Full Image Lightbox Preview */}
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="max-w-xl max-h-[80vh] relative p-2 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
              <img
                src={previewImage}
                alt="Full Preview"
                className="w-full h-full object-contain rounded-2xl"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-slate-950/80 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
