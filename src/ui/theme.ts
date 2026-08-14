export const colors = {
  bg: '#0B1120',
  surface: '#151E31',
  surfaceAlt: '#1D2942',
  border: '#2A3752',
  text: '#F5F7FB',
  textMuted: '#96A2BC',
  accent: '#3DDC97',
  accentText: '#052B1C',
  danger: '#FF6B6B',
  warning: '#FFC24B',
};

export const spacing = (n: number) => n * 8;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

export const type = {
  hero: { fontSize: 64, fontWeight: '800' as const, color: colors.text },
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
};
