const CustomError = require('../utils/CustomError'); // 커스텀 에러 클래스

const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        next(new CustomError(401, '로그인이 필요합니다.'));
    }
};

module.exports = authMiddleware;

