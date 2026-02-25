import React from 'react';

interface NoteCellProps {
  noteKey: string;
  notes: Record<string, string>;
  onNotesChange?: (notes: Record<string, string>) => void;
  exportMode?: boolean;
  className?: string;
}

/**
 * Inline editable note cell for the cashflow document.
 * Renders as <input> in normal mode, <span> in export mode.
 */
export const NoteCell: React.FC<NoteCellProps> = ({
  noteKey,
  notes,
  onNotesChange,
  exportMode,
  className = '',
}) => {
  const value = notes[noteKey] || '';

  if (exportMode) {
    return (
      <span className={`text-[10px] text-theme-text-muted italic ${className}`}>
        {value}
      </span>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        onNotesChange?.({ ...notes, [noteKey]: e.target.value });
      }}
      placeholder="Note..."
      className={`w-full text-[10px] bg-transparent border-none outline-none text-theme-text-muted placeholder:text-theme-text-muted/30 focus:text-theme-text ${className}`}
    />
  );
};
