module.exports = {
  needLogin: (req, res, next) => {
    if(!req.cookies.vidjot) {
      req.flash('error', 'Please log in first...');
      res.redirect('/users/login');
    } else {
      next();
    }
  },
  loggedIn: (req, res, next) => {
    if(req.cookies.vidjot) {
      req.flash('error', 'You dont have permission to visit this page...');
      res.redirect('/');
    } else {
      next();
    }
  }
}