// npm run seed  -> creates the "Senior Product Designer" sample from the UI
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Opening = require('./models/Opening');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let asha = await User.findOne({ email: 'asha@northstarlabs.com' });
  if (!asha) {
    asha = await User.create({
      name: 'Asha Rao',
      email: 'asha@northstarlabs.com',
      password: 'Password123',
      company: 'Northstar Labs',
      role: 'People Partner',
    });
  }

  if (!(await Opening.exists({ postedBy: asha._id, title: 'Senior Product Designer' }))) {
    await Opening.create({
      postedBy: asha._id,
      title: 'Senior Product Designer',
      company: 'Northstar Labs',
      location: 'New York',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      description: 'Shape product experiences with a close, thoughtful design team.',
      requirements: ['5+ years product design', 'Strong Figma skills'],
      companySpecificRequirements: 'Portfolio must show shipped B2B work.',
      applicationLink: 'https://example.com/careers/senior-product-designer',
      contactEmail: 'asha@northstarlabs.com',
      placementCount: 1,
    });
  }

  console.log('Seeded. Login: asha@northstarlabs.com / Password123');
  await mongoose.disconnect();
})();
