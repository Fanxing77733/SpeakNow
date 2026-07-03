-- V26: 微信第三方登录 — users 表增加微信 OpenID/UnionID 字段
ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100) COMMENT '微信 OpenID';
ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(100) COMMENT '微信 UnionID';
CREATE UNIQUE INDEX idx_wechat_openid ON users(wechat_openid);
