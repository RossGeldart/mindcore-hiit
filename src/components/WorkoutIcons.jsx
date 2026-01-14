import React from 'react';

// Equipment Icons
// Note: Kettlebell, Dumbbell, and Bodyweight icons have been removed as requested.

export const SandbagIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <rect x="4" y="6" width="16" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 9h16M4 15h16M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ResistanceBandIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <path d="M5 12c0-4.5 1.5-8 4-9 3 0 4 3 4 5s1.5 7 4 7 4-4.5 4-9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 16c0 4.5 1.5 8 4 9 3 0 4-3 4-5s1.5-7 4-7 4 4.5 4 9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MedicineBallIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Workout Type Icons
// Note: Full Body, Upper Body, and Lower Body icons have been removed as requested.

export const CoreIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <rect x="8" y="8" width="8" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CardioIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const StrengthIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MobilityIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
    <path d="M12 4a2 2 0 100 4 2 2 0 000-4z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 20l2-7 5-3 5 3 2 7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14v6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);