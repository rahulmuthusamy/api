const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const requestId = require('./middlewares/requestId');
const { defaultLimiter } = require('./middlewares/rateLimiter');

const app = express();

/* ---------------- SECURITY ---------------- */
app.use(
    helmet({
        crossOriginResourcePolicy: false // ✅ REQUIRED
    })
);

app.use(cors({
    origin: [
        'https://ecl.theravens.in',
        'http://localhost:4200'
    ],
    credentials: true
}));
app.options('*', cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- STATIC FILES (BEFORE LIMITER) ---------------- */
app.use(
    '/api/uploads',
    express.static(path.join(__dirname, '../uploads'), {
        setHeaders: (res) => {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store'); // 🔥 prevents 304 loop
        }
    })
);


/* ---------------- MIDDLEWARES ---------------- */
app.use(requestId);
app.use(defaultLimiter);

/* ---------------- ROUTES ---------------- */
app.use('/api', routes);

/* ---------------- HEALTH ---------------- */
app.get('/health', (req, res) => res.send('OK'));

/* ---------------- ERROR HANDLING ---------------- */
app.use(errorHandler);

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger/swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

module.exports = app;
