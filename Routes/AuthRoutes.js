const express = require('express');
const { studentSignup, studentLogin, tutorSignup, tutorLogin, logout } = require('../Controllers/authController');

const router = express.Router();

// Student Auth
router.post('/student/signup', studentSignup);
router.post('/student/login', studentLogin);

// Tutor Auth
router.post('/tutor/signup', tutorSignup);
router.post('/tutor/login', tutorLogin);

// Logout
router.post('/logout', logout);

module.exports = router;