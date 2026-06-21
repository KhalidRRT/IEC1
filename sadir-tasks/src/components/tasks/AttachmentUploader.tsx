"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/utils";

interface AttachmentUploaderProps {
  taskId: string;
  onUploaded?: () => void;
}

export default function AttachmentUploader({ taskId, onUploaded }: AttachmentUploaderProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل رفع الملف");
      }

      toast({ title: "تم رفع المرفق بنجاح", description: file.name });
      setSelectedFile(null);
      onUploaded?.();
      router.refresh();
    } catch (e: any) {
      toast({ title: "خطأ في رفع الملف", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }

  return (
    <div className="space-y-3">
      {/* منطقة السحب والإفلات */}
      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">اسحب الملف هنا أو اضغط للاختيار</p>
        <p className="text-xs text-gray-400 mt-1">الحد الأقصى: 10MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.zip"
        />
      </div>

      {/* ملف مختار */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Paperclip className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); uploadFile(selectedFile); }}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              رفع
            </Button>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
