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
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret', { expiresIn: '1d' });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Failed to login', details: err.message });
  }
});

module.exports = { router };