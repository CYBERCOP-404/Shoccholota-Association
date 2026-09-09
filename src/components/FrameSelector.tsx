import React, { useRef } from 'react';
import { FramePreset, Language } from '../types';
import { Frame, Upload, Check, FileCode, Sparkles } from 'lucide-react';

interface FrameSelectorProps {
  frames: FramePreset[];
  selectedFrameId: string;
  onSelectFrame: (frameId: string) => void;
  onCustomSvgUpload: (svgContent: string, fileName: string) => void;
  language: Language;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({
  frames,
  selectedFrameId,
  onSelectFrame,
  onCustomSvgUpload,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSvgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক .svg ফাইল নির্বাচন করুন।'
          : 'Please select a valid .svg file.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onCustomSvgUpload(content, file.name);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (e.target) e.target.value = '';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Frame className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-base sm:text-lg text-slate-100">
            {language === 'bn' ? 'ফ্রেমের ডিজাইন সিলেক্ট করুন' : 'Select Frame Design'}
          </h3>
        </div>

        {/* Upload Custom SVG File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all cursor-pointer shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'নিজের SVG ফাইল দিন' : 'Upload Own SVG'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={handleSvgFileChange}
        />
      </div>

      {/* Frame Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {frames.map((frame) => {
          const isSelected = frame.id === selectedFrameId;
          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame.id)}
              className={`relative group rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-500/80 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-2.5 flex items-center justify-center p-1">
                  {/* SVG Thumbnail Preview */}
                  <div
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: frame.svgContent }}
                  />

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-sky-500 text-white rounded-full p-1 shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {frame.isCustom && (
                    <div className="absolute bottom-2 left-2 bg-purple-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                      <FileCode className="w-3 h-3" />
                      <span>CUSTOM</span>
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-xs sm:text-sm text-slate-100 line-clamp-1">
                  {language === 'bn' ? frame.nameBn : frame.nameEn}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {language === 'bn' ? frame.descriptionBn : frame.descriptionEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
