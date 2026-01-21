const express = require('express');
const rateLimitConfig = require('../config/rateLimitConfig');
const router = express.Router();
const { loginLimiter, otpLimiter } = require('../middlewares/rateLimiter')
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middlewares/auth.middleware');


const { handleLogin, handleLogout } = require('../controllers/user.controller')


router.get('/login', (req, res) => {
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Login endpoint'
    #swagger.parameters['email'] = {
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      description: 'Login successful',
      schema: { token: 'abc123' }
    }
  */
  res.status(200).json({ token: 'abc123' });
});


router.get('/user', (req, res) => {
  /* #swagger.parameters['email'] = {
        in: 'query',
        required: true,
        type: 'string'
    } */
  res.status(200).json({ message: 'Success' });
});

router.get('/user1', authMiddleware, asyncHandler(handleLogout));

const teamRoutes = require('./teams-master.routes');
const playerRoutes = require('./players-master.routes');
// const sessionRoutes = require('./auction-session.routes');

router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
// router.use('/sessions', sessionRoutes);
const auctionSessionRoutes = require('./auction-session.routes');
router.use('/sessions', auctionSessionRoutes);

const auctionPlayers = require('./auction-players.route')
router.use('/auctionPlayer', auctionPlayers)

const controllers = require('../controllers/sample.controller')

router.use('/generate-form-schema', controllers.generateFormSchemaController)

router.post('/chat', controllers.chatWithGemini);


module.exports = router;