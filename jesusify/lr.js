const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  subscription: { type: String, default: 'free' }
});

const resetTokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  expires: Date
});
resetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.model('User', userSchema);
const ResetToken = mongoose.model('ResetToken', resetTokenSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid email or password length' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword });
  await user.save();
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.status(201).json({ token });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Email not found' });
  const token = uuidv4();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await ResetToken.deleteMany({ email });
  await new ResetToken({ email, token, expires }).save();
  const link = `${process.env.BASE_URL}/reset-password.html?token=${token}`;
  console.log('[RESET LINK]', link);
  await transporter.sendMail({
    from: 'noreply@jesusify.com',
    to: email,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${link}">here</a> to reset your password. This link is valid for 15 minutes.</p>`
  });
  res.json({ message: 'Reset link sent if email exists' });
});

app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const entry = await ResetToken.findOne({ token });
  if (!entry || entry.expires < new Date()) {
    return res.status(400).json({ error: 'Token invalid or expired' });
  }
  const user = await User.findOne({ email: entry.email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.password = await bcrypt.hash(password, 10);
  await user.save();
  await ResetToken.deleteOne({ token });
  res.json({ message: 'Password updated successfully' });
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
