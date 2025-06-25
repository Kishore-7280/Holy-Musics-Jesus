const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();

app.use(express.json());

const users = []; // In-memory user store (replace with DB in production)

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid email or password length' });
  }

  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { email, password: hashedPassword, subscription: 'free' };
  users.push(user);

  const token = jwt.sign({ email: user.email }, 'secret123', { expiresIn: '1d' });
  res.status(201).json({ token });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ email: user.email }, 'secret123', { expiresIn: '1d' });
  res.json({ token });
});

app.get('/api/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret123');
    const user = users.find(u => u.email === decoded.email);
    if (!user) return res.sendStatus(404);
    res.json({ email: user.email, subscription: user.subscription });
  } catch {
    res.sendStatus(403);
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
