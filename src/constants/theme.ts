import { Platform } from 'react-native';

const fontScale = Platform.OS === 'ios' ? 0.82 : 0.92;

export const scaleFont = (size: number) => Math.round(size * fontScale);

const scaleTypography = <T extends { fontSize: number; lineHeight: number; fontWeight: string }>(
  variant: T,
) =>
  ({
    ...variant,
    fontSize: scaleFont(variant.fontSize),
    lineHeight: scaleFont(variant.lineHeight),
  } as T);

const typographyBase = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};

export const theme = {
  fontScale,
  colors: {
    primary: '#D32F2F',
    primaryLight: '#FF5F52',
    primaryDark: '#9A0007',
    secondary: '#1A1A1A',
    accent: '#FF6B35',
    background: '#FFFFFF',
    backgroundDark: '#0A0A0A',
    surface: '#F8F8F8',
    surfaceDark: '#1A1A1A',
    text: '#1A1A1A',
    textLight: '#FFFFFF',
    textSecondary: '#666666',
    error: '#F44336',
    success: '#00C853',
    warning: '#FFC107',
    info: '#00B0FF',
    white: '#FFFFFF',
    black: '#000000',
    adventure: {
      red: '#D32F2F',
      orange: '#FF6B35',
      yellow: '#FFD54F',
      green: '#00C853',
      blue: '#00B0FF',
    },
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 50,
  },
  typography: {
    h1: scaleTypography(typographyBase.h1),
    h2: scaleTypography(typographyBase.h2),
    h3: scaleTypography(typographyBase.h3),
    h4: scaleTypography(typographyBase.h4),
    body: scaleTypography(typographyBase.body),
    caption: scaleTypography(typographyBase.caption),
    small: scaleTypography(typographyBase.small),
  },
};

export type Theme = typeof theme;
