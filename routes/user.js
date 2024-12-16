const express = require('express');
const { registerUser,checkUsername,updateSession ,loginUser, updateUserProfile, deleteUser, checkSession, logoutUser, updatePassword} = require('../controllers/userController');
const { profileUpload, verifySession } = require('../middlewares/middleware');
const router = express.Router();

// 회원가입 API
router.post('/api/register', profileUpload.single('profilePic'), registerUser);

// 닉네임 중복 검사 API
router.get('/api/check-username', checkUsername);

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

// 세션 체크 API
router.get('/api/check-session', checkSession);

// 세션 업데이트
router.post('/api/update-session', updateSession);

module.exports = router;
