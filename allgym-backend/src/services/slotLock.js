// Redis 기반 분산 잠금 (단순 SET NX EX)
const { redisClient } = require('../config/redis');

const TTL_SECONDS = 300; // 5분
const key = (slotId) => `oljim:lock:slot:${slotId}`;

async function acquireLock(slotId, userId) {
  const r = await redisClient.set(key(slotId), userId, { NX: true, EX: TTL_SECONDS });
  return r === 'OK';
}

async function releaseLock(slotId, userId) {
  const holder = await redisClient.get(key(slotId));
  if (holder === userId) await redisClient.del(key(slotId));
}

async function getLockHolder(slotId) {
  return await redisClient.get(key(slotId));
}

module.exports = { acquireLock, releaseLock, getLockHolder, TTL_SECONDS };
