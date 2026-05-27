import crypto from 'crypto';
console.log(crypto.createHash('sha256').update('admin321a').digest('hex'));
