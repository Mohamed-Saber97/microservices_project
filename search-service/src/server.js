require("dotenv").config();
const express = require("express");
const connectDB = require("./DB/conn");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require('./routes/search-routes');
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");
const app = express();
const PORT = process.env.PORT || 3004;
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

app.use('/api/search', searchRoutes);




app.use(errorHandler);



async function startServer() {
  try {
    await connectToRabbitMQ();
    //consume all the events
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Search service running on port ${PORT}`);
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
