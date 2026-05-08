let cartItems = [
  { id: 'A100', name: 'Abstract oil painting', price: '$69.99', quantity: 1 },
  { id: 'C200', name: 'Modern sculpture', price: '$89.99', quantity: 1 }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ items: cartItems });
  }

  if (req.method === 'DELETE') {
    cartItems = [];
    return res.status(200).json({ items: cartItems, message: 'Cart cleared.' });
  }

  return res.status(405).json({ error: 'Only GET and DELETE are allowed for cart.' });
}
