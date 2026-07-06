import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'server', 'data', 'inventory.json');

app.use(cors());
app.use(express.json());

async function readItems() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    const initialItems = [
      { id: 1, name: 'Cola', category: 'Drinks', stock: 8, price: 1.5, minStock: 5 },
      { id: 2, name: 'Chips', category: 'Snacks', stock: 3, price: 1.2, minStock: 5 },
      { id: 3, name: 'Gum', category: 'Candy', stock: 12, price: 0.75, minStock: 6 },
    ];
    await fs.writeFile(dbPath, JSON.stringify(initialItems, null, 2));
    return initialItems;
  }
}

async function writeItems(items) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(items, null, 2));
}

app.get('/api/items', async (_req, res) => {
  const items = await readItems();
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  const items = await readItems();
  const newItem = {
    id: Date.now(),
    name: req.body.name?.trim(),
    category: req.body.category || 'Snacks',
    stock: Number(req.body.stock ?? 0),
    price: Number(req.body.price ?? 0),
    minStock: Number(req.body.minStock ?? 5),
  };

  if (!newItem.name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const updatedItems = [newItem, ...items];
  await writeItems(updatedItems);
  res.status(201).json(updatedItems);
});

app.patch('/api/items/:id', async (req, res) => {
  const items = await readItems();
  const itemId = Number(req.params.id);
  const updatedItems = items.map((item) => (item.id === itemId ? { ...item, ...req.body } : item));
  await writeItems(updatedItems);
  res.json(updatedItems);
});

app.delete('/api/items/:id', async (req, res) => {
  const items = await readItems();
  const itemId = Number(req.params.id);
  const filteredItems = items.filter((item) => item.id !== itemId);
  await writeItems(filteredItems);
  res.json(filteredItems);
});

app.listen(port, () => {
  console.log(`Inventory API running on http://localhost:${port}`);
});
