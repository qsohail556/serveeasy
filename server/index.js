import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import staffRoutes from './routes/staff.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

// Fail fast if JWT_SECRET is missing — never run with a default/empty secret.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in .env — refusing to start.');
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler — never leak stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TapMenu server running on port ${PORT}`));
