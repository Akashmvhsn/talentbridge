const mongoose = require('mongoose');

const openingSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Role title is required'], trim: true },
    company: { type: String, required: [true, 'Company is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    workMode: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    description: { type: String, trim: true, default: '' },
    requirements: { type: [String], default: [] },
    companySpecificRequirements: { type: String, trim: true, default: '' },
    applicationLink: { type: String, trim: true, default: '' },
    contactEmail: { type: String, required: [true, 'Contact email is required'], trim: true, lowercase: true },
    contactPhone: { type: String, trim: true, default: '' }, // never sent until revealed
    placementCount: { type: Number, default: 0 },
    // one entry per (user, type): email | apply | phone -> powers "community signals"
    signals: [{ _id: false, user: mongoose.Schema.Types.ObjectId, type: { type: String } }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Public shape: hide phone + raw signals, expose a flag instead
openingSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.hasPhone = !!ret.contactPhone;
    delete ret.contactPhone;
    delete ret.signals;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Opening', openingSchema);
