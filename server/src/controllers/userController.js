const Opening = require('../models/Opening');
const Placement = require('../models/Placement');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, company, role, phone } = req.body;
  if (name !== undefined && !String(name).trim()) throw httpError(400, 'Name cannot be empty');

  const user = req.user;
  if (name !== undefined) user.name = name;
  if (company !== undefined) user.company = company;
  if (role !== undefined) user.role = role;
  if (phone !== undefined) user.phone = phone;
  await user.save();
  res.json({ user });
});

// Profile & trust numbers
exports.myStats = asyncHandler(async (req, res) => {
  const openings = await Opening.find({ postedBy: req.user._id }).select('signals');
  const ids = openings.map((o) => o._id);

  const placements = await Placement.find({ opening: { $in: ids } })
    .sort({ createdAt: -1 })
    .populate('user', 'name')
    .populate('opening', 'title company');

  res.json({
    verifiedPlacements: placements.length,
    communitySignals: openings.reduce((sum, o) => sum + o.signals.length, 0),
    placements,
  });
});
