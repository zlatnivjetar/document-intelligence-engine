import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';

const INPUT_ACCEPT_ATTRIBUTE = 'application/pdf,image/png,image/jpeg';

interface UploadDropzoneProps {
  disabled?: boolean;
  errorMessage: string | null;
  fileName: string | null;
  onFileSelect: (file: File | null) => void;
}

export function UploadDropzone({
  disabled = false,
  errorMessage,
  fileName,
  onFileSelect,
}: UploadDropzoneProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker(): void {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const file = event.dataTransfer.files?.[0] ?? null;
    onFileSelect(file);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  }

  return (
    <div className="space-y-4">
      <input
        accept={INPUT_ACCEPT_ATTRIBUTE}
        className="sr-only"
        disabled={disabled}
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />

      <div
        aria-disabled={disabled}
        className={`rounded-[calc(var(--radius-lg)-6px)] border-2 border-dashed px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors sm:px-10 sm:py-20 ${
          isDragging
            ? 'border-[var(--color-accent)] bg-[rgba(200,100,59,0.08)]'
            : 'border-[rgba(200,100,59,0.28)] bg-[var(--color-surface)]/75'
        } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        onClick={openFilePicker}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <div className="mx-auto max-w-sm space-y-3">
          <p className="font-display text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.04em]">
            PDF, PNG, or JPG
          </p>
          <p className="text-base text-[var(--color-muted)]">
            Drag a document here or click to choose one from your device.
          </p>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {fileName ?? 'No document selected yet.'}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p
          aria-live="polite"
          className="rounded-[var(--radius-md)] border border-[rgba(180,35,24,0.2)] bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm text-[var(--color-destructive)]"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
