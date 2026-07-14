import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);

const defaultData = {
  users: [],
  providers: [],
  categories: [],
  offers: [],
  bookings: [],
  notifications: []
};

export const db = new Low(adapter, defaultData);

export async function initDb() {
  await db.read();
  db.data ||= defaultData;
  // Ensure all collections exist (in case db.json is partial)
  for (const key of Object.keys(defaultData)) {
    if (!db.data[key]) db.data[key] = [];
  }
  await db.write();
  return db;
}
