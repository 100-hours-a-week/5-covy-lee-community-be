const pool = require("../config/db2");

exports.createComment = async (req, res) => {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.session?.user?.id || null;

    if (!content) {
        return res.status(400).json({ message: '댓글 내용을 입력해야 합니다.' });
    }

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (!postId) {
        return res.status(400).json({ message: '게시글 ID가 필요합니다.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO comment (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );

        const [user] = await pool.execute(
            'SELECT username FROM user WHERE user_id = ?',
            [userId]
        );

        res.status(201).json({
            message: '댓글이 성공적으로 작성되었습니다.',
            commentId: result.insertId,
            author: user[0]?.username || '익명',
            content,
            created_at: new Date().toISOString(), // 댓글 작성 시간을 ISO 형식으로 반환
        });
    } catch (error) {
        console.error('댓글 작성 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};


exports.getComments = async (req, res) => {
    const postId = req.params.postId;

    try {
        // 댓글 목록을 최신 순으로 정렬하여 반환
        const [comments] = await pool.execute(
            'SELECT c.comment_id, c.content, c.created_at, u.username AS author FROM comment c JOIN user u ON c.user_id = u.user_id WHERE c.post_id = ? ORDER BY c.created_at DESC',
            [postId]
        );

        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 목록 가져오기 중 오류 발생:', error);
        res.status(500).json({ message: '댓글 목록을 가져오는 데 실패했습니다.' });
    }
};



