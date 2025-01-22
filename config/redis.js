const redis = require("redis");

// Redis 클라이언트 생성
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || '127.0.0.1', // Redis 호스트
        port: process.env.REDIS_PORT || 6379,        // Redis 포트
    }
});

// Redis 연결
(async () => {
    try {
        await redisClient.connect();
        console.log("Redis 연결 성공");
    } catch (error) {
        console.error("Redis 연결 실패:", error);
    }
})();

// 조회수 Redis 키를 제외한 모든 키를 삭제하는 함수
const deleteNonViewKeys = async () => {
    try {
        const allKeys = await redisClient.keys('*'); // 모든 Redis 키 가져오기
        const keysToDelete = allKeys.filter((key) => !key.startsWith('view:')); // 'view:'로 시작하지 않는 키 필터링

        if (keysToDelete.length > 0) {
            for (const key of keysToDelete) {
                await redisClient.del(key); // 개별 키 삭제
            }
            console.log(`삭제된 키: ${keysToDelete}`);
        } else {
            console.log('삭제할 키가 없습니다.');
        }
    } catch (error) {
        console.error('Redis 키 삭제 중 오류 발생:', error);
    }
};

// 모듈 내보내기
module.exports = {
    redisClient,
    deleteNonViewKeys,
};


