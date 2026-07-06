import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'inventory.json');

const initialItems = [
  { id: 1, name: 'Cola', category: 'Drinks', stock: 8, price: 1.5, minStock: 5 },
  { id: 2, name: 'Chips', category: 'Snacks', stock: 3, price: 1.2, minStock: 5 },
  { id: 3, name: 'Gum', category: 'Candy', stock: 12, price: 0.75, minStock: 6 },
];

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(initialItems, null, 2));
  }
}

export async function readItems() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

export async function writeItems(items) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(items, null, 2));
  return items;
}
