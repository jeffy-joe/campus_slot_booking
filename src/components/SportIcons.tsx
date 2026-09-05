import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const TableTennisIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* TT Paddle */}
    <circle cx="10" cy="9" r="6" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
    <path d="M14.5 13.5L20 19a2 2 0 0 1-2.8 2.8l-5.5-5.5" />
    <circle cx="18" cy="6" r="2.5" fill="currentColor" />
  </svg>
);

export const CarromIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Carrom board square with pockets and center circles */}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="5.5" y="5.5" width="13" height="13" rx="1" strokeOpacity="0.5" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="12" cy="12" r="4.5" strokeOpacity="0.4" strokeDasharray="2 2" />
    <circle cx="4.5" cy="4.5" r="1" fill="currentColor" />
    <circle cx="19.5" cy="4.5" r="1" fill="currentColor" />
    <circle cx="4.5" cy="19.5" r="1" fill="currentColor" />
    <circle cx="19.5" cy="19.5" r="1" fill="currentColor" />
  </svg>
);

export const ChessIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Chess Knight */}
    <path d="M8 20h8M6 20c0-2.5 1.5-4 3-5 .5-.3 1-1 1-2 0-.8-.3-1.5-.7-2.3C8.6 9.4 8.5 8 9 7c.6-1.2 2-2 3.5-2 1.2 0 2.2.5 2.5 1.5.3 1-.3 2-.3 2.5 1.2.3 2.3 1.2 2.3 2.5 0 2-2 3.5-2 4.5 1.5 1 3 2.5 3 4" />
    <circle cx="11" cy="9" r="0.75" fill="currentColor" />
  </svg>
);

export const FoosballIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Foosball / Table soccer */}
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="1" y1="9" x2="23" y2="9" />
    <line x1="1" y1="15" x2="23" y2="15" />
    <circle cx="8" cy="9" r="1.5" fill="currentColor" />
    <circle cx="16" cy="9" r="1.5" fill="currentColor" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    <path d="M6 19v3M18 19v3" />
  </svg>
);

export const FutsalIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Soccer / Futsal ball */}
    <circle cx="12" cy="12" r="9" />
    <polygon points="12,8 15,10.5 14,14 10,14 9,10.5" fill="currentColor" fillOpacity="0.2" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="15" y1="10.5" x2="19.5" y2="8" />
    <line x1="14" y1="14" x2="17.5" y2="17.5" />
    <line x1="10" y1="14" x2="6.5" y2="17.5" />
    <line x1="9" y1="10.5" x2="4.5" y2="8" />
  </svg>
);

export const PickleballIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Pickleball paddle + perforated ball */}
    <rect x="4" y="4" width="11" height="11" rx="4" />
    <line x1="12" y1="12" x2="18" y2="18" strokeWidth="2.5" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="18" cy="6" r="0.8" fill="currentColor" />
  </svg>
);

export const CricketNetsIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Cricket stumps & bails */}
    <line x1="6" y1="5" x2="18" y2="5" strokeWidth="2.5" />
    <line x1="8" y1="5" x2="8" y2="20" strokeWidth="2" />
    <line x1="12" y1="5" x2="12" y2="20" strokeWidth="2" />
    <line x1="16" y1="5" x2="16" y2="20" strokeWidth="2" />
    <line x1="5" y1="20" x2="19" y2="20" strokeWidth="2" />
  </svg>
);

export const VolleyballIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Volleyball with panels */}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 1 9 9" />
    <path d="M12 21a9 9 0 0 1-9-9" />
    <path d="M12 12c-4 0-7 2.5-7 5.5" />
    <path d="M12 12c4 0 7-2.5 7-5.5" />
  </svg>
);

export const LogoIcon: React.FC<IconProps> = ({ className = "w-7 h-7", size = 28 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Clean circular white background badge */}
    <circle cx="16" cy="16" r="14.5" fill="#FFFFFF" />

    {/* Primary circular brand border */}
    <circle cx="16" cy="16" r="14.25" stroke="#2563EB" strokeWidth="2.3" />

    {/* Upper-Right Vitality Wing / Dynamic Accent */}
    <path
      d="M16 8C20 7.5 24 9.5 26.2 13C23.8 16.2 20.2 15.8 16.5 13.8L16 8Z"
      fill="#2563EB"
    />
    <path
      d="M16 2.5C18.2 4.2 19.4 6.2 19 8.5C17.4 8.5 16.2 7 16 2.5Z"
      fill="#2563EB"
    />

    {/* Athletic Figure / Center Head */}
    <circle cx="16" cy="9.8" r="2.8" fill="#2563EB" />
    <circle cx="16" cy="9.8" r="1" fill="#FFFFFF" />

    {/* Vertical Stem / Body */}
    <path
      d="M14.4 16H17.6V29.5H14.4V16Z"
      fill="#2563EB"
    />

    {/* Left Arm / Branch */}
    <path
      d="M15.5 16.8L6.5 11"
      stroke="#2563EB"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Right Arm / Branch */}
    <path
      d="M16.5 16.8L25.5 11"
      stroke="#2563EB"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IndoorGamesIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Table Tennis / Indoor Game Racket */}
    <circle cx="10" cy="10" r="6" stroke="currentColor" fill="currentColor" fillOpacity="0.15" />
    <path d="M14.2 14.2L19.2 19.2C19.7 19.7 19.7 20.5 19.2 21C18.7 21.5 17.9 21.5 17.4 21L12.4 16" />
    <line x1="13.2" y1="17.2" x2="15.8" y2="14.6" strokeWidth="1.5" />
    {/* Bouncing ping pong / indoor ball */}
    <circle cx="18" cy="6.5" r="2.5" fill="currentColor" />
    <path d="M13.5 5.5C12.5 6 11.5 7 11 8.5" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 1.5" />
  </svg>
);

export const TurfGroundsIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Turf Pitch Field Boundary */}
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" fill="currentColor" fillOpacity="0.12" />
    {/* Halfway Line */}
    <line x1="12" y1="4" x2="12" y2="20" />
    {/* Center Circle & Spot */}
    <circle cx="12" cy="12" r="3.2" />
    <circle cx="12" cy="12" r="0.75" fill="currentColor" />
    {/* Left Penalty / Goal Box */}
    <path d="M2.5 8.5H6.5V15.5H2.5" />
    {/* Right Penalty / Goal Box */}
    <path d="M21.5 8.5H17.5V15.5H21.5" />
  </svg>
);

export const SportIconRenderer: React.FC<{ iconName: string; className?: string; size?: number }> = ({
  iconName,
  className,
  size
}) => {
  switch (iconName) {
    case 'carrom':
      return <CarromIcon className={className} size={size} />;
    case 'table-tennis':
      return <TableTennisIcon className={className} size={size} />;
    case 'chess':
      return <ChessIcon className={className} size={size} />;
    case 'table-soccer':
      return <FoosballIcon className={className} size={size} />;
    case 'futsal':
      return <FutsalIcon className={className} size={size} />;
    case 'pickle-ball':
      return <PickleballIcon className={className} size={size} />;
    case 'cricket-nets':
      return <CricketNetsIcon className={className} size={size} />;
    case 'volleyball':
      return <VolleyballIcon className={className} size={size} />;
    default:
      return <TableTennisIcon className={className} size={size} />;
  }
};
