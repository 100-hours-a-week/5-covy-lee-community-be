const pool = require("../config/db2");

exports.createPost = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session?.user?.id || null; // 세션에서 사용자 ID 가져오기
    const image = req.file ? req.file.filename : null;

    // 디버깅용 로그
    console.log('Session User:', req.session?.user);
    console.log('User ID:', userId);
    console.log('Title:', title);
    console.log('Content:', content);
    console.log('Image:', image);

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO post (user_id, title, content, image) VALUES (?, ?, ?, ?)',
            [userId, title, content, image]
        );

        res.status(201).json({
            message: '게시글이 성공적으로 작성되었습니다.',
            postId: result.insertId
        });
    } catch (error) {
        console.error('게시글 작성 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 게시글 목록 가져오기
exports.getPosts = async (req, res) => {
    try {
        // 게시글 목록 가져오기
        const [posts] = await pool.execute(
            `SELECT
                 post.post_id AS id,
                 post.title,
                 post.content,
                 post.image,
                 post.created_at,
                 user.username AS author,
                 user.image AS author_image,
                 (SELECT COUNT(*) FROM comment WHERE comment.post_id = post.post_id) AS comment_count,
                 (SELECT COUNT(*) FROM \`like\` WHERE \`like\`.post_id = post.post_id) AS like_count
             FROM post
                      INNER JOIN user ON post.user_id = user.user_id
             ORDER BY post.created_at DESC`
        );

        // 모든 게시글의 작성자 이름과 이미지를 로그로 출력
        posts.forEach(post => {
            console.log(`작성자: ${post.author}, 프로필 이미지: ${post.author_image}`);
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error('게시글 목록 가져오기 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
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
                user.username AS author, 
                user.image AS author_image 
             FROM post 
             INNER JOIN user ON post.user_id = user.user_id 
             WHERE post.post_id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        res.status(200).json(posts[0]);
    } catch (error) {
        console.error('특정 게시글 가져오기 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
    const { postId } = req.params; // URL에서 게시글 ID 가져오기
    const { title, content } = req.body; // 요청 본문에서 제목과 내용 가져오기
    const userId = req.session?.user?.id || null; // 세션에서 사용자 ID 가져오기
    const image = req.file ? req.file.filename : null; // 업로드된 파일 이름 가져오기

    // 디버깅용 로그
    console.log('Session User:', req.session?.user);
    console.log('User ID:', userId);
    console.log('Post ID:', postId);
    console.log('Title:', title);
    console.log('Content:', content);
    console.log('Image:', image);

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (!postId) {
        return res.status(400).json({ message: '게시글 ID가 필요합니다.' });
    }

    if (!title && !content && !image) {
        return res.status(400).json({ message: '수정할 내용이 없습니다.' });
    }

    try {
        // 게시글 작성자인지 확인
        const [posts] = await pool.execute(
            'SELECT * FROM post WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (posts.length === 0) {
            return res.status(403).json({ message: '게시글 수정 권한이 없습니다.' });
        }

        // 동적으로 업데이트할 컬럼 구성
        const fields = [];
        const values = [];

        if (title) {
            fields.push('title = ?');
            values.push(title);
        }
        if (content) {
            fields.push('content = ?');
            values.push(content);
        }
        if (image) {
            fields.push('image = ?');
            values.push(image);
        }

        values.push(postId); // 조건으로 사용할 postId 추가

        const query = `UPDATE post SET ${fields.join(', ')} WHERE post_id = ?`;

        console.log('수정 쿼리:', query);
        console.log('수정 값:', values);

        await pool.execute(query, values);

        res.status(200).json({ message: '게시글이 성공적으로 수정되었습니다.' });
    } catch (error) {
        console.error('게시글 수정 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
    const { postId } = req.params; // URL에서 게시글 ID 가져오기
    const userId = req.session?.user?.id || null; // 세션에서 사용자 ID 가져오기

    // 디버깅용 로그
    console.log('Session User:', req.session?.user);
    console.log('User ID:', userId);
    console.log('Post ID:', postId);

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        console.log('쿼리 실행: postId:', postId, 'userId:', userId);

        const [posts] = await pool.execute(
            'SELECT * FROM post WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        console.log('쿼리 결과:', posts);

        if (posts.length === 0) {
            console.log('게시글이 없거나 권한이 없는 사용자');
            return res.status(404).json({ message: '권한이 없습니다.' });
        }

        await pool.execute('DELETE FROM post WHERE post_id = ?', [postId]);

        console.log('게시글 삭제 성공');
        res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('게시글 삭제 중 오류 발생:', error.message);
        console.error('에러 스택:', error.stack);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }

};

// 게시글 조회수 증가
exports.increaseViewCount = async (req, res) => {
    const postId = req.params.postId;


    try {
        // 조회수 증가
        await pool.execute('UPDATE post SET views = views + 1 WHERE post_id = ?', [postId]);

        // 현재 조회수 반환
        const [rows] = await pool.execute('SELECT views FROM post WHERE post_id = ?', [postId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        res.status(200).json({ views: rows[0].views });
    } catch (error) {
        console.error('조회수 증가 중 오류 발생:', error);
        res.status(500).json({ message: '조회수 업데이트 중 오류가 발생했습니다.' });
    }
};





