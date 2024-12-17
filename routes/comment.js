const { createComment,getComments, updateComment, deleteComment } = require('../controllers/commentController');
const express = require('express');
const router = express.Router();

// 댓글 가져오기
router.get('/api/posts/:postId/comments', getComments);

// 댓글 작성 API
router.post('/api/posts/:postId/comments', createComment);

// 댓글 수정 API
router.put('/api/comments/:commentId', updateComment);

// 댓글 삭제 API
router.delete('/api/comments/:commentId', deleteComment);


module.exports = router;