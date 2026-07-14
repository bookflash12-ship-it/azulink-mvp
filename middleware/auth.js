export function attachUser(db) {
  return (req, res, next) => {
    res.locals.currentUser = null;
    if (req.session && req.session.userId) {
      const user = db.data.users.find(u => u.id === req.session.userId);
      if (user) {
        res.locals.currentUser = user;
      }
    }
    res.locals.path = req.path;
    next();
  };
}

export function requireAuth(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page.');
      return res.redirect('/connexion?redirect=' + encodeURIComponent(req.originalUrl));
    }
    if (role && res.locals.currentUser && res.locals.currentUser.role !== role) {
      req.flash('error', "Vous n'avez pas accès à cet espace.");
      return res.redirect('/');
    }
    next();
  };
}
