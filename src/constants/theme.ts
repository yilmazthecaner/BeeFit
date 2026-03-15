/**
 * BeeFit Design System — Apple HIG-Inspired Theme
 *
 * This file defines all design tokens for the application.
 * Strictly follows Apple's Human Interface Guidelines:
 * - SF Pro-inspired typography scale
 * - iOS system color palette
 * - Consistent spacing, radii, and shadows
 */

export const Colors = {
  // ── Primary Brand ──
  primary: '#ec5b13',        // Stitch Primary
  primaryLight: '#f68e57',
  primaryDark: '#c2480d',

  // ── iOS System Colors ──
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemTeal: '#5AC8FA',
  systemIndigo: '#5856D6',

  // ── Activity Ring Colors ──
  ringMove: '#FA114F',       // Red — Move/Calories
  ringExercise: '#92E82A',   // Green — Exercise/Workout
  ringStand: '#00D4FF',      // Blue — Stand/Steps
  ringProtein: '#AF52DE',    // Purple — Protein

  // ── Neutral Palette (Light Mode) ──
  light: {
    background: '#f8f6f6',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#0f172a',          // slate-900
    textSecondary: '#64748b',   // slate-500
    textTertiary: '#cbd5e1',    // slate-300
    separator: '#e2e8f0',       // slate-200
    groupedBackground: '#f8f6f6',
    fill: 'rgba(236, 91, 19, 0.1)', // primary/10
  },

  // ── Neutral Palette (Dark Mode) ──
  dark: {
    background: '#221610',
    surface: 'rgba(15, 23, 42, 0.5)', // slate-900/50
    surfaceElevated: '#1e293b',       // slate-800
    text: '#f1f5f9',                  // slate-100
    textSecondary: '#94a3b8',         // slate-400
    textTertiary: '#475569',          // slate-600
    separator: '#1e293b',             // slate-800
    groupedBackground: '#221610',
    fill: 'rgba(236, 91, 19, 0.2)',
  },
} as const;

export const Typography = {
  // SF Pro-inspired type scale
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export const theme = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} as const;

export default theme;
