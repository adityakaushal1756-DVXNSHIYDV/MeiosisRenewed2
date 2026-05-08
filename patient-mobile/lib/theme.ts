// Meiosis Design System - Native Color Tokens
// Mirrors the web patient-frontend's CSS variables

export const Colors = {
  // Core backgrounds
  ink: '#040C18',        // main bg - super dark navy
  panel: '#071828',      // card bg
  panelAlt: '#0A1E30',   // slightly lighter card

  // Primary accent - neon green
  neon: '#52FF9D',
  neonDim: 'rgba(82, 255, 157, 0.15)',
  neonGlow: 'rgba(82, 255, 157, 0.3)',

  // Secondary accent - sky blue
  sky: '#83D4FF',
  skyDim: 'rgba(131, 212, 255, 0.1)',

  // Text
  white: '#FFFFFF',
  mist: '#8BA4B8',       // secondary text
  wire: '#1E3448',       // border color

  // Status
  success: '#52FF9D',
  warning: '#FBB824',
  error: '#FF5252',
  rose: '#FF4D6D',
  amber: '#FBB824',
  purple: '#A78BFA',
  indigo: '#818CF8',
  emerald: '#34D399',

  // Transparent overlays
  glass: 'rgba(255, 255, 255, 0.03)',
  glassHover: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
};

export const Fonts = {
  regular: { fontFamily: 'System' },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semibold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
  black: { fontFamily: 'System', fontWeight: '900' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};
