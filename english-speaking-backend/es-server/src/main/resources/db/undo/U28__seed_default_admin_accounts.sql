-- U28: 移除预置的管理员/教师/运维账号

DELETE FROM users WHERE email IN (
  'admin@english-speaking.com',
  'teacher@english-speaking.com',
  'operator@english-speaking.com'
);
