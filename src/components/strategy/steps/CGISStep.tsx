import React, { useCallback, useRef } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Building2, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
}

export const CGISStep: React.FC<Props> = ({ inputs, updateField }) => {
  const buildingRef = useRef<HTMLInputElement>(null);
  const floorplanRef = useRef<HTMLInputElement>(null);

  const buildingRenderUrl = (inputs as any)._buildingRenderUrl as string | undefined;
  const floorplanUrl = (inputs as any)._floorplanUrl as string | undefined;

  const handleFile = useCallback((file: File, field: '_buildingRenderUrl' | '_floorplanUrl') => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateField(field as any, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [updateField]);

  const handleDrop = useCallback((e: React.DragEvent, field: '_buildingRenderUrl' | '_floorplanUrl') => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0], field);
  }, [handleFile]);

  const renderUploadZone = (
    label: string,
    icon: React.ReactNode,
    url: string | undefined,
    field: '_buildingRenderUrl' | '_floorplanUrl',
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => (
    <div>
      <h4 className="text-xs font-semibold text-theme-text mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </h4>
      {url ? (
        <div className="relative rounded-xl border border-theme-border overflow-hidden">
          <img src={url} alt={label} className="w-full max-h-[220px] object-contain bg-theme-bg" />
          <button
            onClick={() => updateField(field as any, undefined)}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, field)}
          className="flex flex-col items-center justify-center gap-1.5 py-8 rounded-xl border-2 border-dashed border-theme-border hover:border-theme-accent/30 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center">
            {icon}
          </div>
          <p className="text-[10px] text-theme-text-muted">Drop image or click to upload</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) handleFile(files[0], field);
        }}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-theme-text mb-1">Property Renders</h3>
        <p className="text-xs text-theme-text-muted">
          Upload CGI renders to include in the cashflow document.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {renderUploadZone(
          'Building Render',
          <Building2 className="w-4 h-4 text-theme-accent" />,
          buildingRenderUrl,
          '_buildingRenderUrl',
          buildingRef,
        )}
        {renderUploadZone(
          'Floor Plan',
          <ImageIcon className="w-4 h-4 text-theme-accent" />,
          floorplanUrl,
          '_floorplanUrl',
          floorplanRef,
        )}
      </div>
    </div>
  );
};
