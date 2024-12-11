const { createPost, getPosts, getPostById, deletePost, updatePost, increaseViewCount} = require('../controllers/postController');
const { postUpload, verifySession } = require('../middlewares/middleware');
const express = require('express');
const router = express.Router();

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

module.exports = router;