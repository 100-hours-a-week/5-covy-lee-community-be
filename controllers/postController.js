const pool = require("../config/db2");
const redis = require("redis");
const { encode } = require("html-entities");

// Redis 클라이언트 생성
const redisClient = redis.createClient();

(async () => {
    try {
        await redisClient.connect(); // Redis 연결
        console.log("Redis 연결 성공");
    } catch (error) {
        console.error("Redis 연결 실패:", error);
    }
})();

// 게시글 생성
exports.createPost = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session?.user?.id || null;
    const image = req.file ? req.file.filename : null;

    if (!title || !content) {
        return res.status(400).json({ message: "제목과 내용을 모두 입력해야 합니다." });
    }

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const [result] = await pool.execute(
            "INSERT INTO post (user_id, title, content, image) VALUES (?, ?, ?, ?)",
            [userId, title, content, image]
        );

        res.status(201).json({
            message: "게시글이 성공적으로 작성되었습니다.",
            postId: result.insertId,
        });
    } catch (error) {
        console.error("게시글 작성 중 오류 발생:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// 게시글 목록 가져오기
exports.getPosts = async (req, res) => {
    try {
        const [posts] = await pool.execute(
            `SELECT
                 post.post_id AS id,
                 post.title,
                 post.content,
                 post.image,
                 post.created_at,
                 post.views,
                 user.user_id AS author_id,
                 user.username AS author,
                 user.image AS author_image,
                 (SELECT COUNT(*) FROM comment WHERE comment.post_id = post.post_id) AS comment_count,
                 (SELECT COUNT(*) FROM \`like\` WHERE \`like\`.post_id = post.post_id) AS like_count
             FROM post
             INNER JOIN user ON post.user_id = user.user_id
             ORDER BY post.created_at DESC`
        );

        // 출력 데이터에 대해 HTML 엔티티 이스케이프 처리
        const sanitizedPosts = posts.map(post => ({
            ...post,
            title: encode(post.title),
            content: encode(post.content),
        }));

        res.status(200).json(sanitizedPosts);
    } catch (error) {
        console.error("게시글 목록 가져오기 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// 특정 게시글 가져오기
exports.getPostById = async (req, res) => {
    const { postId } = req.params;

    try {
        const [posts] = await pool.execute(
            `SELECT
                 post.post_id AS id,
                 post.title,
                 post.content,
                 post.image,
                 post.created_at,
                 post.updated_at,
                 post.views,
                 user.user_id AS author_id,
                 user.username AS author,
                 user.image AS author_image
             FROM post
                      INNER JOIN user ON post.user_id = user.user_id
             WHERE post.post_id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        const post = posts[0];

        // HTML 이스케이프 처리를 하지 않음
        res.status(200).json(post);
    } catch (error) {
        console.error("특정 게시글 가져오기 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


// 게시글 수정
exports.updatePost = async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    const userId = req.session?.user?.id || null;
    const image = req.file ? req.file.filename : null;

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!postId) {
        return res.status(400).json({ message: "게시글 ID가 필요합니다." });
    }

    try {
        const [posts] = await pool.execute(
            "SELECT * FROM post WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (posts.length === 0) {
            return res.status(403).json({ message: "게시글 수정 권한이 없습니다." });
        }

        const fields = [];
        const values = [];

        if (title) {
            fields.push("title = ?");
            values.push(title);
        }
        if (content) {
            fields.push("content = ?");
            values.push(content);
        }
        if (image) {
            fields.push("image = ?");
            values.push(image);
        }

        values.push(postId);

        const query = `UPDATE post SET ${fields.join(", ")} WHERE post_id = ?`;
        await pool.execute(query, values);

        res.status(200).json({ message: "게시글이 성공적으로 수정되었습니다." });
    } catch (error) {
        console.error("게시글 수정 중 오류 발생:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.session?.user?.id || null;

    try {
        const [posts] = await pool.execute(
            "SELECT * FROM post WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (posts.length === 0) {
            return res.status(403).json({ message: "게시글 삭제 권한이 없습니다." });
        }

        await pool.execute("DELETE FROM post WHERE post_id = ?", [postId]);

        res.status(200).json({ message: "게시글이 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("게시글 삭제 중 오류 발생:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// 게시글 조회수 증가
exports.increaseViewCount = async (req, res) => {
    const { postId } = req.params;
    const userIdentifier = req.ip;

    const cacheKey = `view:${postId}:${userIdentifier}`;

    try {
        const alreadyViewed = await redisClient.get(cacheKey);

        if (alreadyViewed) {
            return res.status(200).json({ message: "조회수는 이미 증가했습니다." });
        }

        await pool.execute("UPDATE post SET views = views + 1 WHERE post_id = ?", [postId]);

        await redisClient.set(cacheKey, "true", { EX: 60 * 60 });

        const [rows] = await pool.execute("SELECT views FROM post WHERE post_id = ?", [postId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        res.status(200).json({ views: rows[0].views });
    } catch (error) {
        console.error("조회수 증가 중 오류 발생:", error);
        res.status(500).json({ message: "조회수 업데이트 중 오류가 발생했습니다." });
    }
};
