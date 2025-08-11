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



async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });

  logger.info(`subscriped ${routingKey}`);
}

module.exports = {
  connectToRabbitMQ,
  consumeEvent,
};

