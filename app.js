const PORT = 3000;
const express = require('express');
const path = require('path');
const userRoutes = require('./routes/user'); // 사용자 라우트 모듈 가져오기
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();

// 세션 설정
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false, // 개발 중에는 false로 설정
        maxAge: 60000000 // 쿠키 만료 시간 설정 (예: 60초)
    }
}));

// CORS 설정 (라우트보다 위에 있어야 함)
app.use(cors({
    origin: 'http://localhost:5050', // 허용할 클라이언트 도메인
    credentials: true // 쿠키 및 인증 정보 포함
}));

// JSON 및 정적 파일 제공
app.use(express.json());
app.use(express.static(path.join(__dirname)));
// 정적 파일 제공
app.use('/profile_images', express.static(path.join(__dirname, '../profile_images')));
app.use('/post_images', express.static(path.join(__dirname, '../post_images')));


// 라우트 등록
app.use(userRoutes);

// 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});



