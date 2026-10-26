const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.on('error', (err) => console.error('[redis]', err.message));

module.exports = { redisClient, RedisStore };
