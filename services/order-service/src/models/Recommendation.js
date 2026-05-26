const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  recommendations: { type: Array, default: [] },
  generatedAt: { type: Date, default: Date.now, expires: 86400 },
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
