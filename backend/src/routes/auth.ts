import { Router } from 'express';
import bcrypt from 'bcrypt';
import { findUserByEmail, createUser } from '../modules/users/users.repository';
import { generateToken } from '../modules/auth/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = await createUser({ email, password, name });
    const token = generateToken(user);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
