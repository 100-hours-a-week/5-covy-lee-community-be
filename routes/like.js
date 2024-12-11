const { toggleLike , getLikes, getLikeStatus} = require('../controllers/likeController');
const express = require('express');
const router = express.Router();

// 게시글 좋아요 API
router.post("/api/posts/:postId/like", toggleLike);

router.get("/api/posts/:postId/likes", getLikes);

router.get("/api/posts/:postId/like-status", getLikeStatus);


module.exports = router;