const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const snackRoutes = require('./snackRoutes');
const ratingRoutes = require('./ratingRoutes');
const commentRoutes = require('./commentRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/snacks', snackRoutes);
router.use('/snacks', ratingRoutes);
router.use('/snacks', commentRoutes);
router.use('/leaderboard', leaderboardRoutes);

module.exports = router;

