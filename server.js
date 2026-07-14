import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './data/db.js';
import { attachUser } from './middleware/auth.js';

import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/booking.js';
import travelerRoutes from './routes/traveler.js';
import providerRoutes from './routes/provider.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = await initDb();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'azulink-mvp-secret-khenifra-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));
app.use(flash());
app.use(attachUser(db));

// Make db + flash messages available everywhere
app.use((req, res, next) => {
  req.db = db;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  res.locals.categories = db.data.categories;
  next();
});

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', bookingRoutes);
app.use('/mon-compte', travelerRoutes);
app.use('/prestataire', providerRoutes);
app.use('/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

app.listen(PORT, () => {
  console.log(`🌿 AzulLink MVP en ligne sur http://localhost:${PORT}`);
});
