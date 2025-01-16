const errorHandler = (err, req, res, next) => {
    console.error(err); // 서버 로그에 에러 출력

    const statusCode = err.statusCode || 500;
    const message = err.message || "서버 오류가 발생했습니다.";

    res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = errorHandler;
