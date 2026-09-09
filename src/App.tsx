import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MAIN_EVENT_FRAME_SVG } from './data/presetFrames';
import { PhotoTransform, PhotoFilter } from './types';
import { FrameCanvas } from './components/FrameCanvas';
import { PhotoControls } from './components/PhotoControls';
import { AdminSetupModal } from './components/AdminSetupModal';
import { downloadFramedImage, generateFramedImageCanvas } from './utils/imageExporter';
import { removeWhiteColorFromImage } from './utils/whiteColorRemover';
import {
  listenToAppSettings,
  saveUserUploadRecord,
  saveAppSettingsToFirebase
} from './lib/firebase';
import {
  Upload,
  Download,
  Sparkles,
  Lock,
  RefreshCw,
  Sliders,
  RotateCcw,
} from 'lucide-react';

const DEFAULT_TRANSFORM: PhotoTransform = {
  x: 0,
  y: 0,
  scale: 1.0,
  rotation: 0,
  flipX: false,
  flipY: false,
};

const DEFAULT_FILTER: PhotoFilter = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
};

export default function App() {
  // Brand Icon state stored in localStorage & Firebase Realtime DB
  const [brandIcon, setBrandIcon] = useState<string | null>(() => {
    return localStorage.getItem('brand_icon') || null;
  });

  // Middle Picture Box Fixed Frame Background state stored in localStorage & Firebase Realtime DB
  const [frameBg, setFrameBg] = useState<string | null>(() => {
    return localStorage.getItem('admin_frame_bg') || null;
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [userImageSrc, setUserImageSrc] = useState<string | null>(null);
  const [userFileName, setUserFileName] = useState<string>('Shoccholota.png');
  const [userFileType, setUserFileType] = useState<string>('image/png');
  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_TRANSFORM);
  const [filter, setFilter] = useState<PhotoFilter>(DEFAULT_FILTER);
  const [showAdjustments, setShowAdjustments] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadCount, setDownloadCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime Sync App Settings & Branding from Firebase Database
  useEffect(() => {
    const unsubscribe = listenToAppSettings((settings) => {
      if (settings) {
        if (settings.brandIcon !== undefined) {
          setBrandIcon(settings.brandIcon);
          if (settings.brandIcon) localStorage.setItem('brand_icon', settings.brandIcon);
        }
        if (settings.frameBg !== undefined) {
          setFrameBg(settings.frameBg);
          if (settings.frameBg) localStorage.setItem('admin_frame_bg', settings.frameBg);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Brand Icon to localStorage & Firebase
  const handleUpdateBrandIcon = async (iconUrl: string | null) => {
    setBrandIcon(iconUrl);
    if (iconUrl) {
      localStorage.setItem('brand_icon', iconUrl);
    } else {
      localStorage.removeItem('brand_icon');
    }
    await saveAppSettingsToFirebase({ brandIcon: iconUrl });
  };

  // Sync Frame Background to localStorage & Firebase
  const handleUpdateFrameBg = async (bgUrl: string | null) => {
    if (bgUrl) {
      const processedBg = await removeWhiteColorFromImage(bgUrl);
      setFrameBg(processedBg);
      localStorage.setItem('admin_frame_bg', processedBg);
      await saveAppSettingsToFirebase({ frameBg: processedBg });
    } else {
      setFrameBg(null);
      localStorage.removeItem('admin_frame_bg');
      await saveAppSettingsToFirebase({ frameBg: null });
    }
  };

  // Handle Photo File Upload (Only loads image into editor canvas)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const fName = file.name || 'Shoccholota.png';
    const fType = file.type || 'image/png';
    setUserFileName(fName);
    setUserFileType(fType);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setUserImageSrc(dataUrl);
        setTransform(DEFAULT_TRANSFORM);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Handle Drag and Drop Image (Only loads image into editor canvas)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fName = file.name || 'Shoccholota.png';
      const fType = file.type || 'image/png';
      setUserFileName(fName);
      setUserFileType(fType);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setUserImageSrc(dataUrl);
          setTransform(DEFAULT_TRANSFORM);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Ultra-HD Auto-Upgraded Download & Single Database Record
  const handleDownload = async () => {
    if (!userImageSrc) {
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      const filename = downloadCount === 0 ? 'Shoccholota.png' : `Shoccholota-${downloadCount}.png`;

      // 1. Download file locally in 2400x2400 Ultra-HD Resolution
      await downloadFramedImage(
        {
          userImageSrc,
          svgFrameContent: frameBg || MAIN_EVENT_FRAME_SVG,
          transform,
          filter,
          canvasWidth: 2400, // Upgraded Ultra-HD Resolution
          canvasHeight: 2400,
        },
        filename
      );

      // 2. Generate 2400x2400 Ultra-HD Canvas Data URL for Firebase Realtime Database
      const canvas = await generateFramedImageCanvas({
        userImageSrc,
        svgFrameContent: frameBg || MAIN_EVENT_FRAME_SVG,
        transform,
        filter,
        canvasWidth: 2400,
        canvasHeight: 2400,
      });
      const framedDataUrl = canvas.toDataURL('image/png', 1.0);

      // 3. Save ONLY ONE RECORD to Firebase Realtime Database upon successful download
      await saveUserUploadRecord({
        fileName: filename,
        fileType: userFileType || 'image/png',
        fileSize: '2400 x 2400 (Ultra HD)',
        originalImage: userImageSrc,
        framedImage: framedDataUrl,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleString(),
      });

      setDownloadCount((prev) => prev + 1);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to download image:', err);
      alert('Failed to generate Ultra HD frame image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between"
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Top 10px Slim Accent Bar */}
      <div className="h-[10px] w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500 shadow-md shadow-sky-500/20" />

      {/* Professional Navbar */}
      <nav className="w-full bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        {/* Left Side: Brand Logo Icon & Site Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 p-0.5 shadow-lg shadow-sky-500/10 flex items-center justify-center overflow-hidden group">
            {brandIcon ? (
              <img
                src={brandIcon}
                alt="Brand Icon"
                className="w-full h-full object-contain rounded-[14px]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-[14px] flex items-center justify-center text-slate-950">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
                Shoccholota Association
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              সচ্ছলতা এসোসিয়েশন একটি সমাজসেবা মূলক সংগঠন।
            </p>
          </div>
        </div>

        {/* Right Side: Admin Setup Modal Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-xs font-semibold text-slate-300 hover:text-sky-400 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Password protected setup to update brand icon & middle picture background"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Admin Setup</span>
          </button>
        </div>
      </nav>

      {/* Main Studio Center Card */}
      <main className="max-w-xl mx-auto w-full flex-1 flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          
          {/* Interactive Frame Canvas Display */}
          <div className="mb-6">
            <FrameCanvas
              userImageSrc={userImageSrc}
              svgFrameContent={MAIN_EVENT_FRAME_SVG}
              frameBackground={frameBg}
              transform={transform}
              filter={filter}
              onTransformChange={setTransform}
              onUploadClick={() => fileInputRef.current?.click()}
              language="en"
            />
          </div>

          {/* Primary Action Buttons: Upload & Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-100 font-semibold text-sm transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>{userImageSrc ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white transition-all shadow-xl shadow-sky-500/20 active:scale-98 cursor-pointer ${
                userImageSrc
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Ultra HD...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Photo</span>
                </>
              )}
            </button>
          </div>

          {/* Optional Photo Adjustments Toggle (Only when image uploaded) */}
          {userImageSrc && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustments(!showAdjustments)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {showAdjustments ? 'Hide Photo Controls' : 'Fine-tune Photo Position & Zoom'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransform(DEFAULT_TRANSFORM);
                    setFilter(DEFAULT_FILTER);
                  }}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {showAdjustments && (
                <div className="mt-3">
                  <PhotoControls
                    transform={transform}
                    filter={filter}
                    onTransformChange={setTransform}
                    onFilterChange={setFilter}
                    onReset={() => {
                      setTransform(DEFAULT_TRANSFORM);
                      setFilter(DEFAULT_FILTER);
                    }}
                    language="en"
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Password-Protected Admin Setup Modal */}
      <AdminSetupModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentBrandIcon={brandIcon}
        onUpdateBrandIcon={handleUpdateBrandIcon}
        currentFrameBg={frameBg}
        onUpdateFrameBg={handleUpdateFrameBg}
      />

      {/* Minimal English Footer */}
      <footer className="max-w-xl mx-auto w-full text-center pb-6 text-xs text-slate-500">
        © 2026 Shoccholota Association. All Rights Reserved.
        <br />
        Designed & Developed by Shoccholota Association.
      </footer>
    </div>
  );
}
