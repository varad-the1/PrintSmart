/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processPdf, mergePdfs, ProcessedFile } from './lib/pdfUtils';
import Logo from './components/Logo';
import { savePdf } from './lib/downloadHelper';

export default function App() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedBytes, setMergedBytes] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = async (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
    
    const newProcessedFiles: ProcessedFile[] = await Promise.all(
      pdfFiles.map(async (file) => {
        try {
          const { originalPageCount, addedBlankPage } = await processPdf(file);
          return {
            id: Math.random().toString(36).substr(2, 9),
            file,
            originalPageCount,
            addedBlankPage,
            status: 'completed' as const,
          };
        } catch (err) {
          return {
            id: Math.random().toString(36).substr(2, 9),
            file,
            originalPageCount: 0,
            addedBlankPage: false,
            status: 'error' as const,
          };
        }
      })
    );

    setFiles(prev => [...prev, ...newProcessedFiles]);
    setMergedPdfUrl(null);
    setMergedBytes(null);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedPdfUrl(null);
    setMergedBytes(null);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const processedBuffers = await Promise.all(
        files.map(async (f) => {
          const { data } = await processPdf(f.file);
          return data;
        })
      );
      const merged = await mergePdfs(processedBuffers);
      setMergedBytes(merged);
      const blob = new Blob([merged], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
    } catch (err) {
      console.error('Merge failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDownload = async () => {
    if (mergedBytes) {
      await savePdf(mergedBytes, "PrintSmart_Merged.pdf");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F7] font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0A0A0C]/80 backdrop-blur-md border-b border-white/5 px-6 pt-[calc(1rem+var(--safe-top))] pb-4 px-safe">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <Logo className="w-12 h-12" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold tracking-tight text-white">PrintSmart</h1>
              <p className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest">Premium PDF Prep</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="sm:hidden w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-blue-400 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
            {files.length > 0 && (
              <button 
                onClick={handleMerge}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 hidden sm:block" />
                )}
                {mergedPdfUrl ? 'Refresh Merge' : (files.length > 1 ? 'Merge All' : 'Process PDF')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Upload & Instructions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="hidden lg:block bg-[#1C1C1E] rounded-3xl p-8 shadow-sm border border-white/5">
              <h2 className="text-lg font-semibold mb-2">Upload Files</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Add multiple PDF files. We'll ensure each document ends on an even page for perfect double-sided printing.
              </p>
              
              <div 
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-white/[0.02] hover:bg-blue-500/[0.05]"
              >
                <div className="w-12 h-12 bg-[#2C2C2E] rounded-full flex items-center justify-center shadow-sm border border-white/10 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-blue-400 block">Click to upload</span>
                  <span className="text-xs text-gray-500">or drag and drop PDFs</span>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-blue-500/20">1</div>
                  <p className="text-xs text-gray-400">Select multiple PDFs in print order.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-blue-500/20">2</div>
                  <p className="text-xs text-gray-400">Odd-paged files get a matching blank page.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-blue-500/20">3</div>
                  <p className="text-xs text-gray-400">Download your ready-to-print merged PDF.</p>
                </div>
              </div>
            </div>

            {mergedPdfUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/[0.08] border border-green-500/20 rounded-3xl p-6 sm:p-8 shadow-sm lg:sticky lg:top-28"
              >
                <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Ready for Printing</span>
                </h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-full text-sm sm:text-base font-semibold transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download Merged
                  </button>
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-green-400 border border-green-500/20 py-3 rounded-full text-sm sm:text-base font-semibold transition-all active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    Quick Preview
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: File List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Document Queue
                {files.length > 0 && <span className="ml-2 text-sm text-gray-500 font-normal">({files.length})</span>}
              </h2>
              {files.length > 0 && (
                <button 
                  onClick={() => setFiles([])}
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {files.length === 0 ? (
              <div className="h-[400px] border border-white/5 rounded-3xl bg-[#1C1C1E] flex flex-col items-center justify-center text-gray-500 p-8 shadow-inner">
                <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-medium text-center">Queue is empty</p>
                <p className="text-sm text-center max-w-[240px] mt-2 opacity-50">Upload your PDFs to start processing.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                <AnimatePresence initial={false}>
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex items-start sm:items-center justify-between hover:border-blue-500/30 hover:shadow-lg transition-all gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate w-full text-gray-100">
                            {index + 1}. {file.file.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] text-gray-500 font-medium">
                              {file.originalPageCount} {file.originalPageCount === 1 ? 'page' : 'pages'}
                            </span>
                            {file.addedBlankPage && (
                              <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold border border-yellow-500/20 flex items-center gap-1 leading-none uppercase tracking-tighter">
                                <Plus className="w-2 h-2" /> Blank Added
                              </span>
                            )}
                            {file.status === 'completed' && !file.addedBlankPage && (
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20 leading-none uppercase tracking-tighter">
                                Even Pages
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && mergedPdfUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1C1C1E] w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1C1C1E]">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-gray-200">Merged PDF Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownload}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-gray-400 hover:bg-white/5 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-black">
                <iframe 
                  src={`${mergedPdfUrl}#toolbar=0`} 
                  className="w-full h-full border-none invert-[0.9] opacity-90"
                  style={{ filter: mergedPdfUrl ? 'none' : 'invert(0.9) hue-rotate(180deg)' }}
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-5xl mx-auto p-12 pb-[calc(3rem+var(--safe-bottom))] text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest px-safe">
        <p>© 2026 PrintSmart • Pro-Grade Prep</p>
      </footer>
    </div>
  );
}
