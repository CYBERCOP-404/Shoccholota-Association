import React, { useState } from 'react';
import { PhotoTransform, PhotoFilter, Language } from '../types';
import {
  RotateCcw,
  Sliders,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Sun,
  Contrast as ContrastIcon,
  Sparkles,
  Layers,
  Move,
  RotateCw
} from 'lucide-react';

interface PhotoControlsProps {
  transform: PhotoTransform;
  filter: PhotoFilter;
  onTransformChange: (newTransform: PhotoTransform) => void;
  onFilterChange: (newFilter: PhotoFilter) => void;
  onReset: () => void;
  language: Language;
}

export const PhotoControls: React.FC<PhotoControlsProps> = ({
  transform,
  filter,
  onTransformChange,
  onFilterChange,
  onReset,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'filter'>('adjust');

  const isPhotoOnTop = transform.layerOrder === 'top';

  const handleCenterFit = () => {
    onTransformChange({
      ...transform,
      x: 0,
      y: 0,
      scale: 1.0,
      rotation: 0,
      flipX: false,
      flipY: false,
    });
  };

  const handleAutoFitCutout = () => {
    onTransformChange({
      x: 0,
      y: 0,
      scale: 1.15,
      rotation: 0,
      flipX: false,
      flipY: false,
      layerOrder: 'bottom',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-slate-200">
      {/* Control Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'adjust'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Position & Controls</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('filter')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'filter'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Color Filters</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition-colors"
          title="Reset photo controls"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {activeTab === 'adjust' ? (
        <div className="space-y-4">
          {/* Layer Position & Auto-Fit Buttons */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={handleAutoFitCutout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-emerald-400 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Auto-Fit Cutout</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTransformChange({
                  ...transform,
                  layerOrder: isPhotoOnTop ? 'bottom' : 'top',
                })
              }
              className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 border ${
                isPhotoOnTop ? 'border-amber-500 text-amber-400' : 'border-slate-800 text-slate-300'
              } rounded-xl text-xs font-semibold transition-colors`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Layer: {isPhotoOnTop ? 'On Top' : 'Inside Cutout'}</span>
            </button>
          </div>

          {/* Zoom / Scale Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span>Zoom / Scale</span>
              <span className="font-mono text-sky-400">{Math.round(transform.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.02"
              value={transform.scale}
              onChange={(e) =>
                onTransformChange({ ...transform, scale: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Position X Offset */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span>Horizontal Offset (X)</span>
              <span className="font-mono text-slate-400">{Math.round(transform.x)}%</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="1"
              value={transform.x}
              onChange={(e) =>
                onTransformChange({ ...transform, x: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Position Y Offset */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span>Vertical Offset (Y)</span>
              <span className="font-mono text-slate-400">{Math.round(transform.y)}%</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="1"
              value={transform.y}
              onChange={(e) =>
                onTransformChange({ ...transform, y: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Rotation Angle Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span>Rotation Angle</span>
              <span className="font-mono text-slate-400">{transform.rotation}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={transform.rotation}
              onChange={(e) =>
                onTransformChange({ ...transform, rotation: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-1 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCenterFit}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Center Fit</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTransformChange({ ...transform, flipX: !transform.flipX })
              }
              className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 hover:bg-slate-800 border ${
                transform.flipX ? 'border-sky-500 text-sky-400' : 'border-slate-800 text-slate-200'
              } rounded-xl text-xs font-medium transition-colors`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip H</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTransformChange({ ...transform, flipY: !transform.flipY })
              }
              className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 hover:bg-slate-800 border ${
                transform.flipY ? 'border-sky-500 text-sky-400' : 'border-slate-800 text-slate-200'
              } rounded-xl text-xs font-medium transition-colors`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip V</span>
            </button>
          </div>
        </div>
      ) : (
        /* Color Filters Tab */
        <div className="space-y-4">
          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Brightness
              </span>
              <span className="font-mono text-slate-400">{filter.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="1"
              value={filter.brightness}
              onChange={(e) =>
                onFilterChange({ ...filter, brightness: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span className="flex items-center gap-1">
                <ContrastIcon className="w-3.5 h-3.5 text-sky-400" />
                Contrast
              </span>
              <span className="font-mono text-slate-400">{filter.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="1"
              value={filter.contrast}
              onChange={(e) =>
                onFilterChange({ ...filter, contrast: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span>Saturation</span>
              <span className="font-mono text-slate-400">{filter.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="2"
              value={filter.saturation}
              onChange={(e) =>
                onFilterChange({ ...filter, saturation: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Grayscale */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
              <span>Grayscale</span>
              <span className="font-mono text-slate-400">{filter.grayscale}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filter.grayscale}
              onChange={(e) =>
                onFilterChange({ ...filter, grayscale: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
