const redis = require("redis");

const redisClient = redis.createClient();

(async () => {
    try {
        await redisClient.connect(); // Redis 연결
        console.log("Redis 연결 성공");
    } catch (error) {
        console.error("Redis 연결 실패:", error);
    }
})();

module.exports = redisClient;
