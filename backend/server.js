
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Set it in your environment variables.');
    process.exit(1);
}

const app = express();

app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Allowed frontend origins
const allowedOrigins = [
    'https://placementtrackerbyjs.vercel.app',
    'http://localhost:5173'
];

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests without an Origin header, such as server-to-server requests
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked this origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Log requests outside production
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Brute-force protection for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        message: 'Too many attempts, please try again in a few minutes.'
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));

// Handle unknown routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});

