"use client";

import React, { useState, useRef } from "react";
import { SampleChips, ReplayPayload } from "./SampleChips";

interface InputCardProps {
  onCheck: (payload: { text: string; imageBase64?: string }) => void;
  onReplaySample: (sample: ReplayPayload) => void;
  isLoading: boolean;
  externalText?: string;
  externalScreenshotUrl?: string;
}

export function InputCard({
  onCheck,
  onReplaySample,
  isLoading,
  externalText,
  externalScreenshotUrl,
}: InputCardProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external text when sample chip clicked
  React.useEffect(() => {
    if (externalText !== undefined) {
      setText(externalText);
    }
  }, [externalText]);

  React.useEffect(() => {
    if (externalScreenshotUrl) {
      setImagePreview(externalScreenshotUrl);
      setImageBase64(null); // preview only for precomputed sample
    }
  }, [externalScreenshotUrl]);

  // Downscale image if > 1600px long edge on client
  const handleImageUpload = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      alert("Image exceeds 4 MB. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const scaledDataUrl = canvas.toDataURL(file.type || "image/png", 0.9);
          setImagePreview(scaledDataUrl);
          setImageBase64(scaledDataUrl);
        } else {
          setImagePreview(dataUrl);
          setImageBase64(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageBase64 && !imagePreview) return;
    onCheck({
      text: text.trim(),
      imageBase64: imageBase64 || undefined,
    });
  };

  return (
    <div className="w-full space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-sheet border border-ink paper-shadow p-5 md:p-7 space-y-5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div>
          <label htmlFor="message-input" className="flex items-baseline justify-between mb-2">
            <span className="font-display text-xl">The message you got</span>
            <span className="font-mono text-[11px] text-muted">text, email or DM</span>
          </label>
          <textarea
            id="message-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            placeholder="Paste it here. Example: USPS: Your package could not be delivered. Pay a $1.99 fee at usps-help.top"
            className="lined w-full h-[168px] px-3 py-0 bg-transparent border-0 border-l-2 border-stamp/70 text-ink placeholder:text-muted/80 focus:outline-none focus-visible:outline-none focus:border-ink text-[15px] resize-none"
            maxLength={6000}
          />
        </div>

        {imagePreview ? (
          <div className="relative inline-block border border-ink bg-paper p-2">
            <img src={imagePreview} alt="Screenshot preview" className="max-h-40 object-contain" />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-1 right-1 h-6 w-6 bg-ink text-paper font-mono text-sm leading-none"
              aria-label="Remove screenshot"
            >
              ×
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-sm underline underline-offset-4 decoration-rule hover:decoration-ink"
            >
              Or attach a screenshot
            </button>
            <span className="font-mono text-[11px] text-muted ml-2">PNG, JPG or WebP, under 4 MB. You can also drop one here.</span>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-rule">
          <p className="text-[12px] leading-snug text-muted max-w-sm">
            We don&apos;t store what you paste. The text is sent to Google&apos;s Gemini API to be read; don&apos;t include passwords or card numbers.
          </p>
          <button
            type="submit"
            disabled={isLoading || (!text.trim() && !imagePreview)}
            className="shrink-0 bg-ink text-paper px-6 py-3 text-sm font-semibold hover:bg-stamp transition-colors disabled:opacity-40 disabled:hover:bg-ink disabled:cursor-not-allowed"
          >
            {isLoading ? "Checking…" : "Check it →"}
          </button>
        </div>
      </form>

      <SampleChips disabled={isLoading} onSelectSample={(sample) => onReplaySample(sample)} />
    </div>
  );
}
