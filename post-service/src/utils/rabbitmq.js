const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;
const EXCHANGE_NAME = "facebook_events";
async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info(
      "connected to rabbit mq server and channel created successfully"
    );
    return channel;
  } catch (error) {
    logger.error("error to connect rabbit mq server", error);
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`event publish : ${routingKey}`);
}

module.exports = {
  connectToRabbitMQ,
  publishEvent,
};
