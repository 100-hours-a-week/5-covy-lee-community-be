const multer = require('multer');
const fs = require('fs');
const path = require('path');

// profile_images 폴더 설정
const profileUploadDir = path.join(__dirname, '../profile_images');
if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir); // 폴더가 없으면 생성
}

// multer 설정 (profile_images)
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploadDir); // profile_images 디렉토리에 저장
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // 파일 이름 설정
    }
});
const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
});

// post_images 폴더 설정
const postUploadDir = path.join(__dirname, '../post_images');
if (!fs.existsSync(postUploadDir)) {
    fs.mkdirSync(postUploadDir); // 폴더가 없으면 생성
}

// multer 설정 (post_images)
const postStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, postUploadDir); // post_images 디렉토리에 저장
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // 파일 이름 설정
    }
});
const postUpload = multer({
    storage: postStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
});

// 세션 검증 미들웨어
const verifySession = (req, res, next) => {
    if (req.session && req.session.user) {
        console.log('유효한 세션:', req.session.user); // 세션 데이터 로깅
        next(); // 세션 유효 시 다음 미들웨어로
    } else {
        res.status(401).json({ message: '로그인이 필요합니다.' });
    }
};

// 모듈 내보내기
module.exports = {
    profileUpload,
    postUpload,
    verifySession
};
