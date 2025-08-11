require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const express = require("express");
const connectDB = require("./DB/conn");
const Redis = require("ioredis");
const postRoutes = require("./routes/post-routes.js");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ } = require("./utils/rabbitmq.js");

const app = express();
const PORT = process.env.PORT || 3002;
connectDB();
const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Recevied ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

// pass redis client to routes
// app.use('/api/posts', (req, res, next)=> {
//     req.redisClient = redisClient;
//     next();
// } ,postRoutes);
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post Service running at PORT ${PORT}`);
    });
  } catch (error) {
    logger.error("can not start server ", error);
    process.exit(1);
  }
}

startServer();

//unhandledPromiseRejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection at", promise, "reason:", reason);
});
