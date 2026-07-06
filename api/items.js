import { readItems, writeItems } from './_store.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const items = await readItems();
    return res.status(200).json(items);
  }

  if (req.method === 'POST') {
    const items = await readItems();
    const newItem = {
      id: Date.now(),
      name: req.body?.name?.trim(),
      category: req.body?.category || 'Snacks',
      stock: Number(req.body?.stock ?? 0),
      price: Number(req.body?.price ?? 0),
      minStock: Number(req.body?.minStock ?? 5),
    };

    if (!newItem.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatedItems = [newItem, ...items];
    await writeItems(updatedItems);
    return res.status(201).json(updatedItems);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
