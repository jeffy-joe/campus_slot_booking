import React from 'react';

export const AuthIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[380px] h-auto',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 380 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Soft background glow circles */}
        <circle cx="190" cy="140" r="120" fill="#EFF6FF" />
        <circle cx="140" cy="120" r="70" fill="#E0F2FE" fillOpacity="0.7" />

        {/* Distant Trees & Foliage in soft blue tones */}
        <g opacity="0.6">
          {/* Right tree */}
          <path
            d="M310 180C310 160 322 145 338 145C354 145 366 160 366 180C366 195 356 205 342 208V230H334V208C320 205 310 195 310 180Z"
            fill="#BFDBFE"
          />
          <circle cx="338" cy="148" r="16" fill="#BFDBFE" />
          <circle cx="325" cy="162" r="14" fill="#BFDBFE" />
          <circle cx="350" cy="162" r="14" fill="#BFDBFE" />

          {/* Left bushes */}
          <path
            d="M30 200C30 188 40 178 52 178C56 178 60 179 63 182C67 175 75 170 84 170C95 170 104 178 106 188C110 189 114 194 114 200C114 207 108 213 101 213H43C36 213 30 207 30 200Z"
            fill="#DBEAFE"
          />
        </g>

        {/* Goal Post / Net */}
        <g id="goal-net">
          {/* Shadow beneath goal */}
          <ellipse cx="205" cy="235" rx="85" ry="8" fill="#E2E8F0" opacity="0.8" />

          {/* Net grid in back */}
          <g stroke="#93C5FD" strokeWidth="1.2" opacity="0.85">
            {/* Horizontal net strings */}
            <line x1="140" y1="175" x2="265" y2="175" strokeDasharray="3 3" />
            <line x1="140" y1="187" x2="268" y2="187" strokeDasharray="3 3" />
            <line x1="138" y1="199" x2="271" y2="199" strokeDasharray="3 3" />
            <line x1="135" y1="211" x2="274" y2="211" strokeDasharray="3 3" />
            <line x1="133" y1="223" x2="277" y2="223" strokeDasharray="3 3" />

            {/* Vertical/Angled net strings */}
            <line x1="150" y1="168" x2="145" y2="233" strokeDasharray="3 3" />
            <line x1="168" y1="168" x2="164" y2="233" strokeDasharray="3 3" />
            <line x1="186" y1="168" x2="184" y2="233" strokeDasharray="3 3" />
            <line x1="205" y1="168" x2="205" y2="233" strokeDasharray="3 3" />
            <line x1="224" y1="168" x2="226" y2="233" strokeDasharray="3 3" />
            <line x1="242" y1="168" x2="246" y2="233" strokeDasharray="3 3" />
            <line x1="260" y1="168" x2="266" y2="233" strokeDasharray="3 3" />
          </g>

          {/* Goal Frame Posts (Blue) */}
          {/* Crossbar */}
          <path
            d="M136 166H274"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Left upright */}
          <path
            d="M138 166V234"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Right upright */}
          <path
            d="M272 166V234"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Depth supports */}
          <path
            d="M138 168L122 234"
            stroke="#3B82F6"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M272 168L288 234"
            stroke="#3B82F6"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Ground bottom bars */}
          <path
            d="M122 234H138M272 234H288"
            stroke="#2563EB"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* Table Tennis Paddle (Top Right) */}
        <g id="tt-paddle" transform="translate(230, 95) rotate(24)">
          {/* Handle */}
          <path
            d="M26 50L30 84C30 86 28 88 25 88H21C18 88 16 86 16 84L20 50H26Z"
            fill="#0F172A"
          />
          <rect x="18" y="52" width="10" height="6" rx="2" fill="#334155" />
          {/* Paddle circular blade */}
          <ellipse cx="23" cy="24" rx="28" ry="30" fill="#1D4ED8" />
          <ellipse cx="23" cy="24" rx="25" ry="27" fill="#2563EB" />
          {/* Shine highlight */}
          <path
            d="M10 14C12 8 20 4 28 5"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Soccer Ball (Upper Center-Left) */}
        <g id="soccer-ball" transform="translate(132, 98)">
          {/* Drop shadow */}
          <ellipse cx="24" cy="48" rx="18" ry="4" fill="#CBD5E1" opacity="0.6" />

          {/* Main White Ball with border */}
          <circle cx="24" cy="24" r="22" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />

          {/* Center black pentagon */}
          <polygon
            points="24,14 32,20 29,30 19,30 16,20"
            fill="#0F172A"
          />

          {/* Radiating seam lines and outer pentagons */}
          <line x1="24" y1="14" x2="24" y2="3" stroke="#0F172A" strokeWidth="2" />
          <line x1="32" y1="20" x2="43" y2="16" stroke="#0F172A" strokeWidth="2" />
          <line x1="29" y1="30" x2="38" y2="40" stroke="#0F172A" strokeWidth="2" />
          <line x1="19" y1="30" x2="10" y2="40" stroke="#0F172A" strokeWidth="2" />
          <line x1="16" y1="20" x2="5" y2="16" stroke="#0F172A" strokeWidth="2" />

          {/* Edge pentagon patches */}
          <polygon points="21,2 27,2 24,6" fill="#0F172A" />
          <polygon points="44,14 46,21 41,20" fill="#0F172A" />
          <polygon points="35,42 41,38 36,36" fill="#0F172A" />
          <polygon points="13,42 7,38 12,36" fill="#0F172A" />
          <polygon points="4,14 2,21 7,20" fill="#0F172A" />
        </g>

        {/* Badminton Shuttlecock (Lower Left) */}
        <g id="shuttlecock" transform="translate(72, 175) rotate(-35)">
          {/* Feather skirt (Blue) */}
          <path
            d="M18 16L6 54C8 56 32 56 34 54L22 16H18Z"
            fill="#1D4ED8"
          />
          {/* Feather ribs */}
          <line x1="12" y1="46" x2="18" y2="18" stroke="#60A5FA" strokeWidth="1.5" />
          <line x1="20" y1="48" x2="20" y2="18" stroke="#93C5FD" strokeWidth="1.5" />
          <line x1="28" y1="46" x2="22" y2="18" stroke="#60A5FA" strokeWidth="1.5" />
          <path
            d="M8 46C14 48 26 48 32 46"
            stroke="#2563EB"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M11 34C15 35 24 35 29 34"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
          />

          {/* White Cork Base */}
          <path
            d="M17 17C17 12 18 8 20 8C22 8 23 12 23 17Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="2"
          />
          <ellipse cx="20" cy="17" rx="4" ry="2" fill="#0F172A" />
        </g>

        {/* Small floating sparkles/stars */}
        <g fill="#60A5FA">
          <circle cx="112" cy="74" r="2.5" />
          <circle cx="282" cy="78" r="3" fill="#3B82F6" />
          <path d="M78 120L80 124L84 125L80 127L78 131L76 127L72 125L76 124Z" fill="#93C5FD" />
          <path d="M308 116L309.5 119L312.5 120L309.5 121L308 124L306.5 121L303.5 120L306.5 119Z" fill="#60A5FA" />
        </g>
      </svg>
    </div>
  );
};
