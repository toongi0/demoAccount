var express = require('express');
var router = express.Router();
const AccountModel = require('../models/account.model');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');

const storage = multer.diskStorage({
  destination: (reg, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (reg, file, cb) => {
    cb(null, `img-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {fileSize: 5*1024*1024}
});

// account
router.get('/', async (req, res) => {
  const accounts = await AccountModel.find();
  res.render('account/index', { accounts });
});

// account/search
router.get('/search', async (req, res) => {
  email = req.query.email;
  const accounts = await AccountModel.find({email: new RegExp(email)});
  res.render('account/index', { accounts });
});

// account/create
router.get('/create', (req, res) => {
  res.render('account/create');
});

router.post('/create', [
  upload.single('image'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email is invalid'),
  body('password').notEmpty().withMessage('Password is required').isLength({min: 3}).withMessage('Password must be at least 3 characters'),
  body('confirm').custom((value, {req}) => value === req.body.password).withMessage('Password and confirm must be the same')
],async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors);
    return res.render('account/create', { errors: errors.errors });
  }
  try {
    let acc = req.body;
    const img = req.file ? req.file.filename : '';
    acc.image = img;
    await AccountModel.create(acc);
    res.redirect('/account');
  } catch (error) {
    console.log(`Error create account: ${error}`);
    res.redirect('/account/create');
  }
})

module.exports = router;
