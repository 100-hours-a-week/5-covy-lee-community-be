const pool = require("../config/db2");
const { encode } = require("html-entities");

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
        // 댓글 내용 인코딩
        const encodedContent = encode(content);

        const [result] = await pool.execute(
            'INSERT INTO comment (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, encodedContent]
        );

        const [user] = await pool.execute(
            'SELECT username, image FROM user WHERE user_id = ?',
            [userId]
        );

        res.status(201).json({
            message: '댓글이 성공적으로 작성되었습니다.',
            commentId: result.insertId,
            author: user[0]?.username || '익명',
            author_image: user[0]?.image || null,
            content: encodedContent,
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('댓글 작성 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};


exports.getComments = async (req, res) => {
    const postId = req.params.postId;

    try {
        const [comments] = await pool.execute(
            `SELECT
                 c.comment_id,
                 c.content,
                 c.created_at,
                 c.user_id AS author_id,
                 u.username AS author,
                 u.image AS author_image
             FROM comment c
                      JOIN user u ON c.user_id = u.user_id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );

        // 이미 인코딩된 상태로 전달
        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 목록 가져오기 중 오류 발생:', error);
        res.status(500).json({ message: '댓글 목록을 가져오는 데 실패했습니다.' });
    }
};





// 댓글 수정 함수
exports.updateComment = async (req, res) => {
    const commentId = req.params.commentId;
    const { content } = req.body;
    const userId = req.session?.user?.id || null;

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (!content) {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }

    try {
        const [comment] = await pool.execute(
            'SELECT * FROM comment WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (comment.length === 0) {
            return res.status(403).json({ message: '댓글을 수정할 권한이 없습니다.' });
        }

        // 댓글 내용 인코딩
        const encodedContent = encode(content);

        const [result] = await pool.execute(
            'UPDATE comment SET content = ? WHERE comment_id = ?',
            [encodedContent, commentId]
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({
                message: '댓글이 성공적으로 수정되었습니다.',
                content: encodedContent,
            });
        } else {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('댓글 수정 중 오류 발생:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 댓글 삭제 함수
exports.deleteComment = async (req, res) => {
    const commentId = req.params.commentId;
    const userId = req.session?.user?.id || null;

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const [comment] = await pool.execute(
            'SELECT * FROM comment WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (comment.length === 0) {
            return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
        }

        const [result] = await pool.execute('DELETE FROM comment WHERE comment_id = ?', [commentId]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });
        } else {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('댓글 삭제 중 오류 발생:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};





