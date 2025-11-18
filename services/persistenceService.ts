import { AuditRequest, User, UserSettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

// In a full implementation, this connects to Python FastAPI -> Qdrant / Opus
const STORAGE_KEY_SETTINGS = 'nospecs_settings';
const STORAGE_KEY_AUDIT = 'nospecs_audit_logs';
const STORAGE_KEY_USER = 'nospecs_user';

// --- OPUS API INTEGRATION ---

export const opusLogin = async (email: string, password: string): Promise<User> => {
  // Simulate network request to Opus Auth Service
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.includes("error")) {
        reject(new Error("Invalid credentials provided to Opus ID."));
      } else {
        const user: User = {
          id: "opus_" + Math.random().toString(36).substring(2, 9),
          username: email.split('@')[0] || 'User',
          opusToken: "ops_tk_" + Math.random().toString(36).substring(2, 16)
        };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        console.log(`[Opus Auth] Session created for ${user.id}`);
        resolve(user);
      }
    }, 1500);
  });
};

export const submitOpusAudit = async (audit: AuditRequest): Promise<void> => {
  // Simulate secure transmission to Opus Audit Queue
  return new Promise((resolve) => {
    console.log(`[Opus API] Encrypting and uploading audit package ${audit.id}...`);
    setTimeout(() => {
      const logs = getAuditLogs();
      logs.push(audit);
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
      console.log(`[Opus API] Audit request ${audit.id} queued for human review.`);
      resolve();
    }, 1200);
  });
};

// --- QDRANT API INTEGRATION ---

export const syncQdrantPreferences = async (userId: string, settings: UserSettings): Promise<void> => {
  // Simulate vector embedding update in Qdrant
  return new Promise((resolve) => {
    console.log(`[Qdrant] Generating preference vector for user ${userId}...`);
    setTimeout(() => {
      saveSettings(settings); // Local persistence
      console.log(`[Qdrant] Vector payload upserted successfully:`, settings);
      resolve();
    }, 1000);
  });
};

// --- LOCAL PERSISTENCE HELPER ---

export const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings locally", e);
  }
};

export const getSettings = (): UserSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const getStoredUser = (): User | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const logoutOpus = (): void => {
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const getAuditLogs = (): AuditRequest[] => {
  const data = localStorage.getItem(STORAGE_KEY_AUDIT);
  return data ? JSON.parse(data) : [];
};