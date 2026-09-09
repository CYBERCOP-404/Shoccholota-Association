import React, { useRef, useState } from 'react';
import { PhotoTransform, PhotoFilter, Language } from '../types';
import { Upload } from 'lucide-react';

interface FrameCanvasProps {
  userImageSrc: string | null;
  svgFrameContent: string;
  frameBackground: string | null;
  transform: PhotoTransform;
  filter: PhotoFilter;
  onTransformChange: (newTransform: PhotoTransform) => void;
  onUploadClick: () => void;
  language: Language;
}

export const FrameCanvas: React.FC<FrameCanvasProps> = ({
  userImageSrc,
  svgFrameContent,
  frameBackground,
  transform,
  filter,
  onTransformChange,
  onUploadClick,
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Default to Photo BEHIND Frame Stencil when frameBackground is active
  const isPhotoOnTop = transform.layerOrder === 'top';

  // Handle Drag / Pan with Mouse & Touch on Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!userImageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    onTransformChange({
      ...transform,
      x: transform.x + dx,
      y: transform.y + dy,
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch if capture lost
      }
    }
  };

  // Handle Wheel Zoom inside Canvas
  const handleWheel = (e: React.WheelEvent) => {
    if (!userImageSrc) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.2), 4.0);
    onTransformChange({
      ...transform,
      scale: parseFloat(newScale.toFixed(2)),
    });
  };

  const filterStyle = `brightness(${filter.brightness}%) contrast(${filter.contrast}%) saturate(${filter.saturation}%) sepia(${filter.sepia}%) grayscale(${filter.grayscale}%)`;

  const renderFrameOverlay = () => {
    if (frameBackground) {
      return (
        <div className="absolute inset-0 pointer-events-none z-10 w-full h-full">
          <img
            src={frameBackground}
            alt="Fixed Frame Stencil"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return (
      <div
        className="absolute inset-0 pointer-events-none z-10 w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgFrameContent }}
      />
    );
  };

  const renderUserPhoto = (zIndexClass: string) => {
    if (!userImageSrc) return null;

    return (
      <div
        className={`absolute inset-0 flex items-center justify-center transition-transform ease-out duration-75 ${zIndexClass}`}
        style={{
          transform: `translate(${transform.x}%, ${transform.y}%) scale(${transform.scale}) rotate(${transform.rotation}deg) scaleX(${
            transform.flipX ? -1 : 1
          }) scaleY(${transform.flipY ? -1 : 1})`,
          filter: filterStyle,
        }}
      >
        <img
          src={userImageSrc}
          alt="User Upload"
          className="max-w-none w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[580px] aspect-square mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-2 sm:p-4 select-none">
      {/* Clean Frame Box Canvas without overlay design buttons */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className={`relative w-full h-full rounded-2xl overflow-hidden bg-slate-950 cursor-${
          userImageSrc ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
        } touch-none group`}
      >
        {/* Render Photo Underneath Frame Stencil (Shows through white cutout) */}
        {!isPhotoOnTop && renderUserPhoto('z-0')}

        {/* Frame Overlay / Stencil Layer */}
        {renderFrameOverlay()}

        {/* Render Photo On Top if layerOrder is 'top' */}
        {isPhotoOnTop && renderUserPhoto('z-20')}

        {/* Upload Placeholder if No Image */}
        {!userImageSrc && (
          <div
            onClick={onUploadClick}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-slate-900/70 hover:bg-slate-900/50 transition-colors cursor-pointer group/prompt"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-4 group-hover/prompt:scale-110 group-hover/prompt:bg-sky-500/20 transition-all duration-300 shadow-lg shadow-sky-500/10">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <p className="text-slate-100 font-semibold text-base sm:text-lg mb-1">
              Upload Your Photo
            </p>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xs">
              Click to place your photo inside the frame
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
