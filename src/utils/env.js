// dotenv .env dosyasını process.env içine yükler; env adla değer okur, yoksa varsayılanı döndürür veya hata atar.
import dotenv from 'dotenv';

dotenv.config();

export function env(name, defaultValue) {
  const value = process.env[name];

  if (value) return value;

  if (defaultValue) return defaultValue;

  throw new Error(`Missing environment variables: ${name}`);
}
