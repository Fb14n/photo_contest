import fs from "fs";
import path from "path";

export interface SiteSettings {
  gateEnabled: boolean;
  gatePassword: string;
  updatedAt?: string;
  updatedBy?: string;
}

function getSettingsDir(): string {
  if (fs.existsSync("/app/data")) {
    return "/app/data";
  }
  const localData = path.join(process.cwd(), "data");
  if (!fs.existsSync(localData)) {
    try {
      fs.mkdirSync(localData, { recursive: true });
    } catch {
      // fallback
    }
  }
  return localData;
}

function getSettingsFilePath(): string {
  return path.join(getSettingsDir(), "site-settings.json");
}

let cachedSettings: { data: SiteSettings; lastRead: number } | null = null;

export function getSiteSettings(): SiteSettings {
  const now = Date.now();
  if (cachedSettings && now - cachedSettings.lastRead < 2000) {
    return cachedSettings.data;
  }

  const defaultPassword = process.env.SITE_PASSWORD || "";
  const defaultSettings: SiteSettings = {
    gateEnabled: Boolean(defaultPassword && defaultPassword.trim().length > 0),
    gatePassword: defaultPassword,
  };

  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      const settings: SiteSettings = {
        gateEnabled: typeof parsed.gateEnabled === "boolean" ? parsed.gateEnabled : defaultSettings.gateEnabled,
        gatePassword: typeof parsed.gatePassword === "string" ? parsed.gatePassword : defaultSettings.gatePassword,
        updatedAt: parsed.updatedAt,
        updatedBy: parsed.updatedBy,
      };
      cachedSettings = { data: settings, lastRead: now };
      return settings;
    }
  } catch (err) {
    console.error("Error reading site settings file:", err);
  }

  cachedSettings = { data: defaultSettings, lastRead: now };
  return defaultSettings;
}

export function saveSiteSettings(updates: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const merged: SiteSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    const filePath = getSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing site settings file:", err);
  }

  cachedSettings = { data: merged, lastRead: Date.now() };
  return merged;
}
