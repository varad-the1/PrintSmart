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
  Printer,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processPdf, mergePdfs, ProcessedFile } from './lib/pdfUtils';

export default function App() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
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
    setMergedPdfUrl(null); // Reset merge if new files added
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedPdfUrl(null);
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
      const mergedBytes = await mergePdfs(processedBuffers);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#D2D2D7]/30 px-6 pt-[calc(1rem+var(--safe-top))] pb-4 px-safe">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-200">
              <Printer className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold tracking-tight">PrintSmart</h1>
              <p className="text-xs text-[#86868B] font-medium uppercase tracking-wider">PDF Toolkit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="sm:hidden w-10 h-10 bg-white border border-[#D2D2D7] rounded-full flex items-center justify-center text-blue-600 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
            {files.length > 0 && (
              <button 
                onClick={handleMerge}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#D2D2D7]/50">
              <h2 className="text-lg font-semibold mb-2">Upload Files</h2>
              <p className="text-[#86868B] text-sm mb-6 leading-relaxed">
                Add multiple PDF files. We'll ensure each document ends on an even page for perfect double-sided printing.
              </p>
              
              <div 
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-[#D2D2D7] hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-[#FBFBFB] hover:bg-blue-50/30"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#D2D2D7]/50 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-blue-600 block">Click to upload</span>
                  <span className="text-xs text-[#86868B]">or drag and drop PDFs</span>
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
                  <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100">1</div>
                  <p className="text-xs text-[#86868B]">Select multiple PDFs in print order.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100">2</div>
                  <p className="text-xs text-[#86868B]">Odd-paged files get a blank back page automatically.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100">3</div>
                  <p className="text-xs text-[#86868B]">Download your ready-to-print merged PDF.</p>
                </div>
              </div>
            </div>

            {mergedPdfUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-100 rounded-3xl p-8 shadow-sm"
              >
                <h3 className="text-green-800 font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Ready for Download
                </h3>
                <div className="flex flex-col gap-3">
                  <a 
                    href={mergedPdfUrl} 
                    download="PrintSmart_Merged.pdf"
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-medium transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download Merged PDF
                  </a>
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-white text-green-700 border border-green-200 py-3 rounded-full font-medium transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Output
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: File List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Files List
                {files.length > 0 && <span className="ml-2 text-sm text-[#86868B] font-normal">({files.length})</span>}
              </h2>
              {files.length > 0 && (
                <button 
                  onClick={() => setFiles([])}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {files.length === 0 ? (
              <div className="h-[400px] border border-[#D2D2D7]/50 rounded-3xl bg-white flex flex-col items-center justify-center text-[#86868B] p-8">
                <div className="w-20 h-20 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-medium text-center">No PDFs uploaded yet</p>
                <p className="text-sm text-center max-w-[240px] mt-2 opacity-70">Uploaded PDFs will appear here for processing.</p>
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
                      className="group bg-white border border-[#D2D2D7]/50 rounded-2xl p-4 flex items-start sm:items-center justify-between hover:border-blue-200 hover:shadow-md transition-all gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate w-full">
                            {index + 1}. {file.file.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-[#86868B] flex items-center gap-1">
                              {file.originalPageCount} {file.originalPageCount === 1 ? 'page' : 'pages'}
                            </span>
                            {file.addedBlankPage && (
                              <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-bold border border-yellow-100 flex items-center gap-1 leading-none">
                                <Plus className="w-2 h-2" /> BLANK ADDED
                              </span>
                            )}
                            {file.status === 'completed' && !file.addedBlankPage && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-100 leading-none">
                                EVEN (KEEP)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-[#86868B] hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-[#D2D2D7]/50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">PDF Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={mergedPdfUrl} 
                    download="PrintSmart_Merged.pdf"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-[#86868B] hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-[#1E1E1E]">
                <iframe 
                  src={`${mergedPdfUrl}#toolbar=0`} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-5xl mx-auto p-12 pb-[calc(3rem+var(--safe-bottom))] text-center text-[#86868B] text-xs font-medium px-safe">
        <p>© 2026 PrintSmart • Pro-Grade Document Handling</p>
      </footer>
    </div>
  );
}
