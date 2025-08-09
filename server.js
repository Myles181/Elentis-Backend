require('dotenv').config();

let express = require('express');
let session = require('express-session');
let mongoose = require('mongoose');
let swaggerUi = require('swagger-ui-express');
let cookieParser = require('cookie-parser');
let swaggerSpec = require('./utils/swaggerConfig');
let cors = require("cors");
let http = require("http");
let helmet = require('helmet');
let rateLimit = require('express-rate-limit');
// let xss = require('xss-clean');

let morgan = require('morgan');


const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
console.log('Server running on port:', PORT);

// Rate limiting configuration
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
});

// Authentication rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Job creation rate limiting
const jobCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 job posts per hour
    message: {
        success: false,
        message: 'Too many jobs created from this IP, please try again later.',
        retryAfter: '1 hour'
    },
});

// Application rate limiting
const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 job applications per hour
    message: {
        success: false,
        message: 'Too many job applications from this IP, please try again later.',
        retryAfter: '1 hour'
    },
});

// Middleware to parse JSON
console.log(process.env.SECRET_KEY);
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));
app.use(helmet());
// app.use(xss());
app.use(morgan('dev'));

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Hnadle cors
const corsOptions = {
    origin: [
        process.env.WEB_BASE_URL,
        process.env.SERVER_URL,
        `http://localhost:${PORT}`,
        `http://localhost:5173`,
        `https://elentis.app`,
        'https://www.elentis.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

// Sample route
const waitlistRoute = require('./routes/waitlistRoute');
const authRoute = require('./routes/authRoutes');
const userRoute = require('./routes/userRoutes');
const courseRoute = require('./routes/courseRoutes');
const jobRoute = require('./routes/jobRoutes');
const jobApplicationRoute = require('./routes/jobApplicationRoutes');

app.get("/", (req, res) => {
  res.send("Hello, Express.js!");
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/waitlist', waitlistRoute);
app.use('/api/auth', authLimiter, authRoute);
app.use('/api/user', userRoute);
app.use('/api/courses', courseRoute);
app.use('/api/jobs', jobRoute);
app.use('/api/job-applications', jobApplicationRoute);

// Apply specific rate limiters to sensitive endpoints
app.use('/api/jobs', (req, res, next) => {
    if (req.method === 'POST') {
        return jobCreationLimiter(req, res, next);
    }
    next();
});

app.use('/api/job-applications/apply', applicationLimiter);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
