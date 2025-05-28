const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Profile } = require('../models');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, academicLevel } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (academicLevel && !['high-school', 'university', 'professional'].includes(academicLevel)) {
      return res.status(400).json({ error: 'Invalid academicLevel' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    await Profile.create({
      userId: user.id,
      firstName: firstName || null,
      academicLevel: academicLevel || null
    });
    res.status(201).json({ message: 'User created', id: user.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('123', 10);
    const existingUser = await User.findOne({ where: { email: 'test@example.com' } });
    if (existingUser) return res.json({ message: 'Test user exists' });
    const user = await User.create({ email: 'test@example.com', password: hashedPassword });
    await Profile.create({ userId: user.id, firstName: 'Test', academicLevel: 'university' });
    res.json({ message: 'Test user created', id: user.id });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', details: err.message });
  }
});

router.get('/seed', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('123', 10);
    const existingUser = await User.findOne({ where: { email: 'test@example.com' } });
    if (existingUser) return res.json({ message: 'Test user exists' });
    const user = await User.create({ email: 'test@example.com', password: hashedPassword });
    await Profile.create({ userId: user.id, firstName: 'Test', academicLevel: 'university' });
    res.json({ message: 'Test user created' });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', details: err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret', { expiresIn: '1h' });
}

module.exports = { router, authenticateToken, signToken };