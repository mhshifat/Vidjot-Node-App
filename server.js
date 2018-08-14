const express = require("express")
const layout = require("express-ejs-layouts")
const color = require("colors")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const flash = require("connect-flash")
const bcrypt = require("bcryptjs")

const config = require("./config/config")
const { empty } = require('./helpers/functions')

const Idea = require('./models/Idea')
const User = require('./models/User')

const middlewares = require('./middlewares/middlewares')

require('./database/conn')

const app = express()

app.use(layout)
app.use(session({
  secret: 'vidjot App',
  resave: false,
  saveUninitialized: true
}))
app.use(flash())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.set('layout', 'layout/layout')
app.use(express.static('public'))

app.use((req, res, next) => {
  res.locals.user = req.cookies.vidjot
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  next()
})

app.get('/', (req, res) => {
  res.render('pages/home')
})

app.get('/about', (req, res) => {
  res.render('pages/about')
})

app.get('/ideas', middlewares.needLogin, (req, res) => {
  Idea.find({}).sort({createdAt: -1}).exec((err, ideas) => {
    if (err) {
      console.log(err)
    } else {
      res.render('pages/ideas/ideas', { ideas })
    }
  })
})

app.get('/ideas/add', middlewares.needLogin, (req, res) => {
  res.render('pages/ideas/add')
})

app.post('/ideas/add', middlewares.needLogin, (req, res) => {
  if (empty(req.body.title, req.body.details)) {
    req.flash('error', 'Please fill out all the required fields')
    res.redirect('/ideas/add')
  } else {
    const idea = {
      title: req.body.title,
      details: req.body.details
    }
    Idea.create(idea, (err, idea) => {
      if (err) {
        console.log(err)
      } else {
        req.flash('success', 'Your idea has been savved')
        res.redirect('/ideas')
      }
    })
  }
})

app.get('/ideas/edit/:title', middlewares.needLogin, (req, res) => {
  Idea.findOne({title: req.params.title}).exec((err, idea) => {
    if (err) {
      console.log(err)
    } else {
      res.render('pages/ideas/edit', { idea })
    }
  })
})

app.post('/ideas/edit/:id', middlewares.needLogin, (req, res) => {
  const idea = {
    title: req.body.title,
    details: req.body.details
  }
  Idea.findByIdAndUpdate(req.params.id, idea).exec((err, idea) => {
    if (err) {
      console.log(err)
    } else {
      req.flash('success', 'Your Idea Has Been Updated')
      res.redirect('/ideas')
    }
  })
})

app.get('/ideas/delete/:id', middlewares.needLogin, (req, res) => {
  Idea.findByIdAndRemove(req.params.id).exec((err, idea) => {
    if (err) {
      console.log(err)
    } else {
      req.flash('success', 'Your Idea Has Been Deleted')
      res.redirect('/ideas')
    }
  })
})

app.get('/users/login', middlewares.loggedIn, (req, res) => {
  res.render('pages/users/login')
})

app.post('/users/login', middlewares.loggedIn, (req, res) => {
  if (empty(req.body.email, req.body.password)) {
    req.flash('error', 'Please fill out all the required fields')
    res.redirect('/users/login')
  } else {
    User.findOne({email: req.body.email}).exec((err, foundUser) => {
      if (err) {
        console.log(err)
      } else {
        if (foundUser === null) {
          req.flash('error', 'No user found of this email')
          res.redirect('/users/login')
        } else {
          bcrypt.compare(req.body.password, foundUser.password, (err, pwdMatched) => {
            if (err) {
              console.log(err)
            } else {
              if (!pwdMatched) {
                req.flash('error', 'Password does not match')
                res.redirect('/users/login')
              } else {
                res.cookie('vidjot', foundUser.username, {maxAge: 24 * 30 * 3600000})
                req.flash('success', 'You are now looged in')
                res.redirect('/ideas')
              }
            }
          })
        }
      }
    })
  }
})

app.get('/users/register', middlewares.loggedIn, (req, res) => {
  res.render('pages/users/register')
})

app.post('/users/register', middlewares.loggedIn, (req, res) => {
  if (empty(req.body.name, req.body.email) || !req.body.password) {
    req.flash('error', 'Please fill out all the required fields')
    res.redirect('/users/register')
  } else {
    User.findOne({email: req.body.email}).exec((err, foundUser) => {
      if (err) {
        console.log(err)
      } else {
        if (foundUser !== null) {
          req.flash('error', 'A user of this email already exists')
          res.redirect('/users/register')
        } else {
          bcrypt.hash(req.body.password, 10, (err, hashedPwd) => {
            if (err) {
              console.log(err)
            } else {
              const user = {
                username: req.body.name,
                email: req.body.email,
                password: hashedPwd
              }
              User.create(user, (err, createdUser) => {
                if (err) {
                  console.log(err)
                } else {
                  req.flash('success', 'Your accoount has been created')
                  res.redirect('/users/login')
                }
              })
            }
          })
        }
      }
    })
  }
})

app.get('/users/logout', middlewares.needLogin, (req, res) => {
  res.clearCookie('vidjot')
  req.flash('success', 'Your have been looged out')
  res.redirect('/users/login')
})

app.listen(config.port, () => {
  console.log(color.green(`==> The Server Is Running On http://localhost:${config.port}`))
})