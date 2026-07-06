# SpeakNow — AI 英语口语训练系统

基于 AI 的英语口语训练平台，支持发音评测、话题陈述、情景对话、角色扮演等多种练习模式，配合游戏化激励体系和管理后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Tailwind CSS 4 + Zustand + React Router v7 |
| 后端 | Spring Boot 3.2 + MyBatis-Plus 3.5 + Flyway |
| 数据库 | MySQL 8.0 + Redis |
| AI 服务 | 腾讯 ASR + DeepSeek LLM + EdgeTTS（后端 AI Gateway 统一代理） |

## 快速启动

详见 [启动指南.md](./启动指南.md)

```bash
# 1. 启动 MySQL + Redis
# 2. 创建数据库 english_speaking

# 3. 启动后端（端口 8088）
cd english-speaking-backend
# Windows: mvnw.cmd spring-boot:run -pl es-server
# macOS/Linux: ./mvnw spring-boot:run -pl es-server

# 4. 启动前端（端口 5173）
cd english-speaking-frontend
npm install
npm run dev
```

访问 `http://localhost:5173`

## 项目结构

```
├── english-speaking-backend/    # Spring Boot 后端（多模块 Maven）
│   ├── es-server/               # 主启动模块 + Flyway 迁移
│   ├── es-admin/                # 管理后台模块
│   ├── es-ai-gateway/           # AI 服务代理层
│   ├── es-security/             # 安全认证模块
│   ├── es-modules/              # 业务模块
│   │   ├── es-user/             # 用户中心
│   │   ├── es-assessment/       # 英语测评
│   │   ├── es-practice/         # 发音/话题/对话练习
│   │   ├── es-learning/         # 学习进度
│   │   └── es-gamification/     # 游戏化
│   ├── es-common/               # 公共工具
│   └── es-support/              # 辅助支持
├── english-speaking-frontend/   # React 前端
├── doc/                         # 设计文档、PRD、测试报告
└── 启动指南.md                   # 详细启动说明
```

## 功能模块

- **英语测评** — 自适应定级测试，生成能力评估报告
- **发音评测** — 录音逐词打分（准确度、流利度、完整度）
- **话题陈述** — 围绕话题即兴表达，AI 综合评分
- **情景对话** — 与 AI 进行多轮对话练习，实时纠错
- **角色扮演** — 模拟真实场景角色扮演对话
- **学习进度** — 学习统计、进步轨迹可视化
- **语法纠错本** — AI 自动整理语法错误与改进建议
- **游戏化** — PK 对战、积分商城、徽章成就、排行榜
- **社区** — 学习小组、挑战任务、同伴互评
- **管理后台** — 用户管理、内容审核、班级作业、数据看板
