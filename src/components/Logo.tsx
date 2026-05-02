import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  const [imgError, setImgError] = React.useState(false);

  if (!imgError) {
    return (
      <img 
        src="/logo.png" 
        alt="PrintSmart Logo" 
        className={`${className} object-contain rounded-xl`}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-slate-300 to-slate-500 rounded-xl flex items-center justify-center p-1.5 shadow-inner border border-white/20 relative overflow-hidden group`}>
      {/* Glossy reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 translate-y-[-50%]" />
      
      {/* 3D-ish Printer Shape */}
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        <path d="M6 10H18V16C18 17.1046 17.1046 18 16 18H8C6.89543 18 6 17.1046 6 16V10Z" fill="#1E293B" />
        <path d="M8 7C8 5.89543 8.89543 5 10 5H14C15.1046 5 16 5.89543 16 7V10H8V7Z" fill="#334155" />
        {/* Glow Slot */}
        <rect x="8" y="13" width="8" height="1.5" rx="0.75" fill="#60A5FA" className="animate-pulse" />
        {/* Paper Sheet */}
        <path d="M10 4V8H14V4H10Z" fill="white" fillOpacity="0.8" />
      </svg>
      
      {/* Blue "Smart" indicator */}
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white/40 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
    </div>
  );
}
