require('dotenv').config();

const { S3Client } = require("@aws-sdk/client-s3");
const multer = require('multer');
const multerS3 = require('multer-s3');

// S3 클라이언트 생성 (AWS SDK v3)
const s3 = new S3Client({
    region: 'ap-northeast-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// 📌 ✅ 프로필 이미지 S3 업로드 설정
const profileStorage = multerS3({
    s3: s3,
    bucket: 'covy-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE, // 자동 Content-Type 설정
    key: function (req, file, cb) {
        cb(null, `profile_images/${Date.now()}-${file.originalname}`);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
});

// 📌 ✅ 게시글 이미지 S3 업로드 설정
const postStorage = multerS3({
    s3: s3,
    bucket: 'covy-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        cb(null, `post_images/${Date.now()}-${file.originalname}`);
    }
});

const postUpload = multer({
    storage: postStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ✅ 세션 검증 미들웨어
const verifySession = (req, res, next) => {
    if (req.session && req.session.user) {
        console.log('유효한 세션:', req.session.user);
        next();
    } else {
        res.status(401).json({ message: '로그인이 필요합니다.' });
    }
};

// ✅ 모듈 내보내기
module.exports = {
    profileUpload,
    postUpload,
    verifySession
};

