const mysql = require('mysql2');
require('dotenv').config();

// 데이터베이스 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    //port: process.env.DB_PORT || 3306, // 포트를 환경 변수로 지정하거나 기본값 3306 사용
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();