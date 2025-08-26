// Application constants and configuration
export const COLORS = {
  primary: '#542b31',
  secondary: '#2b544e',
  accent: '#654046',
  neutral: '#876b6f',
  gold: '#FFD700',
  goldBorder: '#E6C200',
  silver: '#C4C4C4',
  silverBorder: '#A8A8A8',
  bronze: '#CE8946',
  bronzeBorder: '#B5763A',
} as const;

export const CONFIG = {
  POLLING_INTERVAL: 30000, // 30 seconds
  MIN_TEAMS: 4,
  MAX_TEAMS: 11,
  HEADER_ROW_COUNT: 2,
} as const;


