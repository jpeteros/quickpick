import { readItems, writeItems } from '../_store.js';

export default async function handler(req, res) {
  const itemId = Number(req.query.id);

  if (req.method === 'PATCH') {
    const items = await readItems();
    const updatedItems = items.map((item) => (item.id === itemId ? { ...item, ...req.body } : item));
    await writeItems(updatedItems);
    return res.status(200).json(updatedItems);
  }

  if (req.method === 'DELETE') {
    const items = await readItems();
    const filteredItems = items.filter((item) => item.id !== itemId);
    await writeItems(filteredItems);
    return res.status(200).json(filteredItems);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
