const pool = require("../config/db2");

exports.toggleLike = async (req, res) => {
    const userId = req.session?.user?.id || null; // 로그인한 사용자
    const postId = req.params.postId;

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const [existingLike] = await pool.execute(
            "SELECT * FROM `like` WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (existingLike.length > 0) {
            // 좋아요 삭제
            await pool.execute("DELETE FROM `like` WHERE post_id = ? AND user_id = ?", [postId, userId]);
            return res.status(200).json({ message: "좋아요 취소", liked: false });
        } else {
            // 좋아요 추가: 중복 시도 무시
            await pool.execute(
                "INSERT IGNORE INTO `like` (post_id, user_id) VALUES (?, ?)",
                [postId, userId]
            );
            return res.status(200).json({ message: "좋아요 추가", liked: true });
        }
    } catch (error) {
        console.error("좋아요 토글 오류 발생:", error);
        res.status(500).json({ message: "서버 오류 발생", error: error.message });
    }
};



// 좋아요 수 반환 API
exports.getLikes = async (req, res) => {
    const postId = req.params.postId;

    try {
        const [likes] = await pool.execute(
            "SELECT COUNT(*) AS likeCount FROM `like` WHERE post_id = ?",
            [postId]
        );

        res.status(200).json({ likes: likes[0].likeCount });
    } catch (error) {
        console.error("좋아요 수 반환 오류:", error);
        res.status(500).json({ message: "좋아요 수를 가져오는 중 오류가 발생했습니다." });
    }
};

// 좋아요 상태 확인 API
exports.getLikeStatus = async (req, res) => {
    const userId = req.session?.user?.id || null; // 로그인한 사용자
    const postId = req.params.postId;

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const [like] = await pool.execute(
            "SELECT * FROM `like` WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        const liked = like.length > 0; // 좋아요가 존재하면 true
        res.status(200).json({ liked });
    } catch (error) {
        console.error("좋아요 상태 확인 오류:", error);
        res.status(500).json({ message: "좋아요 상태를 확인하는 중 오류가 발생했습니다." });
    }
};
