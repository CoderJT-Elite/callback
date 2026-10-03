"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Shield, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Sample Chips */}
      <SampleChips
        disabled={isLoading}
        onSelectSample={(sample) => {
          onReplaySample(sample);
        }}
      />

      {/* Input Card Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 md:p-6 space-y-4 transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div>
          <label
            htmlFor="message-input"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
          >
            Paste a text, email, or DM to check:
          </label>
          <textarea
            id="message-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. USPS: Your package #US9402283 could not be delivered due to incorrect address. Pay $1.99 redelivery fee at usps-help.top..."
            className="w-full h-32 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none transition-all"
            maxLength={6000}
          />
        </div>

        {/* Screenshot Upload or Preview */}
        {imagePreview ? (
          <div className="relative inline-block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 bg-slate-50 dark:bg-slate-800 p-2">
            <img
              src={imagePreview}
              alt="Screenshot Preview"
              className="max-h-40 rounded object-contain mx-auto"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
              title="Remove screenshot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
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
              className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload / Drop Screenshot (PNG, JPG, WebP)
            </button>
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>We don&apos;t store what you paste. Analysis runs securely.</span>
          </p>
          <button
            type="submit"
            disabled={isLoading || (!text.trim() && !imagePreview)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Check it
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
