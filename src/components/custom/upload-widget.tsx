'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react'

export const FileUploadWidget = ({
  onFilesChange,
  accept = "*",
  maxSizeMB = 10,
}: {
  onFilesChange: (files: File[]) => void
  accept?: string
  maxSizeMB?: number
}) => {
  const [files, setFiles] = useState<{ file: File; id: string; progress: number }[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const processFiles = (newFiles: FileList) => {
    const validFiles: { file: File; id: string; progress: number }[] = []
    
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} exceeds the maximum size limit of ${maxSizeMB}MB`)
        continue
      }
      const id = Math.random().toString(36).substring(7)
      validFiles.push({ file, id, progress: 0 })
    }

    setFiles((prev) => {
      const updated = [...prev, ...validFiles]
      onFilesChange(updated.map((item) => item.file))
      
      // Simulate file upload progress in UI
      validFiles.forEach((f) => {
        let currentProgress = 0
        const interval = setInterval(() => {
          currentProgress += 20
          setFiles((p) =>
            p.map((item) =>
              item.id === f.id ? { ...item, progress: Math.min(currentProgress, 100) } : item
            )
          )
          if (currentProgress >= 100) {
            clearInterval(interval)
          }
        }, 100)
      })

      return updated
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id)
      onFilesChange(filtered.map((item) => item.file))
      return filtered
    })
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors duration-200 ${
          dragActive
            ? "border-emerald-600 bg-emerald-50/50"
            : "border-slate-200 hover:border-emerald-700/50 hover:bg-slate-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={handleChange}
        />
        <UploadCloud className="h-10 w-10 text-emerald-700/60 mb-2" />
        <p className="text-sm font-semibold text-emerald-950">
          Drag & drop files or <span className="text-emerald-700 hover:underline">browse</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports image files (PNG, JPG) and spreadsheets (XLS, CSV, PDF) up to {maxSizeMB}MB
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map(({ file, id, progress }) => {
            const isImage = file.type.startsWith("image/")
            return (
              <div
                key={id}
                className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {isImage ? (
                    <ImageIcon className="h-5 w-5 text-teal-600 flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[150px]">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{progress}%</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(id)
                  }}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
