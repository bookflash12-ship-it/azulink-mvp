import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
const router = express.Router();

router.get('/connexion', (req, res) => {
  res.render('auth/login', { title: 'Connexion', redirect: req.query.redirect || '' });
});

router.post('/connexion', (req, res) => {
  const db = req.db;
  const { email, password, redirect } = req.body;
  const user = db.data.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    req.flash('error', 'Email ou mot de passe incorrect.');
    return res.redirect('/connexion');
  }
  req.session.userId = user.id;
  req.flash('success', `Bienvenue, ${user.name} !`);

  if (redirect) return res.redirect(redirect);
  if (user.role === 'admin') return res.redirect('/admin');
  if (user.role === 'provider') return res.redirect('/prestataire');
  res.redirect('/mon-compte');
});

router.get('/inscription', (req, res) => {
  res.render('auth/register', { title: 'Créer un compte' });
});

router.post('/inscription', async (req, res) => {
  const db = req.db;
  const { name, email, phone, password, passwordConfirm } = req.body;

  if (!name || !email || !password) {
    req.flash('error', 'Veuillez remplir tous les champs obligatoires.');
    return res.redirect('/inscription');
  }
  if (password !== passwordConfirm) {
    req.flash('error', 'Les mots de passe ne correspondent pas.');
    return res.redirect('/inscription');
  }
  if (db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    req.flash('error', 'Un compte existe déjà avec cet email.');
    return res.redirect('/inscription');
  }

  const user = {
    id: uuid(), role: 'traveler', name, email, phone: phone || '',
    passwordHash: bcrypt.hashSync(password, 10), favorites: [], createdAt: new Date().toISOString()
  };
  db.data.users.push(user);
  await db.write();

  req.session.userId = user.id;
  req.flash('success', 'Compte créé avec succès ! Bienvenue sur AzulLink.');
  res.redirect('/mon-compte');
});

router.get('/deconnexion', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;
