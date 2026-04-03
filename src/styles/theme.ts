export const theme = {
  colors: {
    primary: '#2A9D8F',
    primaryLight: '#E8F5F3',
    secondary: '#457B9D',
    success: '#2EAE5F',
    warning: '#E9C46A',
    danger: '#E76F51',
    dangerLight: '#FCEBE7',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textMain: '#1D3557',
    textMuted: '#6C757D',
    textLight: '#A4B0BE',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
} as const;

export type Theme = typeof theme;
