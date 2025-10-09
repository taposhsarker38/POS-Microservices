// server.js
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.post('/api/login', (req, res) => {
  const access = createAccessToken(user);
  res.cookie('access', access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // cross-site: 'none'
    path: '/',
  });
  res.json({ ok: true });
});
