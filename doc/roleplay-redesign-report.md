# 角色扮演（Roleplay）模块改造详细设计报告

> 竞品参考：iStartTalk (istarttalk.cn/roleplay)
> 编写日期：2026-07-04
> 当前版本：V3.0 → 目标版本：V3.1

---

## 1. 竞品分析与差距总结

### 1.1 iStartTalk 角色扮演页核心特征

| 维度 | iStartTalk 做法 |
|------|----------------|
| 页面结构 | 双 Tab：「新建角色扮演」+「历史记录」 |
| 场景卡片 | 自包含卡片：场景名 + 难度徽章 + 描述 + 角色分配 + AI 人设 + 通关目标 + 回合/分数线 + 开始按钮 |
| 难度 | 内置在场景中（Easy/Normal/Hard），无需额外选择 |
| 角色信息 | 卡片上明确标注「你扮演: XX」「AI: YY + 人设描述」 |
| 目标 | 每张卡片有独立的通关目标描述 |
| 量化指标 | 回合数 + 通过分数直接展示在卡片上 |
| 交互 | 点击卡片上的「开始游戏」直接进入对话，一步到位 |

### 1.2 当前 NLP-ES 的差距

| 维度 | 当前 NLP-ES | 差距 |
|------|------------|------|
| 角色扮演入口 | `/roleplay` 独立页面，5 个角色，简单的 emoji + 名字 + 描述卡片 | 缺少难度徽章、角色分配、AI 人设、目标、通过分数 |
| 普通对话入口 | `/conversation` 46 个场景，类别 Tab + 场景卡片 + 单独选难度 | 交互步骤太多（选类别 → 选场景 → 选难度 → 开始） |
| 场景配置 | 硬编码在 `ScenePromptService.java`，只有 role/goal/topics/opening | 缺少结构化元数据（角色、目标、通过分、回合数） |
| 历史记录 | 无专门的历史页面 | 缺少独立的练习记录回顾入口 |
| 分数用途 | 只展示，无通过/不通过概念 | 缺少 pass_score 阈值 |

### 1.3 保留的差异化优势

- **46 个场景** vs iStartTalk 的 10 个，覆盖面更广
- **ASR 语音输入** 完整链路已打通
- **TTS 语音播报**（Edge TTS + Web Speech API 降级）
- **独立 LLM 评分**（语法 / 相关性 / 流利度三维评分）
- **打字机效果** AI 消息逐字输出
- **积分/成就系统** 已对接，完成后发放积分

---

## 2. 改造目标

将当前的「情景对话 + 角色扮演」两个独立入口统一为 **一个角色扮演中心**，对标 iStartTalk 的 UX 模式，同时保留并增强现有功能。

### 2.1 核心改造点

1. **统一入口页** — 合并 `/conversation` + `/roleplay` 为一个全新的 `/roleplay` 页面
2. **场景卡片重设计** — 每张卡片自包含所有信息（难度、角色、AI 人设、目标、回合/分），点击直接开始
3. **场景配置持久化** — 从代码硬编码迁移到数据库表 + 管理后台
4. **历史记录页** — 新增角色扮演历史记录，展示历史会话列表 + 成绩回顾
5. **通过/不通过判定** — 引入 pass_score 阈值，结果页展示通过/未通过

---

## 3. 数据模型设计

### 3.1 新增表：`roleplay_scenes`（角色扮演场景配置）

```sql
CREATE TABLE roleplay_scenes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    scene_key       VARCHAR(50)  NOT NULL UNIQUE COMMENT '场景标识（对应旧 scene 字段）',
    name_zh         VARCHAR(100) NOT NULL COMMENT '场景中文名（如"咖啡店点单"）',
    name_en         VARCHAR(200) COMMENT '场景英文名（如"Coffee Shop Ordering"）',
    description_zh  VARCHAR(500) NOT NULL COMMENT '场景中文描述',
    description_en  VARCHAR(500) COMMENT '场景英文描述',
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'normal' COMMENT '难度: easy/normal/hard',
    user_role_zh    VARCHAR(100) NOT NULL COMMENT '用户扮演角色（如"顾客"）',
    ai_role_zh      VARCHAR(100) NOT NULL COMMENT 'AI 扮演角色（如"咖啡师"）',
    ai_personality  VARCHAR(300) NOT NULL COMMENT 'AI 人设描述（中文）',
    objective_zh    VARCHAR(500) NOT NULL COMMENT '通关目标描述（中文）',
    objective_en    VARCHAR(500) COMMENT '通关目标描述（英文）',
    total_rounds    TINYINT      NOT NULL DEFAULT 5 COMMENT '总回合数',
    pass_score      DECIMAL(5,2) NOT NULL DEFAULT 70.00 COMMENT '通过分数阈值',
    icon_emoji      VARCHAR(10)  NOT NULL DEFAULT '🎭' COMMENT '卡片图标',
    category        VARCHAR(30)  NOT NULL DEFAULT 'general' COMMENT '分类: daily/campus/business/travel/social/academic/crisis',
    sort_order      INT          NOT NULL DEFAULT 0 COMMENT '排序权重',
    is_enabled      TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否启用',
    system_prompt   TEXT         NOT NULL COMMENT '英文 System Prompt（LLM 使用）',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色扮演场景配置表';
```

### 3.2 扩展现有表：`conversation_sessions`

在现有 `conversation_sessions` 表基础上新增字段：

```sql
ALTER TABLE conversation_sessions
    ADD COLUMN roleplay_scene_id BIGINT NULL COMMENT '关联的角色扮演场景ID（NULL=旧版自由对话）',
    ADD COLUMN pass_score DECIMAL(5,2) NULL COMMENT '本场通过分数阈值（从场景配置快照）',
    ADD COLUMN is_passed TINYINT(1) NULL COMMENT '是否通过（total_score >= pass_score）',
    ADD INDEX idx_roleplay_scene (roleplay_scene_id);
```

> **设计理由**：不新建 roleplay_sessions 表，复用 conversation_sessions。底层对话流程（ASR → LLM → TTS → Score）完全一致，通过 `roleplay_scene_id` 是否为 NULL 区分自由对话 / 角色扮演。

### 3.3 预置场景数据（对标 iStartTalk 10 个场景 + 保留精华）

| scene_key | 中文名 | 难度 | 你扮演 | AI 扮演 | 回合 | 通过分 |
|-----------|--------|------|--------|---------|------|--------|
| rp_coffee_shop | 咖啡店点单 | easy | 顾客 | 忙碌但友好的咖啡师 | 5 | 70 |
| rp_hotel_checkin | 酒店入住 | easy | 住客 | 专业的酒店前台 | 5 | 70 |
| rp_ask_directions | 问路 | easy | 游客 | 热心的当地人 | 5 | 70 |
| rp_tech_interview | 面试：软件工程师 | normal | 求职者 | 高级工程经理 | 10 | 75 |
| rp_salary_negotiation | 薪资谈判 | normal | 求职者 | HR 经理 | 10 | 78 |
| rp_restaurant_complaint | 餐厅投诉 | normal | 食客 | 餐厅经理 | 9 | 75 |
| rp_investor_pitch | 向投资人推销 | normal | 创业者 | 风险投资人 | 10 | 80 |
| rp_diplomatic_crisis | 外交危机谈判 | hard | 外交官 | 敌对国家大使 | 12 | 80 |
| rp_thesis_defense | 博士论文答辩 | hard | 博士研究生 | 严苛的答辩教授 | 10 | 80 |
| rp_hostage_negotiation | 人质谈判专家 | hard | 警方谈判专家 | 情绪不稳的劫匪 | 12 | 80 |
| rp_ai_debate | 辩论：AI 应该被监管 | hard | 辩手（支持监管） | 科技自由主义者 | 10 | 78 |

> 加上现有的 5 个角色扮演场景（面试官 John、旅行者 Lucy、同学 Emma、医生 Smith、商务伙伴 Wang），共计 15+ 个角色扮演场景。

---

## 4. API 设计

### 4.1 新增接口

#### 4.1.1 获取角色扮演场景列表

```
GET /api/v1/roleplay/scenes
```

**Response:**
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "sceneKey": "rp_coffee_shop",
      "nameZh": "咖啡店点单",
      "nameEn": "Coffee Shop Ordering",
      "descriptionZh": "在一家忙碌的咖啡店里，你需要用英语完成点单并处理各种突发状况。",
      "difficulty": "easy",
      "difficultyLabel": "Easy",
      "userRoleZh": "顾客",
      "aiRoleZh": "咖啡师",
      "aiPersonality": "一家热门咖啡店里忙碌但友好的咖啡师。你偶尔会听错订单，还会推荐加料。",
      "objectiveZh": "成功点一杯饮品并处理一次下错单的情况，最终拿到正确的饮品。",
      "totalRounds": 5,
      "passScore": 70.0,
      "iconEmoji": "☕",
      "category": "daily"
    }
  ]
}
```

#### 4.1.2 开始角色扮演会话（复用现有接口，扩展参数）

```
POST /api/v1/chat/session/start
```

**Request（扩展）:**
```json
{
  "scene": "rp_coffee_shop",
  "difficulty": "easy",
  "roleplaySceneId": 1
}
```

> 新增 `roleplaySceneId` 可选字段。传入时后端从 `roleplay_scenes` 表读取配置（system_prompt、total_rounds、pass_score）并快照到 session。

#### 4.1.3 获取角色扮演历史记录

```
GET /api/v1/roleplay/history?page=1&size=10
```

**Response:**
```json
{
  "code": 200,
  "data": {
    "total": 25,
    "pages": 3,
    "current": 1,
    "records": [
      {
        "sessionId": 123,
        "sceneKey": "rp_coffee_shop",
        "sceneNameZh": "咖啡店点单",
        "difficulty": "easy",
        "totalScore": 85.5,
        "passScore": 70.0,
        "isPassed": true,
        "totalRounds": 5,
        "completedRounds": 5,
        "grammarScore": 82.0,
        "relevanceScore": 88.0,
        "fluencyScore": 86.0,
        "comment": "Your ordering was natural...",
        "durationSeconds": 180,
        "createdAt": "2026-07-04T10:30:00Z"
      }
    ]
  }
}
```

### 4.2 需修改的现有接口

| 接口 | 改动 |
|------|------|
| `POST /chat/session/start` | `StartSessionDTO` 新增 `roleplaySceneId` 可选字段；Service 层读取场景配置 |
| `POST /chat/end/{sessionId}` | 返回的 `ScoreResultVO` 新增 `passScore`、`isPassed` 字段 |
| `GET /chat/session/active` | 恢复会话时返回场景元数据（角色信息等） |

---

## 5. 前端设计

### 5.1 路由规划

| 路由 | 页面 | 说明 |
|------|------|------|
| `/roleplay` | RoleplayCenterPage | **新建** — 双 Tab 页面（场景列表 + 历史记录） |
| `/roleplay/chat` | RoleplayChatPage | **重构** — 基于现有 RolePlayPage + ConversationPage 对话 UI |
| `/conversation` | 重定向到 `/roleplay` | 兼容旧链接 |
| `/conversation/chat` | 重定向到 `/roleplay/chat` | 兼容旧链接 |

### 5.2 页面布局设计

#### 5.2.1 RoleplayCenterPage — 场景列表 Tab

```
┌──────────────────────────────────────────────┐
│  🎭 角色扮演                                  │
│  通过沉浸式对话场景练习英语口语                │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │ 新建角色扮演 │  │ 历史记录             │  │  ← Tab 切换
│  └──────────────┘  └──────────────────────┘  │
│                                              │
│  ┌─ 难度过滤: [全部] [Easy] [Normal] [Hard] ─┐│
│  │                                            ││
│  │ ┌─────────────────────┐ ┌────────────────┐ ││
│  │ │ ☕ 咖啡店点单        │ │ 🏨 酒店入住    │ ││
│  │ │ [Easy]              │ │ [Easy]         │ ││
│  │ │                     │ │                │ ││
│  │ │ 在一家忙碌的咖啡店… │ │ 你刚抵达一家…  │ ││
│  │ │                     │ │                │ ││
│  │ │ 你扮演: 顾客         │ │ 你扮演: 住客   │ ││
│  │ │ AI: 咖啡师 - 忙碌但  │ │ AI: 前台 - 礼貌 │ ││
│  │ │ 友好，偶尔听错订单…  │ │ 但坚持酒店政策  │ ││
│  │ │                     │ │                │ ││
│  │ │ 🎯 成功点一杯饮品并  │ │ 🎯 顺利办理入住 │ ││
│  │ │ 处理下错单的情况     │ │ 并确认最终安排  │ ││
│  │ │                     │ │                │ ││
│  │ │ 5 回合 · 通过分: 70  │ │ 5 回合·通过:70 │ ││
│  │ │ [═══ 开始游戏 ═══]  │ │ [═══ 开始游戏] │ ││
│  │ └─────────────────────┘ └────────────────┘ ││
│  └────────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**关键交互：**
- 点击「开始游戏」→ 调 `initSession(sceneKey, difficulty, roleplaySceneId)` → 跳转 `/roleplay/chat`
- 难度过滤按钮切换显示对应难度的场景
- 移动端单列，平板双列，桌面三列

#### 5.2.2 RoleplayCenterPage — 历史记录 Tab

```
┌──────────────────────────────────────────────┐
│  🎭 角色扮演                                  │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │ 新建角色扮演 │  │ 历史记录    (25)    │  │
│  └──────────────┘  └──────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ ☕ 咖啡店点单          Easy  ·  85.5 分  ││
│  │ 2026-07-04 10:30      ✅ 已通过          ││
│  │ 语法 82  |  相关 88  |  流利 86          ││
│  ├──────────────────────────────────────────┤│
│  │ 🏨 酒店入住            Easy  ·  62.0 分  ││
│  │ 2026-07-03 14:20      ❌ 未通过 (需70)   ││
│  │ 语法 58  |  相关 65  |  流利 63          ││
│  ├──────────────────────────────────────────┤│
│  │ 💻 面试：软件工程师    Normal ·  78.0 分 ││
│  │ 2026-07-03 09:15      ✅ 已通过          ││
│  │ 语法 75  |  相关 82  |  流利 77          ││
│  └──────────────────────────────────────────┘│
│                                              │
│  [ 加载更多 ]                                │
└──────────────────────────────────────────────┘
```

**关键交互：**
- 点击历史记录项 → 展开详情（完整评分 + LLM 评语）
- 分页加载，每页 10 条
- 通过/未通过视觉区分（绿色 ✅ / 红色 ❌）

#### 5.2.3 RoleplayChatPage — 对话页（重构现有 ConversationPage）

保留现有对话 UI 的核心能力，增强以下方面：

1. **顶部角色信息栏增强**
   - 显示「你扮演: XX」和「AI: YY - 人设」
   - 显示回合进度条（如 3/10 回合）
   - 显示通关目标提示（可折叠）

2. **对话气泡增强**
   - AI 消息气泡左侧显示角色头像/emoji
   - 用户消息气泡右侧显示「你 (角色名)」

3. **结束评分增强**
   - ScoreModal 增加通过/未通过判定
   - 显示「通过分: 70 | 你的分: 85 ✅ 已通过」
   - 未通过时给出鼓励文案 + 「再试一次」按钮

### 5.3 组件拆分

| 组件 | 类型 | 说明 |
|------|------|------|
| `RoleplayCenterPage` | 新建 | 双 Tab 容器页面 |
| `RoleplaySceneGrid` | 新建 | 场景卡片网格 + 难度过滤 |
| `RoleplaySceneCard` | 新建 | 单张场景卡片（含所有元数据 + 开始按钮） |
| `RoleplayHistoryList` | 新建 | 历史记录列表 |
| `RoleplayHistoryItem` | 新建 | 单条历史记录行（含评分摘要） |
| `RoleplayChatPage` | 重构 | 基于现有 ConversationPage 改造 |
| `RoleplayHeader` | 新建 | 对话页顶部信息栏（角色 + 目标 + 进度） |
| `ScoreModal` | 修改 | 增加 passScore / isPassed 展示 |

### 5.4 状态管理

扩展现有 `conversationStore.ts`：

```typescript
// 新增字段
roleplaySceneId: number | null
passScore: number | null
isPassed: boolean | null

// 新增 action
initRoleplaySession: (sceneKey: string, difficulty: string, roleplaySceneId: number) => Promise<void>
```

### 5.5 类型定义

```typescript
// 新增类型
interface RoleplayScene {
  id: number
  sceneKey: string
  nameZh: string
  nameEn?: string
  descriptionZh: string
  difficulty: 'easy' | 'normal' | 'hard'
  difficultyLabel: string
  userRoleZh: string
  aiRoleZh: string
  aiPersonality: string
  objectiveZh: string
  totalRounds: number
  passScore: number
  iconEmoji: string
  category: string
}

interface RoleplayHistoryItem {
  sessionId: number
  sceneKey: string
  sceneNameZh: string
  difficulty: string
  totalScore: number
  passScore: number
  isPassed: boolean
  totalRounds: number
  completedRounds: number
  grammarScore: number
  relevanceScore: number
  fluencyScore: number
  comment: string
  durationSeconds: number
  createdAt: string
}
```

---

## 6. 后端改造

### 6.1 新建 Package：`es-modules/es-practice/.../roleplay/`

```
es-practice/src/main/java/com/es/practice/
├── controller/
│   └── RoleplayController.java        ← 新建
├── service/
│   ├── RoleplaySceneService.java      ← 新建（接口）
│   └── impl/
│       └── RoleplaySceneServiceImpl.java ← 新建
├── entity/
│   └── RoleplayScene.java             ← 新建
├── mapper/
│   └── RoleplaySceneMapper.java       ← 新建
└── dto/
    ├── RoleplaySceneVO.java           ← 新建
    └── RoleplayHistoryVO.java         ← 新建
```

### 6.2 修改现有文件

| 文件 | 改动 |
|------|------|
| `StartSessionDTO.java` | 新增 `roleplaySceneId` 字段 |
| `ConversationServiceImpl.java` | 支持从 `roleplay_scenes` 表读取配置（system_prompt、total_rounds、pass_score） |
| `ConversationResultVO.java` | 新增 `roleplaySceneId`、`userRoleZh`、`aiRoleZh`、`objectiveZh` |
| `ScoreResultVO.java` | 新增 `passScore`、`isPassed` |
| `ConversationSession.java` | 新增 `roleplaySceneId`、`passScore`、`isPassed` 字段 |
| `ConversationSessionMapper.java` | 更新 XML 映射 |

### 6.3 数据库迁移

**V29**: 创建 `roleplay_scenes` 表 + 预置数据
**V30**: 扩展 `conversation_sessions` 表

---

## 7. 实施计划

### Phase 1：数据层（1-2 天）
- [ ] V29 Flyway 迁移：创建 `roleplay_scenes` 表 + 预置 15 个场景数据
- [ ] V30 Flyway 迁移：扩展 `conversation_sessions` 表
- [ ] 新建 Entity + Mapper

### Phase 2：后端 API（2-3 天）
- [ ] `RoleplaySceneService` + `RoleplayController`（场景列表 + 历史记录 API）
- [ ] 修改 `ConversationServiceImpl` 支持 roleplaySceneId
- [ ] 修改 VO 返回场景元数据 + 通过/未通过判定
- [ ] 单元测试

### Phase 3：前端页面（3-4 天）
- [ ] 新建 `RoleplayCenterPage`（双 Tab + 场景卡片网格）
- [ ] 新建 `RoleplayHistoryList`（历史记录分页列表）
- [ ] 重构 `RoleplayChatPage`（增强角色信息栏 + 进度条 + 目标提示）
- [ ] 修改 `ScoreModal`（通过/未通过展示）
- [ ] 扩展 `conversationStore` + API 层
- [ ] 添加旧路由重定向

### Phase 4：联调测试（1-2 天）
- [ ] 前后端联调
- [ ] 边界条件测试（空历史、网络断开、ASR 失败恢复等）
- [ ] 移动端响应式适配验证
- [ ] Claymorphism 设计系统一致性检查

---

## 8. 风险与注意事项

1. **旧数据兼容** — 现有的 `conversation_sessions` 表中 `roleplay_scene_id` 为 NULL，查询历史时需区分「旧版自由对话」和「新版角色扮演」
2. **ScenePromptService 过渡** — 短期内保留 `ScenePromptService` 作为降级方案，当 `roleplay_scenes` 表中找不到场景时回退
3. **前端路由兼容** — `/conversation` 和 `/roleplay` 旧链接需 301 重定向，避免用户书签失效
4. **pass_score 合理性** — 初期阈值基于经验设定，后续应根据实际用户数据调优
5. **场景 Prompt 质量** — 15 个新场景的英文 System Prompt 需要仔细撰写，确保 LLM 角色扮演质量
