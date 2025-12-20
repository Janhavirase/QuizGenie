const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

// 📥 SAVE SCORE
router.post('/', async (req, res) => {
  try {
    const { userId, quizTitle, score, totalQuestions } = req.body;
    
    // Simple math for percentage
    const percentage = Math.round((score / totalQuestions) * 100);

    const newResult = new Result({
      userId,
      quizTitle,
      score,
      totalQuestions,
      percentage
    });

    await newResult.save();
    res.status(201).json(newResult);
  } catch (err) {
    res.status(500).json({ message: "Failed to save score" });
  }
});

// 📤 GET USER HISTORY
router.get('/:userId', async (req, res) => {
  try {
    const history = await Result.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

module.exports = router;