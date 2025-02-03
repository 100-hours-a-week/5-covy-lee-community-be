const PORT = process.env.PORT || 3000;
const express = require('express');
const path = require('path');
const promClient = require('prom-client'); // Prometheus 라이브러리 추가

const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');
const likeRoutes = require('./routes/like');
const errorHandler = require('./middlewares/errorHandler');
const CustomError = require('./utils/CustomError');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Prometheus 기본 메트릭 수집 설정
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// 요청 수, 응답 시간 측정을 위한 Prometheus 커스텀 메트릭
const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP 요청 응답 시간 (초 단위)',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

// 세션 설정
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 60000000
    }
}));

// CORS 설정
app.use(cors({
    origin: [
        process.env.SERVER_URL,
        `${process.env.SERVER_URL}:5050`
    ],
    credentials: true
}));

// JSON 및 정적 파일 제공
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/profile_images', express.static(path.join(__dirname, '../profile_images')));
app.use('/post_images', express.static(path.join(__dirname, '../post_images')));

// Prometheus `/metrics` 엔드포인트 추가
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// 요청 시간 로깅 미들웨어 추가 (Prometheus 메트릭 기록)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // 밀리초 → 초 변환
        httpRequestDurationMicroseconds.labels(req.method, req.path, res.statusCode).observe(duration);
    });
    next();
});

// API 라우트 등록
app.use(userRoutes);
app.use(postRoutes);
app.use(commentRoutes);
app.use(likeRoutes);

// 없는 API 요청 처리
app.use((req, res, next) => {
    next(new CustomError(404, "API 경로를 찾을 수 없습니다."));
});

// 에러 핸들러
app.use(errorHandler);

// 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});




