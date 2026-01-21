const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const requestId = require('./middlewares/requestId');
const { defaultLimiter } = require('./middlewares/rateLimiter')
const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

//create Unique ID for Every Request
app.use(requestId);

//request limit
app.use(defaultLimiter);

// Routes
// app.use('/generate-tasks')  
app.use('/api', routes);

// check Sample API
app.get('/health', (req, res) => res.send('OK'));

// Error handler
app.use(errorHandler);

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger/swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong' });
});

module.exports = app;
