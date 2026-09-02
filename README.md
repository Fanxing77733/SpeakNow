# SpeakNow — AI 英语口语训练系统

基于 AI 的英语口语训练平台，提供发音评测、话题陈述、情景对话、角色扮演等多种练习模式，配合游戏化激励体系、社区互动和管理后台，帮助学习者高效提升英语口语能力。

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## ✨ 功能特性

### 核心练习

- **英语测评** — 自适应定级测试 + 随机 30 题测评（听力/词汇/语法/阅读），生成能力评估报告
- **发音评测** — 录音逐词打分（准确度、流利度、完整度）
- **话题陈述** — 围绕话题即兴表达，AI 综合评估流利度与准确性
- **情景对话** — 与 AI 进行多轮对话练习，实时纠错
- **角色扮演** — 模拟真实场景（点餐、问路、面试等）角色扮演对话
- **作业语音提交** — 跟读多句选择 + 情景对话 + AI 评测详情展示

### 学习成长

- **学习进度** — 学习统计、进步轨迹可视化
- **语法纠错本** — AI 自动整理语法错误与改进建议

### 游戏化 & 社区

- **游戏化** — PK 对战、积分商城、徽章成就、排行榜
- **社区** — 学习小组、挑战任务、同伴互评

### 管理后台

- 用户管理、内容审核、班级作业、数据看板
- 基于 RBAC 的权限管理（超级管理员 / 教师 / 运维）

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + Zustand 5 + React Router v7 + Recharts |
| 后端 | Spring Boot 3.2 + MyBatis-Plus 3.5 + Flyway + Maven Wrapper |
| 数据库 | MySQL 8.0 + Redis |
| AI 服务 | 腾讯云 ASR + 驰声 Chivox 发音评测 + DeepSeek LLM + EdgeTTS（后端 AI Gateway 统一代理） |
| UI 风格 | Claymorphism（Teal 系配色 + Poppins/Open Sans 字体） |

## 📁 项目结构

```
├── english-speaking-backend/      # Spring Boot 后端（多模块 Maven）
│   ├── es-server/                 # 主启动模块 + Flyway 迁移
│   ├── es-admin/                  # 管理后台模块
│   ├── es-ai-gateway/             # AI 服务代理层（ASR/发音评测/LLM/TTS）
│   ├── es-security/               # 安全认证模块（JWT + RBAC）
│   ├── es-modules/                # 业务模块
│   │   ├── es-user/               # 用户中心
│   │   ├── es-assessment/         # 英语测评
│   │   ├── es-practice/           # 发音/话题/对话练习
│   │   ├── es-learning/           # 学习进度
│   │   └── es-gamification/       # 游戏化
│   ├── es-common/                 # 公共工具
│   └── es-support/                # 辅助支持
├── english-speaking-frontend/     # React 前端
├── doc/                           # 设计文档、PRD、测试报告
└── 启动指南.md                     # 详细启动说明
```

## 🚀 快速开始

### 环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Java | 17+ | 后端运行环境 |
| Node.js | 18+ | 前端运行环境 |
| MySQL | 8.0+ | 数据库 |
| Redis | 5.0+ | 缓存服务 |

### 1. 启动 MySQL 和 Redis

```sql
CREATE DATABASE IF NOT EXISTS english_speaking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 默认连接配置：`localhost:3306`，用户名 `root`，密码 `123456`。密码不同请修改 `application.yml` 中 dev profile 的 `spring.datasource.password`。

### 2. 配置 AI 服务密钥（可选）

AI 服务密钥通过**环境变量**注入，不配也能启动，但语音识别、发音评测、对话评分等 AI 功能将不可用。

```powershell
# Windows PowerShell
$env:TENCENT_SECRET_ID="你的腾讯云 SecretId"
$env:TENCENT_SECRET_KEY="你的腾讯云 SecretKey"
$env:DEEPSEEK_API_KEY="你的 DeepSeek API Key"
```

```bash
# macOS / Linux
export TENCENT_SECRET_ID="你的腾讯云 SecretId"
export TENCENT_SECRET_KEY="你的腾讯云 SecretKey"
export DEEPSEEK_API_KEY="你的 DeepSeek API Key"
```

### 3. 启动后端

```bash
cd english-speaking-backend

# Windows
mvnw.cmd spring-boot:run -pl es-server

# macOS / Linux
./mvnw spring-boot:run -pl es-server
```

首次启动 Flyway 会自动执行迁移脚本，创建所有表并插入种子数据。看到 `Started EsServerApplication` 表示启动成功。

- 后端地址：`http://localhost:8088`
- Swagger 文档：`http://localhost:8088/doc.html`

### 4. 启动前端

```bash
cd english-speaking-frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，API 请求自动代理到 `localhost:8088`。

## ⚙️ 配置说明

所有配置集中在 `english-speaking-backend/es-server/src/main/resources/application.yml`，分为 `dev` 和 `prod` 两个 profile。

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `TENCENT_SECRET_ID` | 腾讯云 ASR SecretId | 空 |
| `TENCENT_SECRET_KEY` | 腾讯云 ASR SecretKey | 空 |
| `TENCENT_APP_ID` | 腾讯云 AppId | `1437508905` |
| `DEEPSEEK_API_KEY` | DeepSeek LLM API Key | 空 |
| `WECHAT_APP_ID` | 微信登录 AppId | 空 |
| `WECHAT_APP_SECRET` | 微信登录 AppSecret | 空 |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` | 生产环境数据库 | `localhost` / `root` / `root` |
| `REDIS_HOST` / `REDIS_PASSWORD` | 生产环境 Redis | `localhost` / 空 |
| `PORT` | 生产环境端口 | `8080` |

### AI 服务提供商

| 能力 | 提供商 | 说明 |
|------|--------|------|
| 语音识别（ASR） | 腾讯云 | 需要 `TENCENT_*` 环境变量 |
| 发音评测 | 驰声 Chivox | 逐词打分 |
| 语音合成（TTS） | EdgeTTS | 免费无需密钥 |
| 大模型（LLM） | DeepSeek | 需要 `DEEPSEEK_API_KEY` |

## 🔑 管理后台

访问 `http://localhost:5173/admin` 使用预设账号登录：

| 角色 | 邮箱 | 说明 |
|------|------|------|
| 超级管理员 | admin@english-speaking.com | 全部管理权限 |
| 教师 | teacher@english-speaking.com | 班级/作业/学情管理 |
| 运维 | operator@english-speaking.com | 内容审核/工单/FAQ |

## 🧪 测试与构建

```bash
# 后端编译与测试
cd english-speaking-backend
mvn clean compile
mvn test

# 前端代码检查与构建
cd english-speaking-frontend
npm run lint
npm run build
```

## 📚 相关文档

- [启动指南.md](./启动指南.md) — 详细的本地启动步骤与常见问题
- [doc/](./doc/) — 系统设计文档、PRD、测试报告

## 📄 许可证

本项目仅供学习交流使用。
