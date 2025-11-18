import { ColorScheme, UserSettings } from "./types";

export const DEFAULT_SETTINGS: UserSettings = {
  diopters: 0,
  fontSize: 24,
  colorScheme: ColorScheme.DEFAULT,
  targetLanguage: 'English',
  autoRead: false,
};

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Hindi',
  'Portuguese'
];

export const THEME_STYLES = {
  // Premium Default: Soft Warm White background, Deep Slate text
  [ColorScheme.DEFAULT]: {
    bg: 'bg-[#FDFCF8]', 
    text: 'text-[#1A1A1A]',
    accent: 'bg-indigo-600 text-white',
    border: 'border-stone-200',
    card: 'bg-white shadow-sm'
  },
  // High Contrast: Pure Black background, Neon Yellow text
  [ColorScheme.HIGH_CONTRAST]: {
    bg: 'bg-black',
    text: 'text-[#FFF500]',
    accent: 'bg-[#FFF500] text-black',
    border: 'border-[#FFF500]',
    card: 'bg-zinc-900 border-2 border-[#FFF500]'
  },
  // Inverted: Dark Slate background, White text (Dark Mode)
  [ColorScheme.INVERTED]: {
    bg: 'bg-[#0F172A]',
    text: 'text-white',
    accent: 'bg-white text-[#0F172A]',
    border: 'border-slate-700',
    card: 'bg-slate-800 shadow-lg shadow-black/20'
  },
  // Blue-Yellow: Deep Navy background, Soft Yellow text
  [ColorScheme.BLUE_YELLOW]: {
    bg: 'bg-[#172554]',
    text: 'text-[#FDE047]',
    accent: 'bg-[#FDE047] text-[#172554]',
    border: 'border-[#FDE047]',
    card: 'bg-[#1E3A8A] border border-[#FDE047]'
  }
};

export const CRITICAL_KEYWORDS = [
  "dosage", "medicine", "warning", "danger", "caution", "prescription", "side effects", "emergency"
];