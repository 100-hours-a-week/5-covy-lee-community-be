const crypto = require('crypto');

// 32바이트의 무작위 문자열 생성
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);
