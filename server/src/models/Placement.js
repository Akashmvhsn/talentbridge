const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema(
  {
    opening: { type: mongoose.Schema.Types.ObjectId, ref: 'Opening', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// a person can confirm a given opening only once
placementSchema.index({ opening: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Placement', placementSchema);
