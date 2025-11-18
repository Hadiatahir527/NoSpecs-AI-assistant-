export enum AppState {
  AUTH = 'AUTH',
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  PROCESSING = 'PROCESSING',
  READING = 'READING',
  SETTINGS = 'SETTINGS'
}

export enum ColorScheme {
  DEFAULT = 'DEFAULT', // Black text on White
  HIGH_CONTRAST = 'HIGH_CONTRAST', // Yellow text on Black
  INVERTED = 'INVERTED', // White text on Black
  BLUE_YELLOW = 'BLUE_YELLOW' // Yellow text on Blue
}

export interface User {
  id: string;
  username: string;
  opusToken: string;
}

export interface UserSettings {
  diopters: number; // Vision correction factor (simulated zoom)
  fontSize: number; // Base font size in px
  colorScheme: ColorScheme;
  targetLanguage: string;
  autoRead: boolean;
}

export interface ProcessedContent {
  originalText: string;
  simplifiedText: string;
  translatedText: string;
  language: string;
  confidence: number;
  requiresAudit: boolean; // For critical content like medicine
}

export interface AuditRequest {
  id: string;
  timestamp: number;
  imageHash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}