const bcrypt = require('bcryptjs');
const pool = require('../config/db2');

// 회원가입 함수
exports.registerUser = async (req, res) => {
    const { email, password, username } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    if (!email || !password || !username) {
        return res.status(400).json({ message: '모든 필드를 채워주세요.' });
    }

    try {
        const [existingUser] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO user (email, password, username, image) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, username, profilePic]
        );

        res.status(201).json({ message: '회원가입 성공!', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 로그인 API
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
        }

        const validPassword = await bcrypt.compare(password, user[0].password);
        if (!validPassword) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
        }

        // 세션에 user 정보 저장
        req.session.user = { id: user[0].user_id, email: user[0].email, username: user[0].username, image: user[0].image };

        // 세션이 제대로 저장되는지 확인
        console.log('User session after login:', req.session.user); // 로그 추가

        res.status(200).json({ message: '로그인 성공', user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
        }
        res.clearCookie('connect.sid'); // 세션 쿠키 삭제
        res.status(200).json({ message: '로그아웃 성공' });
    });
};


// 회원정보 수정 함수
exports.updateUserProfile = async (req, res) => {
    let userId = req.params.userId;

    const { username } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    if (!username && !profilePic) {
        return res.status(400).json({ message: '수정할 정보가 없습니다.' });
    }

    try {
        let updateQuery = 'UPDATE user SET ';
        let updateParams = [];

        if (username) {
            updateQuery += 'username = ?, ';
            updateParams.push(username);
        }

        if (profilePic) {
            updateQuery += 'image = ?, ';
            updateParams.push(profilePic);
        }

        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ' WHERE user_id = ?';
        updateParams.push(userId);

        const [result] = await pool.execute(updateQuery, updateParams);

        if (result.affectedRows > 0) {
            // 세션에 user가 없으면 초기화
            if (!req.session.user) {
                req.session.user = {};
            }

            // 세션의 사용자 정보 업데이트
            req.session.user.username = username;  // 세션의 사용자명 업데이트
            if (profilePic) {
                req.session.user.image = profilePic;  // 프로필 이미지도 세션에 저장
            }

            return res.status(200).json({ message: '회원정보가 성공적으로 업데이트되었습니다.' });
        } else {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 회원탈퇴 함수
exports.deleteUser = async (req, res) => {
    const userId = req.params.userId; // URL 파라미터에서 userId 가져오기

    if (!userId) {
        return res.status(400).json({ message: '유효한 사용자 ID가 필요합니다.' });
    }

    try {
        // 1. 연관된 데이터 삭제 (예: 게시글 삭제)
        await pool.execute('DELETE FROM post WHERE user_id = ?', [userId]);

        // 2. 사용자 계정 삭제
        const [result] = await pool.execute('DELETE FROM user WHERE user_id = ?', [userId]);

        if (result.affectedRows > 0) {
            // 세션 초기화
            req.session.destroy((err) => {
                if (err) {
                    console.error('세션 삭제 중 오류 발생:', err);
                }
            });

            return res.status(200).json({ message: '회원탈퇴가 성공적으로 처리되었습니다.' });
        } else {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('회원탈퇴 중 오류 발생:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};


// 게시글 작성 함수
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

exports.checkSession = (req, res) => {
    if (req.session.user) {
        // 세션 데이터 확인
        console.log('Session data:', req.session.user);

        res.status(200).json({
            loggedIn: true,
            user: {
                id: req.session.user.id,
                email: req.session.user.email,
                username: req.session.user.username,
                image: req.session.user.image
            }
        });
    } else {
        res.status(401).json({ loggedIn: false, message: '로그인이 필요합니다.' });
    }
};

// 비밀번호 수정 함수
exports.updatePassword = async (req, res) => {
    console.log('Session:', req.session); // 세션 객체 전체 확인
    console.log('Session User:', req.session?.user); // 세션 내 사용자 정보 확인
    const { newPassword, confirmPassword } = req.body; // 새로운 비밀번호와 확인 비밀번호
    const userId = req.session?.user?.id || null; // 세션에서 사용자 ID 가져오기

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' }); // 로그인하지 않은 사용자 처리
    }

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' }); // 필드가 비어있는 경우
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' }); // 비밀번호 불일치
    }

    // 비밀번호 유효성 검사 (서버 측)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    if (!passwordPattern.test(newPassword)) {
        return res.status(400).json({
            message: '비밀번호는 8자 이상 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 최소 1개 포함해야 합니다.'
        }); // 비밀번호 형식이 올바르지 않을 경우
    }

    try {
        // 새 비밀번호 암호화
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 데이터베이스 업데이트
        const [result] = await pool.execute(
            'UPDATE user SET password = ? WHERE user_id = ?',
            [hashedNewPassword, userId]
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' }); // 성공 응답
        } else {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' }); // 사용자 없음
        }
    } catch (error) {
        console.error('비밀번호 수정 중 오류 발생:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' }); // 서버 오류 처리
    }
};


