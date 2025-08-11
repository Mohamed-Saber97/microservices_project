require('dotenv').config();
const connectDB = require('./DB/conn')
const mongoose = require("mongoose");
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } =  require('rate-limiter-flexible');
const Redis = require('ioredis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const router = require('./routes/identity-service');
const errorHandler = require('./middleware/errorHandler')
const app = express();
const PORT = process.env.PORT || 3001;

//connect to db
connectDB();
const redisClient = new Redis(process.env.REDIS_URL);



//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next)=> {
    logger.info(`Recevied ${req.method} request to ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
});

//DDos protection and rate limiting
// Rate limiter instance (example: 10 requests per 1 minute per IP)

const rateLimiter = new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1,
});

/**
     * rateLimiter: This object is created from the RateLimiterRedis class (from the rate-limiter-flexible package).

    storeClient: This is your connected Redis client. It’s used as the storage backend to track IP requests.

    keyPrefix: 'middleware': All keys in Redis will start with "middleware", helping distinguish them.

    points: 10: Each IP is allowed 10 requests...

    duration: 1: ...per 1 second. If an IP exceeds 10 requests in 1 second, they are rate-limited.
 */

//2. Apply Global Middleware Rate Limiting


app.use((req, res, next)=> {
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=> {
        logger.warn(`Rate limit exceed for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests'
        });
    });
});

/**
 * This middleware is applied to all routes.

req.ip: Gets the IP address of the client making the request.

rateLimiter.consume(req.ip): Tries to consume 1 point (i.e., allow 1 request) for the IP.

If under limit → next() is called to proceed.

If limit exceeded → goes to .catch().

.catch():

Logs a warning with the IP.

Sends HTTP 429 Too Many Requests response.
 */


// IP based rate limiting for sensetive endpoints

//Separate Rate Limiting for Sensitive Endpoints
const sensetiveEndpointsLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    standardHeaders:true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeed for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),


});

/**
 * Using the express-rate-limit package (different from rate-limiter-flexible).

windowMs: 15 * 60 * 1000: 15 minutes window.

max: 50: Max 50 requests per IP in that 15-minute window.

standardHeaders: true: Sends RateLimit-* headers for clients.

legacyHeaders: false: Disables the older X-RateLimit-* headers.


Custom handler if a user is rate-limited.

Logs the IP.

Returns a 429 response with a JSON message.



store: Instead of using in-memory storage, this limiter uses Redis.

RedisStore: From the rate-limit-redis package.

sendCommand: This is how the rate limiter interacts with Redis under the hood, using the Redis client’s .call() method.
 */

app.use('/api/auth/register', sensetiveEndpointsLimiter);
app.use('/api/auth', router);


//error handler
app.use(errorHandler);

app.listen(PORT,()=>{
    logger.info(`identity service running on port ${PORT}`);
});
//unhandledPromiseRejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('unhandledRejection at', promise, "reason:", reason);
});












