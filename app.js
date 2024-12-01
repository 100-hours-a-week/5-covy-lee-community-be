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
        secure: false,
        maxAge: 60000000
    }
}));
// 미들웨어 맨 아래로 옮기니까 서버 실행안됨;;
app.use(cors({
    origin: `${process.env.SERVER_URL}`,
    credentials: true
}));

// JSON 및 정적 파일 제공
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/profile_images', express.static(path.join(__dirname, '../profile_images')));
app.use('/post_images', express.static(path.join(__dirname, '../post_images')));
app.use(userRoutes);



app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});



