export const colors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  border: '#2C2C2C',
  primary: '#0A84FF',
  primaryMuted: 'rgba(10, 132, 255, 0.15)',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  textDisabled: '#48484A',
  danger: '#FF453A',
  dangerMuted: 'rgba(255, 69, 58, 0.15)',
  success: '#32D74B',
  successMuted: 'rgba(50, 215, 75, 0.15)',
  warning: '#FFD60A',
  someday: '#BF5AF2',
  somedayMuted: 'rgba(191, 90, 242, 0.15)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const typography = {
  largeTitle: {fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5},
  title: {fontSize: 20, fontWeight: '600' as const},
  headline: {fontSize: 17, fontWeight: '600' as const},
  body: {fontSize: 16, fontWeight: '400' as const},
  callout: {fontSize: 15, fontWeight: '400' as const},
  caption: {fontSize: 13, fontWeight: '400' as const},
  micro: {fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5},
};
