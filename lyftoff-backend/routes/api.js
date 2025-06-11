const express = require('express');
const cors = require('cors');
const { authenticateToken } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User, Profile, Roadmap, RoadmapStep, ProfileDocument, Goal } = require('../models');
const multer = require('multer');
const cache = require('memory-cache');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(cors({ origin: 'http://localhost:3001' }));
router.use((req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.url} at ${new Date().toISOString()}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} took ${duration}ms`);
  });
  next();
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const retryQuery = async (fn, retries = 3, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

async function calculateReport(userId) {
  if (!User || !Profile || !Roadmap || !RoadmapStep || !Goal) {
    throw new Error('Required models are not defined. Check models/index.js.');
  }
  let profile, roadmaps, goals;
  try {
    profile = await retryQuery(() => Profile.findOne({ where: { userId }, include: [User] })) || {};
    roadmaps = await retryQuery(() =>
      Roadmap.findAll({
        where: { userId },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    ) || [];
    goals = await retryQuery(() => Goal.findAll({ where: { userId } })) || [];
  } catch (err) {
    console.error('Database query error:', err.message);
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error('Database table missing. Run migrations for Goals table.');
    }
    throw err;
  }

  const completedSteps = roadmaps.flatMap(r => r.roads || []).filter(s => s.completed).length;
  const totalSteps = roadmaps.flatMap(r => r.roads || []).length;
  const stepsWithDeadlines = roadmaps.flatMap(r => r.roads || []).filter(s => s.deadline).length;
  const completedRoadmaps = roadmaps.filter(r => r.status === 'completed').length;
  const completedGoals = goals.filter(g => g.progress === 100).length;
  const totalGoals = goals.length;
  const profileComplete = profile && profile.firstName && profile.bio && profile.interests ? 1 : 0.5;
  const score = Math.min(100, Math.round(
    (completedSteps / (totalSteps || 1)) * 30 +
    (completedGoals / (totalGoals || 1)) * 20 +
    profileComplete * 20 +
    roadmaps.length * 15 +
    (profile?.achievements ? JSON.parse(profile.achievements || '[]').length : 0) * 15
  ));

  const stageCategories = {
    'high-school': {
      ScholasticAchievement: profile?.interests?.includes('SAT') ? 85 : 60,
      ExtracurricularActivity: roadmaps.length > 1 ? 90 : 50,
      Nobility: profile?.bio?.includes('volunteer') ? 85 : 65,
      Leadership: totalSteps > 5 ? 80 : 50,
      Innovativeness: completedSteps > 2 ? 85 : 60,
    },
    'university': {
      ScholasticAchievement: profile?.interests?.includes('university') ? 85 : 70,
      ExtracurricularActivity: roadmaps.length > 2 ? 90 : 60,
      Nobility: profile?.bio?.includes('community') ? 85 : 65,
      Leadership: totalSteps > 10 ? 80 : 60,
      Innovativeness: completedSteps > 5 ? 90 : 70,
    },
    'professional': {
      ScholasticAchievement: profile?.interests?.includes('certification') ? 85 : 60,
      ExtracurricularActivity: roadmaps.length > 2 ? 85 : 50,
      Nobility: profile?.bio?.includes('impact') ? 85 : 65,
      Leadership: totalSteps > 15 ? 80 : 60,
      Innovativeness: completedSteps > 10 ? 90 : 70,
    },
  };

  let achievements = [];
  if (profile?.achievements) {
    try {
      achievements = typeof profile.achievements === 'string' ? JSON.parse(profile.achievements) : profile.achievements;
    } catch (e) {
      console.warn(`Invalid achievements JSON for user ${userId}:`, profile.achievements);
      achievements = ['Deans List', 'Club Award'];
    }
  } else {
    achievements = ['Deans List', 'Club Award'];
  }

  const recommendations = {
    'high-school': {
      institutions: [{ name: 'MIT', fit: 'High', reason: 'STEM focus' }, { name: 'UCLA', fit: 'Medium', reason: 'Diverse programs' }],
      scholarships: [{ name: 'SAT Merit', amount: '$5,000', eligibility: 'SAT > 1400' }],
    },
    'university': {
      institutions: [{ name: 'Stanford', fit: 'High', reason: 'Innovation hub' }, { name: 'NYU', fit: 'Medium', reason: 'Internships' }],
      scholarships: [{ name: 'Intern Grant', amount: '$3,000', eligibility: 'Internship' }],
    },
    'professional': {
      institutions: [{ name: 'Google Certs', fit: 'High', reason: 'Tech skills' }, { name: 'AWS Training', fit: 'High', reason: 'Cloud expertise' }],
      scholarships: [{ name: 'Career Boost', amount: '$2,000', eligibility: 'Job transition' }],
    },
  };

  const careerPaths = {
    'high-school': profile?.longTermGoal?.includes('Engineer') ? ['Engineer Prep', 'CS Explorer'] : ['Uni Prep', 'Career Starter'],
    'university': profile?.longTermGoal?.includes('Engineer') ? ['Software Engineer', 'Data Analyst'] : ['Business Analyst', 'Marketing'],
    'professional': profile?.longTermGoal?.includes('job') ? ['Senior Developer', 'Manager'] : ['Consultant', 'Entrepreneur'],
  };

  const stage = profile?.User?.academicLevel || 'high-school';
  const historicalScores = [
    { date: '2025-04-26', score: 60 },
    { date: '2025-04-27', score: 65 },
    { date: '2025-04-28', score: 70 },
    { date: '2025-04-29', score: 75 },
    { date: '2025-04-30', score },
    { date: '2025-05-01', score },
  ];

  return {
    score,
    categories: stageCategories[stage],
    profile: {
      firstName: profile?.User?.firstName || '',
      interests: profile?.interests || [],
      bio: profile?.bio || '',
      academicLevel: stage,
    },
    achievements,
    recommendations: recommendations[stage],
    careerPaths: careerPaths[stage],
    roadmapStats: {
      totalRoadmaps: roadmaps.length,
      completedRoadmaps,
      totalSteps,
      completedSteps,
      stepsWithDeadlines,
    },
    goalStats: {
      totalGoals,
      completedGoals,
    },
    historicalScores,
    timestamp: new Date().toISOString(),
  };
}

async function logError(err, url) {
  try {
    await fetch('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
        url,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (logErr) {
    console.error('Failed to log error:', logErr.message);
  }
}

async function logAnalytics(userId, event, data) {
  try {
    await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret')}`,
      },
      body: JSON.stringify({ event, data }),
    });
  } catch (err) {
    console.error('Analytics log error:', err.message);
  }
}

async function checkAchievements(userId) {
  const roadmaps = await retryQuery(() =>
    Roadmap.findAll({
      where: { userId },
      include: [{ model: RoadmapStep, as: 'roads' }],
    })
  );
  const totalSteps = roadmaps.flatMap(r => r.roads || []).length;
  const completedSteps = roadmaps.flatMap(r => r.roads || []).filter(s => s.completed).length;
  const completedRoadmaps = roadmaps.filter(r => r.status === 'completed').length;

  const achievements = [];
  if (totalSteps >= 5) achievements.push({ name: 'Step Starter', description: 'Created 5 steps' });
  if (completedSteps >= 5) achievements.push({ name: 'Task Master', description: 'Completed 5 steps' });
  if (completedRoadmaps >= 1) achievements.push({ name: 'Roadmap Finisher', description: 'Completed a roadmap' });
  if (totalSteps >= 10) achievements.push({ name: 'Planner Pro', description: 'Created 10 steps' });

  const profile = await retryQuery(() => Profile.findOne({ where: { userId } }));
  let existingAchievements = [];
  if (profile.achievements) {
    try {
      existingAchievements = typeof profile.achievements === 'string' ? JSON.parse(profile.achievements) : profile.achievements;
    } catch (e) {
      console.warn(`Invalid achievements JSON for user ${userId}:`, profile.achievements);
      existingAchievements = [];
    }
  }
  const newAchievements = achievements.filter(a => !existingAchievements.some(e => e.name === a.name));
  if (newAchievements.length) {
    await retryQuery(() =>
      Profile.update(
        { achievements: JSON.stringify([...existingAchievements, ...newAchievements]) },
        { where: { userId } }
      )
    );
    cache.del(`profile_${userId}`);
  }

  return [...existingAchievements, ...newAchievements];
}

function mockAIAdjustRoadmap(userId, longTermGoal, shortTermGoals) {
  return new Promise(resolve => {
    setTimeout(() => {
      const adjustments = {
        userId,
        longTermGoal,
        shortTermGoals,
        suggestedSteps: shortTermGoals.map(goal => ({ description: `Work on ${goal}`, order: 1 })),
      };
      resolve(adjustments);
    }, 1000);
  });
}

router.get('/home', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    const stage = profile?.academicLevel || 'high-school';
    const feed = [
      { type: 'task', text: `Complete ${stage === 'high-school' ? 'SAT Prep' : stage === 'university' ? 'Internship App' : 'Resume Update'}` },
      { type: 'update', text: 'Profile updated!' },
    ];
    const articles = [
      { title: `${stage === 'high-school' ? 'SAT Tips' : stage === 'university' ? 'Internship Guide' : 'Career Hacks'}`, image: '/static/placeholder.jpg', link: '#' },
    ];
    res.json({ feed, articles });
  } catch (err) {
    console.error('Home fetch error:', err.message, err.stack);
    await logError(err, '/home');
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `profile_${req.user.id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cached);
    }
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id }, include: [User] })) || {};
    let shortTermGoals = [''];
    let scenarios = [];
    let achievements = [];
    if (profile.shortTermGoals) {
      shortTermGoals = typeof profile.shortTermGoals === 'string' ? JSON.parse(profile.shortTermGoals) : profile.shortTermGoals;
    }
    if (profile.scenarios) {
      scenarios = typeof profile.scenarios === 'string' ? JSON.parse(profile.scenarios) : profile.scenarios;
    }
    if (profile.achievements) {
      try {
        achievements = typeof profile.achievements === 'string' ? JSON.parse(profile.achievements) : profile.achievements;
      } catch (e) {
        console.warn(`Invalid achievements JSON for user ${req.user.id}:`, profile.achievements);
        achievements = [];
      }
    }
    const completion = Object.values({
      firstName: profile.User?.firstName,
      lastName: profile.lastName,
      academicLevel: profile.User?.academicLevel,
      interests: profile.interests,
      bio: profile.bio,
      longTermGoal: profile.longTermGoal,
    }).filter(v => v).length / 6 * 100;
    const prompts = [];
    if (!profile.bio) prompts.push({ field: 'bio', message: 'Add a bio to showcase your personality!' });
    if (!profile.interests) prompts.push({ field: 'interests', message: 'List your interests!' });
    if (!profile.longTermGoal) prompts.push({ field: 'longTermGoal', message: 'Set a long-term goal!' });
    const response = {
      firstName: profile.User?.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      academicLevel: profile.User?.academicLevel || '',
      interests: profile.interests || '',
      bio: profile.bio || '',
      avatarUrl: profile.avatarUrl || '',
      longTermGoal: profile.longTermGoal || '',
      shortTermGoals,
      scenarios,
      achievements,
      onboarding: profile.onboarding ? JSON.parse(profile.onboarding) : {},
      scenario: profile.scenario || '',
      notifications: profile.notifications ?? true,
      darkMode: profile.darkMode ?? false,
      completion,
      prompts,
      userId: req.user.id,
    };
    cache.put(cacheKey, response, 5 * 60 * 1000);
    res.json(response);
  } catch (err) {
    console.error('Profile fetch error:', err.message, err.stack);
    await logError(err, '/profile');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/profile', authenticateToken, [
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('academicLevel').optional().isIn(['high-school', 'university', 'professional']),
  body('darkMode').optional().isBoolean(),
], validate, async (req, res) => {
  try {
    const { firstName, academicLevel, ...profileData } = req.body;
    await User.update({ firstName, academicLevel }, { where: { id: req.user.id } });
    const data = {
      ...profileData,
      userId: req.user.id,
      shortTermGoals: JSON.stringify(req.body.shortTermGoals || ['']),
      achievements: JSON.stringify(req.body.achievements || []),
      scenarios: JSON.stringify(req.body.scenarios || []),
      onboarding: req.body.onboarding || JSON.stringify({ completed: false }),
      notifications: req.body.notifications ?? true,
      darkMode: req.body.darkMode ?? false,
    };
    const [profile] = await retryQuery(() => Profile.upsert(data));
    cache.del(`profile_${req.user.id}`);
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('profile_update', { ...data, userId: req.user.id });
    res.json(profile);
  } catch (err) {
    console.error('Profile save error:', err.message, err.stack);
    await logError(err, '/profile');
    res.status(500).json({ error: 'Failed to save profile', details: err.message });
  }
});

router.post('/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    await retryQuery(() => Profile.update({ avatarUrl }, { where: { userId: req.user.id } }));
    cache.del(`profile_${req.user.id}`);
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('profile_update', { avatarUrl, userId: req.user.id });
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err.message, err.stack);
    await logError(err, '/profile/avatar');
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { profile, roadmaps, steps } = req.body;
    if (profile) {
      const { firstName, academicLevel, ...profileData } = profile;
      await User.update({ firstName, academicLevel }, { where: { id: req.user.id } });
      const data = {
        ...profileData,
        userId: req.user.id,
        shortTermGoals: JSON.stringify(profile.shortTermGoals || ['']),
        scenarios: JSON.stringify(profile.scenarios || []),
        achievements: JSON.stringify(profile.achievements || []),
        onboarding: profile.onboarding || JSON.stringify({ completed: false }),
        notifications: profile.notifications ?? true,
        darkMode: profile.darkMode ?? false,
      };
      await retryQuery(() => Profile.upsert(data));
      cache.del(`profile_${req.user.id}`);
      const io = req.app.get('io');
      io.to(`user_${req.user.id}`).emit('profile_update', { ...data, userId: req.user.id });
    }
    if (roadmaps && Array.isArray(roadmaps)) {
      for (const roadmap of roadmaps) {
        const { id, ...roadmapData } = roadmap;
        await retryQuery(() =>
          Roadmap.upsert({
            ...roadmapData,
            userId: req.user.id,
            id: id || undefined,
          })
        );
      }
      cache.del(`roadmaps_${req.user.id}`);
    }
    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        const { id, roadmapId, ...stepData } = step;
        await retryQuery(() =>
          RoadmapStep.upsert({
            ...stepData,
            roadmapId,
            id: id || undefined,
          })
        );
      }
      cache.del(`roadmaps_${req.user.id}`);
    }
    res.json({ message: 'Sync complete' });
  } catch (err) {
    console.error('Sync error:', err.message, err.stack);
    await logError(err, '/sync');
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await retryQuery(() => Goal.findAll({ where: { userId: req.user.id } }));
    res.json(goals);
  } catch (err) {
    console.error('Goals fetch error:', err.message, err.stack);
    await logError(err, '/goals');
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/goals', authenticateToken, [
  body('title').notEmpty(),
  body('category').optional().isIn(['Academic', 'Career', 'Personal']),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
], validate, async (req, res) => {
  try {
    const goal = await retryQuery(() =>
      Goal.create({
        ...req.body,
        userId: req.user.id,
      })
    );
    await logAnalytics(req.user.id, 'goal_created', { goalId: goal.id });
    res.json(goal);
  } catch (err) {
    console.error('Goal create error:', err.message, err.stack);
    await logError(err, '/goals');
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

router.patch('/goals/:id', authenticateToken, [
  param('id').isUUID(),
  body('progress').optional().isInt({ min: 0, max: 100 }),
], validate, async (req, res) => {
  try {
    const goal = await retryQuery(() => Goal.findOne({ where: { id: req.params.id, userId: req.user.id } }));
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    await retryQuery(() => goal.update(req.body));
    if (req.body.progress === 100) {
      await logAnalytics(req.user.id, 'goal_completed', { goalId: goal.id });
    }
    res.json(goal);
  } catch (err) {
    console.error('Goal update error:', err.message, err.stack);
    await logError(err, `/goals/${req.params.id}`);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.post('/profile/goals', authenticateToken, async (req, res) => {
  try {
    const { longTermGoal, shortTermGoals } = req.body;
    await retryQuery(() =>
      Profile.update(
        { longTermGoal, shortTermGoals: JSON.stringify(shortTermGoals) },
        { where: { userId: req.user.id } }
      )
    );
    cache.del(`profile_${req.user.id}`);
    const roadmapUpdates = await mockAIAdjustRoadmap(req.user.id, longTermGoal, shortTermGoals);
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('profile_update', { longTermGoal, shortTermGoals, userId: req.user.id });
    res.json({ message: 'Goals updated', roadmapUpdates });
  } catch (err) {
    console.error('Goals update error:', err.message, err.stack);
    await logError(err, '/profile/goals');
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

router.post('/profile/scenarios', authenticateToken, async (req, res) => {
  try {
    const { scenario } = req.body;
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    let scenarios = [];
    if (profile.scenarios) {
      scenarios = typeof profile.scenarios === 'string' ? JSON.parse(profile.scenarios) : profile.scenarios;
    }
    scenarios.push(scenario);
    await retryQuery(() =>
      Profile.update(
        { scenarios: JSON.stringify(scenarios) },
        { where: { userId: req.user.id } }
      )
    );
    cache.del(`profile_${req.user.id}`);
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('profile_update', { scenarios, userId: req.user.id });
    res.json({ message: 'Scenario saved', scenarios });
  } catch (err) {
    console.error('Scenario save error:', err.message, err.stack);
    await logError(err, '/profile/scenarios');
    res.status(500).json({ error: 'Failed to save scenario' });
  }
});

router.post('/profile/documents', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const doc = await retryQuery(() =>
      ProfileDocument.create({
        userId: req.user.id,
        path: file.path,
        name: file.originalname,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    res.json(doc);
  } catch (err) {
    console.error('Document upload error:', err.message, err.stack);
    await logError(err, '/profile/documents');
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/profile/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await retryQuery(() => ProfileDocument.findAll({ where: { userId: req.user.id } }));
    res.json(docs);
  } catch (err) {
    console.error('Documents fetch error:', err.message, err.stack);
    await logError(err, '/profile/documents');
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/roadmap', authenticateToken, async (req, res) => {
  try {
    const { title, goals, status, steps = [] } = req.body;
    const roadmap = await retryQuery(() =>
      Roadmap.create({
        userId: req.user.id,
        title,
        goals,
        status,
      })
    );
    if (steps.length) {
      const roadmapSteps = steps.map((step, index) => ({
        roadmapId: roadmap.id,
        description: step.description,
        order: index + 1,
        completed: step.completed || false,
        deadline: step.deadline || null,
      }));
      await retryQuery(() => RoadmapStep.bulkCreate(roadmapSteps));
    }
    const fullRoadmap = await retryQuery(() =>
      Roadmap.findOne({
        where: { id: roadmap.id },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    );
    cache.del(`roadmaps_${req.user.id}`);
    await logAnalytics(req.user.id, 'roadmap_created', { roadmapId: roadmap.id });
    res.json(fullRoadmap);
  } catch (err) {
    console.error('Roadmap create error:', err.message, err.stack);
    await logError(err, '/roadmap');
    res.status(500).json({ error: 'Failed to create roadmap' });
  }
});

router.get('/roadmaps', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `roadmaps_${req.user.id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cached);
    }
    const roadmaps = await retryQuery(() =>
      Roadmap.findAll({
        where: { userId: req.user.id },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    );
    cache.put(cacheKey, roadmaps, 10 * 60 * 1000);
    res.json(roadmaps);
  } catch (err) {
    console.error('Roadmaps fetch error:', err.message, err.stack);
    await logError(err, '/roadmaps');
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

router.get('/roadmap/suggestions', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    const stage = profile?.academicLevel || 'high-school';
    const suggestions = {
      'high-school': ['SAT Prep', 'Write Essay', 'Visit Colleges'],
      'university': ['Secure Internship', 'Build Portfolio', 'Join Club'],
      'professional': ['Update Resume', 'Network Event', 'Learn Skill'],
    };
    res.json(suggestions[stage]);
  } catch (err) {
    console.error('Suggestions fetch error:', err.message, err.stack);
    await logError(err, '/roadmap/suggestions');
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

router.get('/roadmap/:id', authenticateToken, async (req, res) => {
  try {
    const roadmap = await retryQuery(() =>
      Roadmap.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    );
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
    res.json(roadmap);
  } catch (err) {
    console.error('Roadmap fetch error:', err.message, err.stack);
    await logError(err, `/roadmap/${req.params.id}`);
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});

router.get('/roadmap/:id/share', authenticateToken, async (req, res) => {
  try {
    const roadmap = await retryQuery(() =>
      Roadmap.findOne({
        where: { id: req.params.id, userId: req.user.id },
      })
    );
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
    const shareUrl = `http://localhost:3001/roadmap/${roadmap.id}?shared=true`;
    res.json({ shareUrl });
  } catch (err) {
    console.error('Share roadmap error:', err.message, err.stack);
    await logError(err, `/roadmap/${req.params.id}/share`);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

router.put('/roadmap/:id', authenticateToken, [
  param('id').isInt(),
  body('title').optional().notEmpty(),
  body('goals').optional().isString(),
  body('status').optional().isIn(['planned', 'in-progress', 'completed']),
], validate, async (req, res) => {
  try {
    const [updated] = await retryQuery(() =>
      Roadmap.update(req.body, { where: { id: req.params.id, userId: req.user.id } })
    );
    if (updated) {
      const roadmap = await retryQuery(() =>
        Roadmap.findByPk(req.params.id, { include: [{ model: RoadmapStep, as: 'roads' }] })
      );
      cache.del(`roadmaps_${req.user.id}`);
      res.json(roadmap);
    } else {
      res.status(404).json({ error: 'Roadmap not found' });
    }
  } catch (err) {
    console.error('Roadmap update error:', err.message, err.stack);
    await logError(err, `/roadmap/${req.params.id}`);
    res.status(500).json({ error: 'Failed to update roadmap' });
  }
});

router.delete('/roadmap/:id', authenticateToken, [param('id').isInt()], validate, async (req, res) => {
  try {
    const deleted = await retryQuery(() =>
      Roadmap.destroy({ where: { id: req.params.id, userId: req.user.id } })
    );
    cache.del(`roadmaps_${req.user.id}`);
    res.json({ message: deleted ? 'Roadmap deleted' : 'Roadmap not found' });
  } catch (err) {
    console.error('Roadmap delete error:', err.message, err.stack);
    await logError(err, `/roadmap/${req.params.id}`);
    res.status(500).json({ error: 'Failed to delete roadmap' });
  }
});

router.post('/roadmap/:id/steps', authenticateToken, [
  param('id').isInt(),
  body().isArray().optional(),
  body('*.id').optional().isInt(),
  body('*.order').optional().isInt(),
  body('description').optional().notEmpty(),
  body('order').optional().isInt(),
  body('deadline').optional().isDate(),
], validate, async (req, res) => {
  try {
    const roadmap = await retryQuery(() =>
      Roadmap.findOne({ where: { id: req.params.id, userId: req.user.id } })
    );
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    if (req.body.description && req.body.order) {
      const step = await retryQuery(() =>
        RoadmapStep.create({
          roadmapId: roadmap.id,
          description: req.body.description,
          order: req.body.order,
          completed: req.body.completed || false,
          deadline: req.body.deadline || null,
        })
      );
      cache.del(`roadmaps_${req.user.id}`);
      const achievements = await checkAchievements(req.user.id);
      await logAnalytics(req.user.id, 'step_created', { roadmapId: roadmap.id, stepId: step.id });
      return res.status(201).json({ step, achievements });
    }

    if (Array.isArray(req.body)) {
      const updates = req.body.map(({ id, order }) => ({
        id,
        order,
      }));
      for (const { id, order } of updates) {
        await retryQuery(() =>
          RoadmapStep.update({ order }, { where: { id, roadmapId: roadmap.id } })
        );
      }
      cache.del(`roadmaps_${req.user.id}`);
      const updatedSteps = await retryQuery(() =>
        RoadmapStep.findAll({ where: { roadmapId: roadmap.id } })
      );
      const achievements = await checkAchievements(req.user.id);
      await logAnalytics(req.user.id, 'steps_reordered', { roadmapId: roadmap.id });
      return res.json({ steps: updatedSteps, achievements });
    }

    return res.status(400).json({ error: 'Invalid request body' });
  } catch (err) {
    console.error('Step create/reorder error:', err.message, err.stack);
    await logError(err, `/roadmap/${req.params.id}/steps`);
    res.status(500).json({ error: 'Failed to process steps' });
  }
});

router.put('/roadmap/step/:id', authenticateToken, [
  param('id').isInt(),
  body('description').optional().notEmpty(),
  body('order').optional().isInt(),
  body('completed').optional().isBoolean(),
  body('deadline').optional().isDate(),
], validate, async (req, res) => {
  try {
    const step = await retryQuery(() => RoadmapStep.findByPk(req.params.id));
    if (!step || !(await retryQuery(() =>
      Roadmap.findOne({ where: { id: step.roadmapId, userId: req.user.id } })
    ))) {
      return res.status(404).json({ error: 'Step not found' });
    }
    await retryQuery(() => step.update(req.body));
    cache.del(`roadmaps_${req.user.id}`);
    const achievements = await checkAchievements(req.user.id);
    if (req.body.completed) {
      await logAnalytics(req.user.id, 'step_completed', { stepId: req.params.id });
    }
    res.json({ step, achievements });
  } catch (err) {
    console.error('Step update error:', err.message, err.stack);
    await logError(err, `/roadmap/step/${req.params.id}`);
    res.status(500).json({ error: 'Failed to update step' });
  }
});

router.delete('/roadmap/step/:id', authenticateToken, [param('id').isInt()], validate, async (req, res) => {
  try {
    const step = await retryQuery(() => RoadmapStep.findByPk(req.params.id));
    if (!step || !(await retryQuery(() =>
      Roadmap.findOne({ where: { id: step.roadmapId, userId: req.user.id } })
    ))) {
      return res.status(404).json({ error: 'Step not found' });
    }
    await retryQuery(() => step.destroy());
    cache.del(`roadmaps_${req.user.id}`);
    await logAnalytics(req.user.id, 'step_deleted', { stepId: req.params.id });
    res.json({ message: 'Step deleted' });
  } catch (err) {
    console.error('Step delete error:', err.message, err.stack);
    await logError(err, `/roadmap/step/${req.params.id}`);
    res.status(500).json({ error: 'Failed to delete step' });
  }
});

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    const roadmaps = await retryQuery(() =>
      Roadmap.findAll({
        where: { userId: req.user.id },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    );
    const report = await calculateReport(req.user.id);
    const achievements = await checkAchievements(req.user.id);
    res.json({
      welcome: `Welcome back, ${profile?.firstName || 'User'}!`,
      roadmaps: roadmaps.slice(0, 3),
      score: report.score,
      achievements,
      completion: profile ? Object.values({
        firstName: profile.firstName,
        lastName: profile.lastName,
        academicLevel: profile.academicLevel,
        interests: profile.interests,
        bio: profile.bio,
        longTermGoal: profile.longTermGoal,
      }).filter(v => v).length / 6 * 100 : 0,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message, err.stack);
    await logError(err, '/dashboard');
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const roadmaps = await retryQuery(() =>
      Roadmap.findAll({
        where: { userId: req.user.id },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    );
    const notifications = roadmaps.flatMap(roadmap =>
      (roadmap.roads || []).filter(step => step.deadline && !step.completed).map(step => {
        const deadline = new Date(step.deadline);
        const now = new Date();
        const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 3 && daysUntil >= 0) {
          return {
            id: step.id,
            message: `Step "${step.description}" in "${roadmap.title}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
          };
        }
        return null;
      }).filter(n => n)
    );
    res.json(notifications);
  } catch (err) {
    console.error('Notifications fetch error:', err.message, err.stack);
    await logError(err, '/notifications');
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications/email', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    if (!profile.email || !profile.notifications) {
      return res.status(400).json({ error: 'Email notifications disabled or no email set' });
    }
    const roadmaps = await retryQuery(() =>
      Roadmap.findAll({
        where: { userId: req.user.id },
        include: [{ model: RoadmapStep, as: 'roads' }],
      })
    );
    const notifications = roadmaps.flatMap(roadmap =>
      (roadmap.roads || []).filter(step => step.deadline && !step.completed).map(step => {
        const deadline = new Date(step.deadline);
        const now = new Date();
        const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 3 && daysUntil >= 0) {
          return {
            id: step.id,
            message: `Step "${step.description}" in "${roadmap.title}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
          };
        }
        return null;
      }).filter(n => n)
    );
    if (!notifications.length) {
      return res.json({ message: 'No notifications to send' });
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || 'your-mailtrap-user',
        pass: process.env.SMTP_PASS || 'your-mailtrap-pass',
      },
    });
    await transporter.sendMail({
      from: '"LyftOff" <no-reply@lyftoff.com>',
      to: profile.email,
      subject: 'LyftOff Deadline Reminders',
      text: notifications.map(n => n.message).join('\n'),
      html: `<p>${notifications.map(n => n.message).join('<br>')}</p>`,
    });
    res.json({ message: 'Email notifications sent' });
  } catch (err) {
    console.error('Email notification error:', err.message, err.stack);
    await logError(err, '/notifications/email');
    res.status(500).json({ error: 'Failed to send email notifications' });
  }
});

router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await checkAchievements(req.user.id);
    res.json(achievements);
  } catch (err) {
    console.error('Achievements fetch error:', err.message, err.stack);
    await logError(err, '/achievements');
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

router.post('/community/posts', authenticateToken, [
  body('content').notEmpty(),
], validate, async (req, res) => {
  try {
    const { content, careerId } = req.body;
    const post = {
      id: require('uuid').v4(),
      userId: req.user.id,
      content,
      careerId,
      createdAt: new Date(),
    };
    await logAnalytics(req.user.id, 'community_post', { postId: post.id });
    res.json(post);
  } catch (err) {
    console.error('Community post error:', err.message, err.stack);
    await logError(err, '/community/posts');
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.post('/feedback', authenticateToken, [
  body('message').notEmpty(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
], validate, async (req, res) => {
  try {
    const { message, rating } = req.body;
    console.log(`Feedback from user ${req.user.id}:`, { message, rating });
    res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error('Feedback error:', err.message, err.stack);
    await logError(err, '/feedback');
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

router.post('/analytics', authenticateToken, async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log(`Analytics event from user ${req.user.id}:`, { event, data });
    res.status(201).json({ message: 'Event logged' });
  } catch (err) {
    console.error('Analytics error:', err.message, err.stack);
    await logError(err, '/analytics');
    res.status(500).json({ error: 'Failed to log analytics' });
  }
});

router.post('/logs', async (req, res) => {
  try {
    const { error, stack, url, timestamp } = req.body;
    console.error(`Log: ${error} at ${url} on ${timestamp}`, stack);
    res.status(201).json({ message: 'Log recorded' });
  } catch (err) {
    console.error('Log save error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

router.get('/scenarios', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    const stage = profile?.academicLevel || 'high-school';
    const careers = [
      {
        id: '1',
        title: 'Software Engineer',
        description: 'Develop software applications.',
        salary: 120000,
        skills: ['Python', 'JavaScript', 'SQL'],
        education: 'BS in Computer Science',
        prerequisites: [{ id: '2', title: 'Learn Python' }],
        demand: 'High',
        growth: '22% (2020-2030)',
      },
      {
        id: '2',
        title: 'Learn Python',
        description: 'Master Python programming.',
        salary: 0,
        skills: ['Python'],
        education: 'Online Course',
        prerequisites: [],
        demand: 'N/A',
        growth: 'N/A',
      },
      {
        id: '3',
        title: 'Data Scientist',
        description: 'Analyze data to drive decisions.',
        salary: 130000,
        skills: ['Python', 'R', 'Machine Learning'],
        education: 'MS in Data Science',
        prerequisites: [{ id: '2', title: 'Learn Python' }],
        demand: 'High',
        growth: '36% (2020-2030)',
      },
    ].filter(career => {
      if (stage === 'high-school' && career.salary > 0) return false;
      if (stage === 'university' && career.title === 'Learn Python') return false;
      return true;
    });
    res.json(careers);
  } catch (err) {
    console.error('Scenarios fetch error:', err.message, err.stack);
    await logError(err, '/scenarios');
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

router.post('/scenarios', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    const { choice } = req.body;
    const stage = profile?.academicLevel || 'high-school';
    const outcomes = {
      'high-school': {
        'Ace SAT': { outcome: 'Boost uni chances by 20%', probability: 70, nextSteps: ['Apply to top unis', 'Seek scholarships'] },
        'Join Club': { outcome: 'Build leadership', probability: 85, nextSteps: ['Run for officer role', 'Organize event'] },
      },
      'university': {
        'Switch Major': { outcome: 'New career path in 2 years', probability: 60, nextSteps: ['Meet advisor', 'Take intro course'] },
        'Intern': { outcome: 'Job offer potential', probability: 75, nextSteps: ['Build portfolio', 'Network with pros'] },
      },
      'professional': {
        'Relocate': { outcome: 'Wider job market', probability: 65, nextSteps: ['Research cities', 'Update resume'] },
        'Certify': { outcome: 'Salary bump in 6 months', probability: 80, nextSteps: ['Enroll in course', 'Study daily'] },
      },
    };
    const result = outcomes[stage][choice] || { outcome: 'Keep exploring!', probability: 50, nextSteps: ['Try another scenario'] };
    await logAnalytics(req.user.id, 'scenario_explored', { choice });
    res.json({ choice, ...result });
  } catch (err) {
    console.error('Scenario error:', err.message, err.stack);
    await logError(err, '/scenarios');
    res.status(500).json({ error: 'Failed to plan scenario' });
  }
});

router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const profile = await retryQuery(() => Profile.findOne({ where: { userId: req.user.id } }));
    const stage = profile?.academicLevel || 'high-school';
    const resources = {
      'high-school': [
        { title: 'SAT Prep', link: 'https://www.khanacademy.org/sat', desc: 'Free test practice' },
        { title: 'Common App', link: 'https://www.commonapp.org', desc: 'Apply to uni' },
      ],
      'university': [
        { title: 'Internships', link: 'https://www.internships.com', desc: 'Find career gigs' },
        { title: 'Portfolio Tips', link: 'https://www.github.com', desc: 'Showcase work' },
      ],
      'professional': [
        { title: 'Job Boards', link: 'https://www.indeed.com', desc: 'Hunt jobs' },
        { title: 'Networking', link: 'https://www.linkedin.com', desc: 'Connect pros' },
      ],
    };
    res.json(resources[stage]);
  } catch (err) {
    console.error('Resources fetch error:', err.message, err.stack);
    await logError(err, '/resources');
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.post('/ai/insights', authenticateToken, async (req, res) => {
  try {
    const { roadmapStats, userProfile } = req.body;
    const insights = [
      `Your completion rate is ${Math.round((roadmapStats.completedSteps / (roadmapStats.totalSteps || 1)) * 100)}%. ${roadmapStats.completedSteps < roadmapStats.totalSteps / 2 ? 'Try focusing on one roadmap at a time.' : 'Great progress—keep it up!'}`,
      roadmapStats.stepsWithDeadlines > 0
        ? `You have ${roadmapStats.stepsWithDeadlines} steps with deadlines. Prioritize these to stay on track.`
        : 'Adding deadlines to steps can help with time management.',
      userProfile.interests?.includes('coding')
        ? 'Your interest in coding aligns with high-demand careers like Software Engineer.'
        : 'Explore careers that match your interests to find the best fit.',
    ];
    res.json({ insights });
  } catch (err) {
    console.error('AI insights error:', err.message, err.stack);
    await logError(err, '/ai/insights');
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

router.get('/report', authenticateToken, async (req, res) => {
  try {
    const report = await calculateReport(req.user.id);
    if (req.query.format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=LyftOff_Report.pdf');
      doc.pipe(res);

      doc.fontSize(20).text('LyftOff Progress Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Generated: ${new Date(report.timestamp).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).text('Overview', { underline: true });
      doc.fontSize(12).text(`Score: ${report.score}/100`);
      doc.text(`Profile Completion: ${report.profile.firstName ? 'Complete' : 'Incomplete'}`);
      doc.text(`Academic Level: ${report.profile.academicLevel}`);
      doc.moveDown();

      doc.fontSize(16).text('Roadmap Stats', { underline: true });
      doc.fontSize(12).text(`Total Roadmaps: ${report.roadmapStats.totalRoadmaps}`);
      doc.text(`Completed Roadmaps: ${report.roadmapStats.completedRoadmaps}`);
      doc.text(`Total Steps: ${report.roadmapStats.totalSteps}`);
      doc.text(`Completed Steps: ${report.roadmapStats.completedSteps}`);
      doc.text(`Steps with Deadlines: ${report.roadmapStats.stepsWithDeadlines}`);
      doc.moveDown();

      doc.fontSize(16).text('Goal Stats', { underline: true });
      doc.fontSize(12).text(`Total Goals: ${report.goalStats.totalGoals}`);
      doc.text(`Completed Goals: ${report.goalStats.completedGoals}`);
      doc.moveDown();

      doc.fontSize(16).text('Achievements', { underline: true });
      report.achievements.forEach(achievement => {
        doc.fontSize(12).text(`- ${typeof achievement === 'string' ? achievement : achievement.name || 'Unnamed Achievement'}: ${typeof achievement === 'string' ? '' : achievement.description || ''}`);
      });
      doc.moveDown();

      doc.fontSize(16).text('Categories', { underline: true });
      Object.entries(report.categories).forEach(([key, value]) => {
        doc.fontSize(12).text(`${key}: ${value}%`);
      });
      doc.moveDown();

      doc.fontSize(16).text('Recommendations', { underline: true });
      doc.fontSize(12).text('Institutions:');
      report.recommendations.institutions.forEach(i => {
        doc.text(`- ${i.name} (${i.fit}): ${i.reason}`);
      });
      doc.text('Scholarships:');
      report.recommendations.scholarships.forEach(s => {
        doc.text(`- ${s.name} (${s.amount}): ${s.eligibility}`);
      });
      doc.moveDown();

      doc.fontSize(16).text('Score Trend', { underline: true });
      report.historicalScores.forEach(({ date, score }) => {
        doc.fontSize(12).text(`${date}: ${score}/100`);
      });

      doc.end();
    } else {
      res.json(report);
    }
  } catch (err) {
    console.error('Report error:', err.message, err.stack);
    await logError(err, '/report');
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.post('/report', authenticateToken, async (req, res) => {
  try {
    const report = await calculateReport(req.user.id);
    res.json({ message: 'Report generated', report });
  } catch (err) {
    console.error('Report post error:', err.message, err.stack);
    await logError(err, '/report');
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;