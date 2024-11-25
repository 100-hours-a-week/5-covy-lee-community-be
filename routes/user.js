const express = require('express');
const { registerUser, loginUser, updateUserProfile, deleteUser, checkSession, logoutUser, updatePassword} = require('../controllers/userController');
const { createPost, getPosts, getPostById, deletePost, updatePost, increaseViewCount} = require('../controllers/postController');
const { createComment,getComments, updateComment, deleteComment } = require('../controllers/commentController');
const { toggleLike , getLikes, getLikeStatus} = require('../controllers/likeController');

const router = express.Router();
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

// 회원가입 API
router.post('/api/register', profileUpload.single('profilePic'), registerUser);

// 로그인 API
router.post('/api/login', loginUser);

// 로그아웃 API
router.post('/api/logout', logoutUser);

// 회원정보 수정 API
router.put('/api/user/:userId', profileUpload.single('profilePic'), updateUserProfile);

// 비밀번호 수정 API
router.patch('/api/user/password', updatePassword);

// 회원탈퇴 API
router.delete('/api/user/:userId', deleteUser);

// 게시글 업로드 API
router.post('/api/posts', postUpload.single('postImage'), createPost);

// 게시글 목록 API
router.get('/api/posts', getPosts);

// 특정 게시글 상세보기 API
router.get('/api/posts/:postId', getPostById);

// 게시글 수정 API
router.put('/api/posts/:postId', postUpload.single('postImage'), updatePost);

// 게시글 삭제 API
router.delete('/api/posts/:postId', deletePost);

// 게시글 조회수 API
router.patch('/api/posts/:postId/views',increaseViewCount);

// 댓글 가져오기
router.get('/posts/:postId/comments', getComments);

// 댓글 작성 API
router.post('/api/posts/:postId/comments', createComment);

// 댓글 수정 API
router.put('/api/comments/:commentId', updateComment);

// 댓글 삭제 API
router.delete('/api/comments/:commentId', deleteComment);

// 게시글 좋아요 API
router.post("/api/posts/:postId/like", toggleLike);

router.get("/api/posts/:postId/likes", getLikes);

router.get("/api/posts/:postId/like-status", getLikeStatus);


// 세션 체크 API
router.get('/api/check-session', checkSession);
// 세션확인 미들웨어
router.use('/api/posts', verifySession);

module.exports = router;
