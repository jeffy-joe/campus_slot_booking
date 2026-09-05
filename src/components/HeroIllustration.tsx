import React from 'react';

export const HeroIllustration: React.FC<{ className?: string }> = ({ className = "w-48 h-36" }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Soft circular aura */}
      <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-xl transform scale-90" />

      <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
        {/* Decorative sparkles */}
        <path d="M40 30L42 35L47 37L42 39L40 44L38 39L33 37L38 35Z" fill="#60A5FA" />
        <path d="M170 20L171.5 24L175.5 25.5L171.5 27L170 31L168.5 27L164.5 25.5L168.5 24Z" fill="#93C5FD" />
        <circle cx="150" cy="50" r="2" fill="#3B82F6" />
        <circle cx="55" cy="70" r="2.5" fill="#93C5FD" />

        {/* Stadium Lamp / Floodlight */}
        <path d="M60 115L55 85H75L70 115H60Z" fill="#CBD5E1" />
        <path d="M50 85C50 78 57 75 65 75C73 75 80 78 80 85H50Z" fill="#3B82F6" />
        <rect x="62" y="115" width="6" height="15" fill="#94A3B8" />
        <ellipse cx="65" cy="130" rx="14" ry="4" fill="#64748B" />

        {/* Tennis / Sports Net in background */}
        <g stroke="#94A3B8" strokeWidth="1.5">
          <line x1="85" y1="95" x2="165" y2="95" stroke="#475569" strokeWidth="2.5" />
          <line x1="85" y1="130" x2="165" y2="130" stroke="#64748B" strokeWidth="2" />
          <line x1="85" y1="90" x2="85" y2="132" stroke="#334155" strokeWidth="3" />
          <line x1="165" y1="90" x2="165" y2="132" stroke="#334155" strokeWidth="3" />
          {/* Net mesh */}
          <line x1="95" y1="95" x2="95" y2="130" strokeDasharray="2 2" />
          <line x1="105" y1="95" x2="105" y2="130" strokeDasharray="2 2" />
          <line x1="115" y1="95" x2="115" y2="130" strokeDasharray="2 2" />
          <line x1="125" y1="95" x2="125" y2="130" strokeDasharray="2 2" />
          <line x1="135" y1="95" x2="135" y2="130" strokeDasharray="2 2" />
          <line x1="145" y1="95" x2="145" y2="130" strokeDasharray="2 2" />
          <line x1="155" y1="95" x2="155" y2="130" strokeDasharray="2 2" />
          <line x1="85" y1="106" x2="165" y2="106" strokeDasharray="3 2" />
          <line x1="85" y1="118" x2="165" y2="118" strokeDasharray="3 2" />
        </g>

        {/* Table Tennis Paddle */}
        <g transform="translate(130, 45) rotate(22)">
          <circle cx="20" cy="20" r="18" fill="#1D4ED8" />
          <circle cx="20" cy="20" r="16" fill="#2563EB" />
          <path d="M16 38L15 54C15 56 17 58 20 58C23 58 25 56 25 54L24 38H16Z" fill="#F97316" />
          {/* TT small white ball */}
          <circle cx="-5" cy="15" r="5.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        </g>

        {/* Soccer / Football Ball */}
        <g transform="translate(90, 48)">
          <circle cx="18" cy="18" r="16" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          {/* Pentagons */}
          <polygon points="18,10 23,14 21,19 15,19 13,14" fill="#1E293B" />
          <line x1="18" y1="10" x2="18" y2="3" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="23" y1="14" x2="31" y2="11" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="21" y1="19" x2="27" y2="29" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="15" y1="19" x2="9" y2="29" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="13" y1="14" x2="5" y2="11" stroke="#1E293B" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};
