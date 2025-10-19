import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const app = express();
const db = new Database('./auth.db'); // Datei-DB
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// --- DB Setup ---
db.exec(`
  create table if not exists users (
    id integer primary key autoincrement,
    email text unique not null,
    password_hash text not null,
    role text not null check (role in ('patient','therapeut')),
    created_at text not null default (datetime('now'))
  );
`);

// Optional: Seed-User (einmalig)
const seedEmail = 'thera@example.com';
const exists = db.prepare('select 1 from users where email=?').get(seedEmail);
if (!exists) {
  const hash = bcrypt.hashSync('Passwort123', 10);
  db.prepare('insert into users (email, password_hash, role) values (?,?,?)')
    .run(seedEmail, hash, 'therapeut');
  console.log('Seed user angelegt:', seedEmail, '(Passwort: Passwort123)');
}

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

// --- Helpers ---
function setSessionCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,              // bei HTTPS true (Render/Vercel), lokal ggf. false
    maxAge: 7 * 24 * 3600 * 1000
  });
}

function auth(req, res, next) {
  const token = req.cookies.session;
  if (!token) return res.status(401).json({ error: 'unauthenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// --- Routes ---
app.post('/api/register', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !['patient','therapeut'].includes(role)) {
    return res.status(400).json({ error: 'invalid input' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('insert into users (email, password_hash, role) values (?,?,?)');
    const result = stmt.run(email.toLowerCase(), hash, role);
    setSessionCookie(res, { uid: result.lastInsertRowid, email: email.toLowerCase(), role });
    res.json({ ok: true, user: { id: result.lastInsertRowid, email, role } });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email exists' });
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'invalid input' });
  const user = db.prepare('select id, email, password_hash, role from users where email=?')
                 .get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  setSessionCookie(res, { uid: user.id, email: user.email, role: user.role });
  res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('session', { httpOnly: true, sameSite: 'lax', secure: true });
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`API ready on :${PORT}`));
