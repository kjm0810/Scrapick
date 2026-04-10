import { QueueClient } from "@vercel/queue";

const queueRegion = process.env.VERCEL_REGION || process.env.VERCEL_QUEUE_REGION || "iad1";

const queueClient = new QueueClient({
  region: queueRegion,
});

export const sendQueueMessage = queueClient.send;
export const handleQueueCallback = queueClient.handleCallback;
