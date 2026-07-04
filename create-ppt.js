const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const {
  FaRobot, FaBookOpen, FaMicrophone, FaShieldAlt,
  FaChartLine, FaUserGraduate, FaCheckCircle,
  FaLayerGroup, FaLock, FaVolumeUp,
  FaLanguage, FaCogs, FaRocket, FaServer,
  FaBrain, FaStar, FaCode, FaCloud, FaGamepad,
  FaUsers, FaCalendarCheck, FaChartBar, FaMap,
  FaExclamationTriangle, FaDatabase, FaProjectDiagram,
  FaClock, FaBullseye, FaTrophy, FaComments,
  FaUserTie, FaHeadset, FaMobileAlt
} = require("react-icons/fa");

const { SiSpringboot, SiMysql, SiRedis, SiDocker } = require("react-icons/si");

// ============================================================
// COLOR PALETTE
// ============================================================
const C = {
  navy:      "1A365D",
  blue:      "2563EB",
  cyan:      "0891B2",
  darkBg:    "0F172A",
  darkBg2:   "1E293B",
  lightBg:   "F8FAFC",
  white:     "FFFFFF",
  cardBg:    "FFFFFF",
  textDark:  "1E293B",
  textMuted: "64748B",
  textLight: "CBD5E1",
  green:     "10B981",
  amber:     "F59E0B",
  red:       "EF4444",
  teal:      "0D9488",
  purple:    "7C3AED",
  v1Green:   "10B981",
  v2Blue:    "3B82F6",
  v3Purple:  "8B5CF6",
};

// ============================================================
// HELPERS
// ============================================================
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function iconToBase64(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}
const mkShadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.10 });
const mkCardShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.08 });

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "AI英语口语训练系统团队";
  pres.title = "AI英语口语训练系统 — 项目演示";

  function addSectionHeader(slide, title, subtitle) {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.cyan } });
    slide.addText(title, { x: 0.6, y: 0.3, w: 8.8, h: 0.65, fontSize: 30, fontFace: "Georgia", color: C.navy, bold: true, margin: 0 });
    if (subtitle) {
      slide.addText(subtitle, { x: 0.6, y: 0.9, w: 8.8, h: 0.35, fontSize: 12, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    }
  }

  // ==========================================================
  // PRE-RENDER ALL ICONS
  // ==========================================================
  const iconDefs = {
    robot: FaRobot, book: FaBookOpen, mic: FaMicrophone, shield: FaShieldAlt,
    chart: FaChartLine, user: FaUserGraduate, check: FaCheckCircle,
    layers: FaLayerGroup, lock: FaLock, volume: FaVolumeUp,
    lang: FaLanguage, cogs: FaCogs, rocket: FaRocket, server: FaServer,
    brain: FaBrain, star: FaStar, code: FaCode, cloud: FaCloud,
    gamepad: FaGamepad, users: FaUsers, calendar: FaCalendarCheck,
    chartbar: FaChartBar, map: FaMap, warning: FaExclamationTriangle,
    database: FaDatabase, diagram: FaProjectDiagram, clock: FaClock,
    bullseye: FaBullseye, trophy: FaTrophy, comments: FaComments,
    usertie: FaUserTie, headset: FaHeadset, mobile: FaMobileAlt,
  };

  const colorIcons = {};
  for (const [k, Comp] of Object.entries(iconDefs)) {
    colorIcons[k] = await iconToBase64(Comp, "#FFFFFF", 256);
  }

  const coloredIcons = {};
  const colorMap = {
    robot: C.cyan, book: C.blue, mic: C.green, shield: C.amber,
    chart: C.teal, user: C.blue, check: C.green, layers: C.cyan,
    lock: C.amber, volume: C.teal, lang: C.blue, cogs: C.navy,
    rocket: C.cyan, server: C.navy, brain: C.cyan, star: C.amber,
    code: C.blue, cloud: C.cyan, gamepad: C.purple, users: C.blue,
    calendar: C.green, chartbar: C.teal, map: C.purple,
    warning: C.red, database: C.navy, diagram: C.cyan, clock: C.amber,
    bullseye: C.red, trophy: C.amber, comments: C.blue,
    usertie: C.navy, headset: C.teal, mobile: C.blue,
  };
  for (const [k, Comp] of Object.entries(iconDefs)) {
    coloredIcons[k] = await iconToBase64(Comp, "#" + colorMap[k], 256);
  }

  // ==========================================================
  // SLIDE 1 — TITLE
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.darkBg };
    slide.addShape(pres.shapes.OVAL, { x: 7.5, y: -1.5, w: 4.5, h: 4.5, fill: { color: C.navy, transparency: 60 } });
    slide.addShape(pres.shapes.OVAL, { x: 8.5, y: 2.5, w: 3.5, h: 3.5, fill: { color: C.cyan, transparency: 88 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.2, w: 0.06, h: 2.4, fill: { color: C.cyan } });
    slide.addText("AI 英语口语训练系统", { x: 1.2, y: 1.2, w: 7.5, h: 1.2, fontSize: 42, fontFace: "Georgia", color: C.white, bold: true, margin: 0 });
    slide.addText("基于自然语言处理与大语言模型的智能口语学习平台", { x: 1.2, y: 2.4, w: 7.5, h: 0.6, fontSize: 18, fontFace: "Microsoft YaHei", color: C.textLight, margin: 0 });
    slide.addShape(pres.shapes.RECTANGLE, { x: 1.2, y: 3.3, w: 3.0, h: 0.02, fill: { color: C.cyan, transparency: 50 } });
    slide.addText([
      { text: "V1.0 ✅ 已完成  |  V2.0 ✅ 已完成  |  V3.0 规划中  |  ", options: { fontSize: 14, color: C.cyan } },
      { text: "前后端分离 + AI Gateway", options: { fontSize: 14, color: C.textLight } },
    ], { x: 1.2, y: 3.55, w: 7.5, h: 0.5, fontFace: "Microsoft YaHei", margin: 0 });
    slide.addText("React 19 + TypeScript + Spring Boot 3.2 + MySQL 8.0 + Flyway", { x: 1.2, y: 4.1, w: 7.5, h: 0.4, fontSize: 11, fontFace: "Consolas", color: C.textMuted, margin: 0 });
  }

  // ==========================================================
  // SLIDE 2 — 项目背景与痛点
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "项目背景与价值主张", "涵盖全年龄段（6-99 岁），V1.0 核心群体：K12 学生（12-18 岁）+ 大学生（四六级口语考试）");

    // Pain Points - 4 cards
    const pains = [
      { icon: colorIcons.clock, title: "练习机会匮乏", desc: "课堂时间有限，40+ 人班人均练习不足 5 分钟，口语训练严重不足" },
      { icon: colorIcons.warning, title: "反馈不及时不准确", desc: "依赖人工批改，等待周期长；主观性强，缺乏标准化的音素级纠错" },
      { icon: colorIcons.lock, title: "培训成本高昂", desc: "线下外教一对一 300-500 元/课时，年花费上万元，普通家庭难以承受" },
      { icon: colorIcons.mobile, title: "时空限制严重", desc: "线下机构时间固定、地点受限；成人难以在工作之余抽出固定时间学习" },
    ];
    pains.forEach((p, i) => {
      const yBase = 1.5 + i * 0.9;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yBase, w: 4.5, h: 0.78, fill: { color: C.white }, shadow: mkCardShadow() });
      slide.addImage({ data: p.icon, x: 0.7, y: yBase + 0.15, w: 0.42, h: 0.42 });
      slide.addText(p.title, { x: 1.25, y: yBase + 0.05, w: 3.5, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(p.desc, { x: 1.25, y: yBase + 0.42, w: 3.5, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });

    // Right side - Solution big card
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.5, w: 4.2, h: 3.6, fill: { color: C.navy } });
    slide.addImage({ data: colorIcons.rocket, x: 5.7, y: 1.7, w: 0.45, h: 0.45 });
    slide.addText("本系统解决方案", { x: 6.25, y: 1.7, w: 3.0, h: 0.45, fontSize: 18, fontFace: "Georgia", color: C.white, bold: true, margin: 0 });

    const sols = [
      { num: "01", title: "AI 驱动个性化", desc: "基于 NLP+LLM，自适应调整难度与学习内容，模拟外教互动体验" },
      { num: "02", title: "音素级发音评测", desc: "精确到 44 个英语音素的评分纠正 + 逐词颜色反馈（红/黄/绿）" },
      { num: "03", title: "全天候情景对话", desc: "5→60+ 场景 × 多轮角色扮演，随时随地开口练习，不受时空限制" },
      { num: "04", title: "全年龄段覆盖", desc: "儿童/青少年/大学生/职场人士/中老年，分龄分层的个性化学习路径" },
      { num: "05", title: "学习闭环", desc: "\"测→评→练→看\" 四位一体闭环，数据驱动学习效果持续提升" },
    ];
    sols.forEach((s, i) => {
      const yBase = 2.35 + i * 0.52;
      slide.addText(s.num, { x: 5.7, y: yBase, w: 0.4, h: 0.35, fontSize: 14, fontFace: "Georgia", color: C.cyan, bold: true, margin: 0 });
      slide.addText(s.title, { x: 6.15, y: yBase, w: 1.5, h: 0.35, fontSize: 12, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
      slide.addText(s.desc, { x: 7.6, y: yBase, w: 1.7, h: 0.35, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textLight, margin: 0 });
    });

    // Core user groups
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.1, w: 9.0, h: 0.38, fill: { color: C.cyan, transparency: 90 } });
    slide.addText("核心用户群：K12 学生（中考/高考口语应试）· 大学生（四六级口语考试）· 职场人士（商务英语）· 中老年（兴趣学习）", {
      x: 0.7, y: 5.1, w: 8.6, h: 0.38, fontSize: 11, fontFace: "Microsoft YaHei", color: C.navy, bold: true, align: "center", valign: "middle", margin: 0
    });
  }

  // ==========================================================
  // SLIDE 3 — 产品功能全景图（7 大模块 × 3 版本）
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "产品功能全景图", "7 大功能模块 × 3 版本演进，40 天完整交付路线");

    // Table header
    const hdrY = 1.4;
    const colX = [0.3, 3.4, 5.4, 7.6, 9.3];
    const colW = [3.1, 2.0, 2.2, 1.7, 0];
    const headers = ["功能模块", "V1.0 MVP", "V2.0 增强版", "V3.0 完整版", "状态"];

    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: hdrY, w: 9.4, h: 0.45, fill: { color: C.navy } });
    headers.forEach((h, i) => {
      slide.addText(h, { x: colX[i], y: hdrY, w: colW[i], h: 0.45, fontSize: 11, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    });

    const modules = [
      { name: "① 用户中心", v1: "注册/登录 + 基础画像（年龄+目标三选一）+ 个人资料管理", v2: "多维画像（学习偏好/可用时间/薄弱项标签）", v3: "安全中心（密码修改/设备管理/注销）+ 微信OAuth登录", status: "V1 ✅", statusColor: C.v1Green },
      { name: "② 智能测评", v1: "20 题固定题 + 初中高三档定级", v2: "IRT 自适应出题 + CEFR 六级标准对标", v3: "—（V2 已完整）", status: "V1 ✅", statusColor: C.v1Green },
      { name: "③ 口语训练", v1: "5 场景 × 多轮对话 + 三维评分（准确度/流利度/完整度）+ 逐词颜色+音素纠错", v2: "60+ 场景 + 五维评测（准确度/重音/连读/语调/节奏）+ 语法纠错/角色扮演独立入口", v3: "话题陈述新题型（30s准备+1-2min陈述+LLM评估）+ 离线跟读模式", status: "V1 ✅", statusColor: C.v1Green },
      { name: "④ 学习数据", v1: "3 张数字卡片（天数/次数/平均分）+ 2 条折线图", v2: "雷达图（多维度）+ 打卡热力图 + 场景分布饼图 + 学习路径规划 + 资料推荐", v3: "学习效果预测 + 预警通知", status: "V1 ✅", statusColor: C.v1Green },
      { name: "⑤ 游戏化与社区", v1: "—（V2 新增）", v2: "闯关模式 + 单词PK + 积分勋章 + 排行榜 + 学习小组 + 语音挑战 + 匿名互评", v3: "—", status: "V2 ✅", statusColor: C.v1Green },
      { name: "⑥ 管理后台", v1: "—（V3 新增）", v2: "—（V3 新增）", v3: "教师端（班级管理/作业点评/个体报告）+ 运营端（用户管理/内容审核/数据看板/CSV导出）", status: "V3 规划", statusColor: C.v3Purple },
      { name: "⑦ 智能客服", v1: "—（V3 新增）", v2: "—（V3 新增）", v3: "FAQ 帮助中心 + LLM RAG 对话客服（目标自动解决率>60%）", status: "V3 规划", statusColor: C.v3Purple },
    ];

    modules.forEach((m, i) => {
      const yBase = hdrY + 0.5 + i * 0.58;
      const bgColor = i % 2 === 0 ? C.white : C.lightBg;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: yBase, w: 9.4, h: 0.55, fill: { color: bgColor } });
      slide.addText(m.name, { x: 0.45, y: yBase, w: 2.9, h: 0.55, fontSize: 11, fontFace: "Microsoft YaHei", color: C.textDark, bold: true, valign: "middle", margin: 0 });
      slide.addText(m.v1, { x: 3.5, y: yBase + 0.02, w: 1.85, h: 0.5, fontSize: 8, fontFace: "Microsoft YaHei", color: C.textMuted, valign: "middle", margin: 0 });
      slide.addText(m.v2, { x: 5.5, y: yBase + 0.02, w: 2.05, h: 0.5, fontSize: 8, fontFace: "Microsoft YaHei", color: C.textMuted, valign: "middle", margin: 0 });
      slide.addText(m.v3, { x: 7.7, y: yBase + 0.02, w: 1.6, h: 0.5, fontSize: 8, fontFace: "Microsoft YaHei", color: C.textMuted, valign: "middle", margin: 0 });
      slide.addShape(pres.shapes.RECTANGLE, { x: 9.2, y: yBase + 0.13, w: 0.48, h: 0.28, fill: { color: m.statusColor } });
      slide.addText(m.status, { x: 9.2, y: yBase + 0.13, w: 0.48, h: 0.28, fontSize: 7, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    });

    // Bottom note
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 5.3, w: 9.4, h: 0.02, fill: { color: C.cyan, transparency: 50 } });
    slide.addText("版本节奏：V1.0（15 天）→ V2.0（15 天）→ V3.0（10 天）= 共 40 天 | 团队：3 人并行（前端 + 后端 + 全栈）| 总投入：120 人天", {
      x: 0.5, y: 5.35, w: 9.0, h: 0.25, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0
    });
  }

  // ==========================================================
  // SLIDE 4 — 系统架构总览
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "系统架构总览", "前后端分离 + 六层分层 + AI Gateway 统一代理");

    const layers = [
      { label: "用户终端层", color: C.blue, desc: "桌面 Chrome/Safari/Firefox/Edge · 移动 iOS Safari/Android Chrome · 微信内置浏览器 · 响应式适配 375px~1280px", icon: colorIcons.mobile, y: 1.5 },
      { label: "前端 SPA 层", color: C.cyan, desc: "React 19 + TypeScript + Tailwind CSS 4 + Zustand 5 + React Router v7 · 12 页面 · 录音组件（Web Audio API + MediaRecorder）· IndexedDB 离线暂存", icon: colorIcons.code, y: 2.1 },
      { label: "API 网关 / 中间件层", color: C.navy, desc: "Spring Boot 3.2 + Spring Security + JWT 双 Token 续期 · 全局限流（注册3/min/IP, 登录10/min/IP, 评测1/s/用户）· CORS 白名单 · 审计日志 append-only", icon: colorIcons.shield, y: 2.7 },
      { label: "业务服务层", color: C.teal, desc: "用户服务 · 测评服务 · 口语训练服务 · 对话编排服务 · 独立评分服务（Temp=0.1-0.3）· 进度聚合服务 · Controller→Service→Mapper 三层架构", icon: colorIcons.cogs, y: 3.3 },
      { label: "AI Gateway 适配器层", color: "4338CA", desc: "LlmAdapter 接口 · RealLlmAdapter（生产）· MockLlmAdapter（开发/测试零成本）· ASR/发音评测/TTS Adapter · 音频处理链（ffmpeg 转码→16kHz Mono WAV）", icon: colorIcons.brain, y: 3.9 },
      { label: "数据存储层", color: C.darkBg, desc: "MySQL 8.0 InnoDB（10+ 张表, 全部 UTC）· Flyway 版本化迁移（up+undo）· 本地磁盘音频存储（168h 定时删除）· V2 迁 OSS + Redis 缓存", icon: colorIcons.database, y: 4.5 },
    ];

    layers.forEach((l) => {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: l.y, w: 9.0, h: 0.52, fill: { color: l.color }, shadow: mkShadow() });
      slide.addImage({ data: l.icon, x: 0.7, y: l.y + 0.1, w: 0.3, h: 0.3 });
      slide.addText(l.label, { x: 1.15, y: l.y, w: 2.0, h: 0.28, fontSize: 13, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
      slide.addText(l.desc, { x: 1.15, y: l.y + 0.28, w: 8.1, h: 0.22, fontSize: 8, fontFace: "Microsoft YaHei", color: "FFFFFF", margin: 0 });
    });

    // External AI Services box
    slide.addShape(pres.shapes.RECTANGLE, { x: 2.5, y: 5.15, w: 5.0, h: 0.32, fill: { color: C.cyan, transparency: 85 } });
    slide.addText("外部 AI 服务：ASR（腾讯云/阿里云 NUI）· 发音评测（驰声/讯飞）· LLM（DeepSeek/通义千问/GPT）· TTS（Edge TTS 离线预生成）", {
      x: 2.6, y: 5.15, w: 4.8, h: 0.32, fontSize: 8, fontFace: "Microsoft YaHei", color: C.navy, align: "center", valign: "middle", margin: 0
    });
  }

  // ==========================================================
  // SLIDE 5 — 前端技术栈
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "前端技术栈详解", "React 19 SPA + TypeScript 类型安全 + Tailwind CSS 4 原子化样式");

    const techs = [
      { name: "React 19", category: "UI 框架", desc: "Hooks + 并发渲染 + Suspense 流式输出，组件粒度：12 页面 + 10+ 共享组件", details: ["函数组件 + Hooks（useState/useEffect/useCallback）", "并发特性（useTransition）用于对话流式渲染", "Suspense + ErrorBoundary 异步加载与错误兜底"] },
      { name: "TypeScript", category: "类型系统", desc: "严格模式，接口定义覆盖所有 API 请求/响应 + 组件 Props + Zustand Store", details: ["strict: true 编译时错误检测", "API 响应类型定义（ResponseVO<T> 泛型）", "组件 Props 接口强制约束"] },
      { name: "Tailwind CSS 4", category: "样式方案", desc: "原子化 CSS + 响应式断点（sm/md/lg/xl），主题色变量统一管理", details: ["@theme 自定义 Design Tokens", "darkMode 支持深色模式切换", "375px~1280px 响应式布局"] },
      { name: "Zustand 5", category: "状态管理", desc: "轻量全局状态（< 2KB），替代 Redux，支持持久化中间件", details: ["authStore：用户信息 + JWT Token", "practiceStore：录音/评测临时状态", "conversationStore：对话消息流"] },
      { name: "React Router v7", category: "路由管理", desc: "客户端路由 + 懒加载 + 路由守卫（AuthGuard 未登录拦截）", details: ["lazy() 页面级代码分割", "AuthGuard 组件拦截未登录访问", "嵌套路由：/practice/pronounce/:id"] },
      { name: "Axios", category: "HTTP 客户端", desc: "拦截器链：JWT 自动附带 + Token 过期自动刷新 + 弱网重试 3 次", details: ["request 拦截器：自动注入 Authorization Header", "response 拦截器：401 → 自动 refreshToken", "指数退避重试（500ms/1s/2s）"] },
      { name: "Web Audio API", category: "音频采集", desc: "MediaRecorder + AudioContext，四平台兼容（含微信浏览器 WebM 降级）", details: ["Push-to-Talk 长按录音交互", "MIME 检测：优先 WAV，微信降级 WebM", "波形呼吸灯动画 + 时长/大小校验"] },
    ];

    techs.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xBase = 0.4 + col * 4.8;

      if (i === 6) {
        // Last item spans both columns
        const yBase = 1.45 + row * 1.55;
        slide.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: yBase, w: 9.2, h: 1.35, fill: { color: C.white }, shadow: mkCardShadow() });
        slide.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: yBase, w: 0.06, h: 1.35, fill: { color: C.cyan } });
        slide.addText(t.name, { x: 0.7, y: yBase + 0.1, w: 1.8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
        slide.addText(t.category + " · " + t.desc, { x: 2.5, y: yBase + 0.1, w: 6.8, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
        t.details.forEach((d, di) => {
          slide.addText("• " + d, { x: 0.7, y: yBase + 0.5 + di * 0.25, w: 8.5, h: 0.22, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textDark, margin: 0 });
        });
      } else {
        const yBase = 1.45 + row * 1.55;
        slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 4.55, h: 1.35, fill: { color: C.white }, shadow: mkCardShadow() });
        slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 0.06, h: 1.35, fill: { color: C.cyan } });
        slide.addText(t.name, { x: xBase + 0.2, y: yBase + 0.1, w: 1.8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
        slide.addText(t.category, { x: xBase + 2.0, y: yBase + 0.1, w: 2.2, h: 0.3, fontSize: 9, fontFace: "Calibri", color: C.cyan, bold: true, margin: 0 });
        slide.addText(t.desc, { x: xBase + 0.2, y: yBase + 0.45, w: 4.1, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
        t.details.forEach((d, di) => {
          slide.addText("• " + d, { x: xBase + 0.2, y: yBase + 0.75 + di * 0.22, w: 4.1, h: 0.2, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textDark, margin: 0 });
        });
      }
    });
  }

  // ==========================================================
  // SLIDE 6 — 后端技术栈详情
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "后端技术栈详解", "Spring Boot 3.2 多模块 Maven 项目 + AI Gateway 适配器架构");

    const beTechs = [
      { name: "Spring Boot 3.2", desc: "Java 17+ 企业级应用框架，内嵌 Tomcat，自动配置 + Starter 依赖", details: ["@RestController + @Service + @Mapper 三层", "统一 ResponseVO(code, message, data) 响应", "@ControllerAdvice 全局异常处理 + 友好文案映射", "@Scheduled 定时任务（语音 168h 删除）"] },
      { name: "MyBatis-Plus 3.5", desc: "增强 ORM，Lambda 查询包装器 + 自动分页 + 逻辑删除", details: ["@TableName 明确映射表名", "id-type: AUTO 数据库自增主键", "LambdaQueryWrapper 类型安全查询", "PaginationInnerInterceptor 分页插件"] },
      { name: "MySQL 8.0 + Flyway", desc: "InnoDB 事务引擎 + 版本化 SQL 迁移管理", details: ["Flyway 命名：V{version}__{desc}.sql（双下划线）", "undo/ 子目录存放回滚脚本", "所有时间字段 UTC 存储，前端按浏览器时区展示", "JSON 列支持半结构化数据存储"] },
      { name: "Spring Security", desc: "认证鉴权：JWT 双 Token（Access 2h / Refresh 7d）", details: ["OncePerRequestFilter 拦截所有 /api/v1/* 请求", "开发：Authorization Header Bearer Token", "生产：httpOnly+Secure+SameSite=Strict Cookie", "环境变量 JWT_STORAGE_MODE 控制读取方式"] },
      { name: "AI Gateway", desc: "Adapter 模式：统一接口隔离第三方 AI API 变更", details: ["LlmAdapter 接口（chat / score / pronounceEval）", "RealLlmAdapter：生产环境对接真实 API", "MockLlmAdapter：开发/测试零成本调用", "超时/重试/限流/熔断统一管控"] },
      { name: "Maven 多模块", desc: "es-server · es-ai-gateway · es-modules(5) · es-common · es-security", details: ["es-server：Spring Boot 启动入口 + 全局配置", "es-modules/es-user：用户注册/登录/资料", "es-modules/es-assessment：测评出题/判分", "es-modules/es-practice：发音评测+情景对话", "es-modules/es-learning：学习进度聚合", "es-modules/es-gamification：游戏化预留"] },
    ];

    beTechs.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xBase = 0.4 + col * 4.8;
      const yBase = 1.4 + row * 1.4;

      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 4.55, h: 1.22, fill: { color: C.white }, shadow: mkCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 0.06, h: 1.22, fill: { color: C.navy } });
      slide.addText(t.name, { x: xBase + 0.2, y: yBase + 0.08, w: 2.5, h: 0.28, fontSize: 13, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(t.desc, { x: xBase + 0.2, y: yBase + 0.36, w: 4.1, h: 0.22, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
      t.details.forEach((d, di) => {
        slide.addText("• " + d, { x: xBase + 0.2, y: yBase + 0.62 + di * 0.2, w: 4.1, h: 0.18, fontSize: 8.5, fontFace: "Microsoft YaHei", color: C.textDark, margin: 0 });
      });
    });
  }

  // ==========================================================
  // SLIDE 7 — AI Gateway 适配器架构
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.darkBg };
    slide.addText("AI Gateway 适配器架构", { x: 0.6, y: 0.3, w: 8.8, h: 0.65, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0 });
    slide.addText("Adapter 模式 — 统一接口隔离第三方 API，Mock/Real 双实现，业务代码零改动切换供应商", { x: 0.6, y: 0.85, w: 8.8, h: 0.35, fontSize: 11, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });

    // Three columns: Business → Gateway → External
    const cols = [
      { x: 0.3, w: 2.6, title: "业务服务层", color: C.blue, items: ["PracticeServiceImpl", "ConversationServiceImpl", "AssessmentServiceImpl", "ProgressServiceImpl", "UserServiceImpl"], yStart: 1.5 },
      { x: 3.15, w: 3.7, title: "AI Gateway 核心", color: C.cyan, items: [], yStart: 1.5 },
      { x: 7.1, w: 2.6, title: "第三方 AI 服务", color: C.teal, items: ["ASR 语音识别", "发音评测 API", "LLM 对话模型", "LLM 独立评分", "TTS 语音合成"], yStart: 1.5 },
    ];

    // Left column - Business
    const col0 = cols[0];
    slide.addShape(pres.shapes.RECTANGLE, { x: col0.x, y: col0.yStart, w: col0.w, h: 3.6, fill: { color: C.darkBg2 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: col0.x, y: col0.yStart, w: col0.w, h: 0.45, fill: { color: col0.color } });
    slide.addText(col0.title, { x: col0.x, y: col0.yStart, w: col0.w, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    col0.items.forEach((item, i) => {
      slide.addText("▸ " + item, { x: col0.x + 0.15, y: col0.yStart + 0.6 + i * 0.35, w: col0.w - 0.3, h: 0.3, fontSize: 10, fontFace: "Consolas", color: C.textLight, margin: 0 });
    });

    // Center - Gateway detail
    const col1 = cols[1];
    slide.addShape(pres.shapes.RECTANGLE, { x: col1.x, y: col1.yStart, w: col1.w, h: 3.6, fill: { color: C.darkBg2 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: col1.x, y: col1.yStart, w: col1.w, h: 0.45, fill: { color: col1.color } });
    slide.addImage({ data: colorIcons.brain, x: col1.x + 0.2, y: col1.yStart + 0.08, w: 0.28, h: 0.28 });
    slide.addText("LlmAdapter 接口层", { x: col1.x + 0.55, y: col1.yStart, w: 2.5, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.darkBg, bold: true, valign: "middle", margin: 0 });

    // Interface definition
    slide.addShape(pres.shapes.RECTANGLE, { x: col1.x + 0.15, y: col1.yStart + 0.6, w: col1.w - 0.3, h: 1.2, fill: { color: C.navy, transparency: 30 } });
    slide.addText("<<Interface>> LlmAdapter", { x: col1.x + 0.3, y: col1.yStart + 0.65, w: 3.0, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.cyan, bold: true, margin: 0 });
    ["+ chat(sessionId, messages): ChatResult", "+ scoreEval(sessionId, history): ScoreResult", "+ pronounceEval(audio, text): EvalResult", "+ textToSpeech(text): AudioFile"].forEach((m, mi) => {
      slide.addText(m, { x: col1.x + 0.4, y: col1.yStart + 0.95 + mi * 0.2, w: 3.0, h: 0.18, fontSize: 8.5, fontFace: "Consolas", color: C.textLight, margin: 0 });
    });

    // Implementations
    slide.addShape(pres.shapes.RECTANGLE, { x: col1.x + 0.15, y: col1.yStart + 2.0, w: 1.55, h: 1.0, fill: { color: C.green, transparency: 75 } });
    slide.addText("RealLlmAdapter", { x: col1.x + 0.25, y: col1.yStart + 2.05, w: 1.35, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.green, bold: true, margin: 0 });
    slide.addText("生产环境\n对接真实 API\n超时/重试/限流", { x: col1.x + 0.25, y: col1.yStart + 2.35, w: 1.35, h: 0.55, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textLight, margin: 0 });

    slide.addShape(pres.shapes.RECTANGLE, { x: col1.x + 1.85, y: col1.yStart + 2.0, w: 1.55, h: 1.0, fill: { color: C.amber, transparency: 75 } });
    slide.addText("MockLlmAdapter", { x: col1.x + 1.95, y: col1.yStart + 2.05, w: 1.35, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.amber, bold: true, margin: 0 });
    slide.addText("开发/测试环境\n返回预置数据\n零成本零配额消耗", { x: col1.x + 1.95, y: col1.yStart + 2.35, w: 1.35, h: 0.55, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textLight, margin: 0 });

    slide.addText("音频处理链： WebM→ffmpeg→16kHz Mono WAV → API", { x: col1.x + 0.15, y: col1.yStart + 3.15, w: col1.w - 0.3, h: 0.3, fontSize: 9, fontFace: "Consolas", color: C.cyan, align: "center", fontFace: "Microsoft YaHei", margin: 0 });

    // Right column - External
    const col2 = cols[2];
    slide.addShape(pres.shapes.RECTANGLE, { x: col2.x, y: col2.yStart, w: col2.w, h: 3.6, fill: { color: C.darkBg2 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: col2.x, y: col2.yStart, w: col2.w, h: 0.45, fill: { color: col2.color } });
    slide.addText(col2.title, { x: col2.x, y: col2.yStart, w: col2.w, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    col2.items.forEach((item, i) => {
      slide.addText("▸ " + item, { x: col2.x + 0.15, y: col2.yStart + 0.6 + i * 0.35, w: col2.w - 0.3, h: 0.3, fontSize: 10, fontFace: "Consolas", color: C.textLight, margin: 0 });
    });

    // Arrows
    slide.addText("▶", { x: 2.85, y: 3.0, w: 0.4, h: 0.4, fontSize: 18, color: C.cyan, align: "center", fontFace: "Calibri", margin: 0 });
    slide.addText("▶", { x: 6.75, y: 3.0, w: 0.4, h: 0.4, fontSize: 18, color: C.cyan, align: "center", fontFace: "Calibri", margin: 0 });

    // Design decisions
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 5.25, w: 9.4, h: 0.03, fill: { color: C.textMuted, transparency: 60 } });
    slide.addText("设计决策：① Mock 适配器 → 开发/测试零成本 ② Real 适配器 → 生产对接真实 API ③ 统一接口 → 切换供应商仅需新增适配器类 ④ API Key 仅后端持有 → 前端零密钥暴露", {
      x: 0.5, y: 5.3, w: 9.0, h: 0.25, fontSize: 9.5, fontFace: "Microsoft YaHei", color: C.textLight, margin: 0
    });
  }

  // ==========================================================
  // SLIDE 8 — V1.0 功能模块详解
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "V1.0 MVP 功能模块详解", "状态：✅ 已完成  |  13 API 接口 + 12 前端页面 + 568 测试用例  |  15 天 × 3 人 = 45 人天");

    const modules = [
      {
        icon: colorIcons.user, title: "用户中心", color: C.blue,
        items: ["邮箱/手机号注册 + JWT 双 Token（Access 2h / Refresh 7d）", "年龄采集（6 段：儿童→中老年）+ 学习目标三选一（应试/职场/兴趣）", "个人资料管理：昵称、头像、学习目标修改", "JWT 读取策略：开发环境 Header Bearer，生产环境 httpOnly Cookie", "登录锁定机制：连续 5 次失败锁定 15 分钟"]
      },
      {
        icon: colorIcons.check, title: "智能测评", color: C.green,
        items: ["20 道固定题，覆盖初中高三档难度", "题型：单选题 + 填空题 + 听力理解 + 口语跟读", "评分逻辑：客观题自动判分 + 口语题 LLM 评分", "定级算法：得分区间 → 初/中/高三级 → 推荐练习难度", "测评报告：总分 + 分项得分 + 强弱项分析 + 学习建议"]
      },
      {
        icon: colorIcons.mic, title: "AI 发音评测", color: C.teal,
        items: ["用户跟读标准发音 → 录音上传 → ASR 转写 → 发音评测 API 评分", "三维评分体系：准确度（40%）+ 流利度（30%）+ 完整度（30%）", "逐词颜色反馈：绿色（优秀）/ 黄色（一般）/ 红色（需改进）", "音素级纠错：精确标注 44 个英语音素中发音不准的音素", "音频校验：≤60 秒时长、≥1KB 大小、16kHz 采样率强制校验"]
      },
      {
        icon: colorIcons.comments, title: "智能情景对话", color: C.purple,
        items: ["5 个主题场景：餐厅点餐/酒店入住/机场出行/校园生活/职场面试", "每场景 5 轮 AI 角色扮演对话，动态生成回复 + TTS 语音播报", "场景选择页：卡片式展示（场景图标 + 难度标签 + 场景简介）", "对话结束 → 独立 LLM 评分调用（Temperature=0.1-0.3，评估语法/词汇/流利）", "评分弹窗：总分 + 分项得分 + AI 评语 + 改进建议"]
      },
      {
        icon: colorIcons.chart, title: "学习进度", color: C.amber,
        items: ["3 张数字卡片：累计学习天数 + 总对话次数 + 发音平均分", "2 条折线图：发音得分趋势（按日聚合）+ 对话完成率趋势", "数据来源：cross-table 多表聚合查询，Redis 缓存热点数据", "V1 阶段折线图暂用静态占位，V1.1 启用 Recharts 动态图表", "空状态引导：新用户无数据时展示友好引导文案 + 去练习按钮"]
      },
    ];

    modules.forEach((m, i) => {
      const xBase = i < 3 ? 0.3 + i * 3.15 : 1.85 + (i - 3) * 3.15;
      const yBase = i < 3 ? 1.4 : 3.8;
      const cardW = 2.95;

      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: cardW, h: 2.2, fill: { color: C.white }, shadow: mkCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: cardW, h: 0.5, fill: { color: m.color } });
      slide.addImage({ data: m.icon, x: xBase + 0.12, y: yBase + 0.08, w: 0.3, h: 0.3 });
      slide.addText(m.title, { x: xBase + 0.5, y: yBase, w: cardW - 0.6, h: 0.5, fontSize: 14, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });
      m.items.forEach((item, ii) => {
        slide.addText("• " + item, { x: xBase + 0.12, y: yBase + 0.6 + ii * 0.3, w: cardW - 0.24, h: 0.28, fontSize: 8.5, fontFace: "Microsoft YaHei", color: C.textDark, margin: 0 });
      });
    });
  }

  // ==========================================================
  // SLIDE 9 — V2.0 增强版详解
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "V2.0 增强版功能详解", "状态：✅ 已完成  |  15 天 × 3 人 = 45 人天  |  核心目标：游戏化留存 + 社区裂变 + 场景扩展");

    // Left - New modules
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 3.9, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.v2Blue } });
    slide.addImage({ data: colorIcons.star, x: 0.5, y: 1.43, w: 0.3, h: 0.3 });
    slide.addText("新增模块：游戏化与社区", { x: 0.9, y: 1.35, w: 3.5, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const gamingItems = [
      { sub: "语音闯关", desc: "主题关卡链（如「餐厅」→「酒店」→「机场」）,逐关解锁，完成条件：评分 ≥ 60 分" },
      { sub: "单词 PK", desc: "随机匹配对手，异步对比分数（不做实时对战降低复杂度），积分排名" },
      { sub: "积分勋章系统", desc: "积分规则（练习+5, 闯关+20, PK胜+30），勋章（连续7天/发音满分/百句对话）" },
      { sub: "排行榜", desc: "积分榜 + 闯关进度榜 + 周活跃榜，Redis Sorted Set 实时排序" },
      { sub: "学习小组", desc: "创建/加入小组（≤20 人），组内语音挑战任务，组排行" },
      { sub: "匿名互评", desc: "组内成员匿名听取并打分，互评分配引擎自动随机分配" },
    ];
    gamingItems.forEach((item, i) => {
      const yb = 2.0 + i * 0.48;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yb, w: 0.06, h: 0.38, fill: { color: C.v2Blue } });
      slide.addText(item.sub, { x: 0.7, y: yb, w: 1.4, h: 0.2, fontSize: 11, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(item.desc, { x: 0.7, y: yb + 0.2, w: 3.9, h: 0.18, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });

    // Right - Module upgrades + New modules
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 3.9, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.teal } });
    slide.addImage({ data: colorIcons.chartbar, x: 5.3, y: 1.43, w: 0.3, h: 0.3 });
    slide.addText("模块升级 + 新增能力", { x: 5.7, y: 1.35, w: 3.5, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const upgrades = [
      { sub: "口语训练升级", desc: "5 场景 → 60+ 场景（10 大主题 × 6 场景），五维评测（准确度/重音/连读/语调/节奏），语法纠错 + 角色扮演独立入口" },
      { sub: "学习数据升级", desc: "新增雷达图（多维度能力）+ 打卡热力图（全年）+ 场景分布饼图 + 每日推送任务 + 日历打卡 + 资料推荐（协同过滤）" },
      { sub: "用户中心升级", desc: "基础画像 → 多维画像（学习偏好/可用时间/薄弱项标签），学习路径：3 条预设 + 动态生成" },
      { sub: "流式 ASR", desc: "WebSocket 实时语音识别，边说话边出字，替换 V1 的整段上传→等待识别模式" },
      { sub: "CDN 加速", desc: "TTS 音频文件分发 CDN，全国节点加速加载，首包延迟 < 500ms" },
      { sub: "成功指标", desc: "次日留存 >40% · 7日留存 >25% · 人均日练习 >5 次 · 社区日均 UGC >100 条" },
    ];
    upgrades.forEach((item, i) => {
      const yb = 2.0 + i * 0.48;
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: yb, w: 0.06, h: 0.38, fill: { color: C.teal } });
      slide.addText(item.sub, { x: 5.5, y: yb, w: 1.8, h: 0.2, fontSize: 11, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(item.desc, { x: 5.5, y: yb + 0.2, w: 3.9, h: 0.18, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });
  }

  // ==========================================================
  // SLIDE 10 — V3.0 完整版详解
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "V3.0 完整版功能详解", "状态：🟣 规划中  |  10 天 × 3 人 = 30 人天  |  核心目标：管理后台 + B 端基础 + C 端体验升级");

    // Two columns
    // Left - 管理后台
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 3.9, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.v3Purple } });
    slide.addImage({ data: colorIcons.usertie, x: 0.5, y: 1.43, w: 0.3, h: 0.3 });
    slide.addText("管理后台（新增模块六）", { x: 0.9, y: 1.35, w: 3.5, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const adminItems = [
      { sub: "教师端 — 班级管理", desc: "班级 CRUD + 邀请码生成/加入，班级花名册，学生批量导入" },
      { sub: "教师端 — 作业系统", desc: "作业布置（选择场景+设置要求+定时发布），文字/语音点评，全班概览 + 个体报告 + CSV 导出" },
      { sub: "运营端 — 用户管理", desc: "用户搜索（ID/手机/邮箱）+ 详情查看 + 封禁/解封 + 操作日志" },
      { sub: "运营端 — 内容审核", desc: "AI 预审（敏感词/违规检测）→ 人工复审队列 → 批量通过/驳回" },
      { sub: "运营端 — 数据看板", desc: "DAU / MAU / 留存率 / 付费转化率 / 渠道来源 / 功能使用排行" },
      { sub: "RBAC 权限体系", desc: "角色：教师/运营/管理员，资源级权限控制，操作日志全记录" },
    ];
    adminItems.forEach((item, i) => {
      const yb = 2.0 + i * 0.48;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yb, w: 0.06, h: 0.38, fill: { color: C.v3Purple } });
      slide.addText(item.sub, { x: 0.7, y: yb, w: 2.2, h: 0.2, fontSize: 10.5, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(item.desc, { x: 0.7, y: yb + 0.2, w: 3.9, h: 0.18, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });

    // Right - C端升级
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 3.9, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.teal } });
    slide.addImage({ data: colorIcons.headset, x: 5.3, y: 1.43, w: 0.3, h: 0.3 });
    slide.addText("C 端升级（模块七 + 增强）", { x: 5.7, y: 1.35, w: 3.5, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const cupgradeItems = [
      { sub: "智能客服（模块七）", desc: "FAQ 帮助中心 + LLM RAG 对话客服，知识库覆盖全部功能，目标自动解决率 >60%" },
      { sub: "实时 TTS 流式播报", desc: "对话 AI 回复支持流式 TTS 语音合成，将「文本对话」升级为「语音对话」沉浸式体验" },
      { sub: "话题陈述新题型", desc: "30 秒准备 + 1-2 分钟自由陈述 + LLM 综合评估（内容/逻辑/语法/发音），模拟口语考试题型" },
      { sub: "账号安全中心", desc: "密码修改 · 设备管理（查看/踢出登录设备）· 账号注销（7 天冷静期）" },
      { sub: "微信 OAuth 登录", desc: "微信公众号/小程序内一键授权登录，降低注册门槛，无需填写手机号" },
      { sub: "离线跟读模式", desc: "下载离线包（≤50MB），无网络环境跟读练习，联网后自动同步学习记录" },
    ];
    cupgradeItems.forEach((item, i) => {
      const yb = 2.0 + i * 0.48;
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: yb, w: 0.06, h: 0.38, fill: { color: C.teal } });
      slide.addText(item.sub, { x: 5.5, y: yb, w: 2.5, h: 0.2, fontSize: 10.5, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(item.desc, { x: 5.5, y: yb + 0.2, w: 3.9, h: 0.18, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });
  }

  // ==========================================================
  // SLIDE 11 — 三版本迭代路线图
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "三版本迭代路线图与排期", "3 人团队 × 40 天 × 120 人天 = 从 MVP 到完整版全功能覆盖");

    // Timeline bar
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.7, w: 8.4, h: 0.05, fill: { color: C.textMuted } });

    // Phase blocks on the timeline
    const phases = [
      { x: 0.8, w: 2.6, label: "V1.0 MVP", sub: "Day 1-15 · 45 人天", color: C.v1Green, icon: colorIcons.rocket,
        tasks: ["初始化+探路（3天）：项目搭建 + Flyway建库 + AI Gateway框架", "核心开发（9天）：5模块全功能 + 5场景对话 + 三维评测", "联调上线（3天）：录音兼容优化 + 压测 + 冒烟测试 + 生产部署"],
        badge: "✅ 已完成", badgeColor: C.v1Green },
      { x: 3.6, w: 2.6, label: "V2.0 增强版", sub: "Day 16-30 · 45 人天", color: C.v2Blue, icon: colorIcons.gamepad,
        tasks: ["模块升级（5天）：60+场景 + 五维评测 + 流式ASR + 雷达图", "游戏化（5天）：闯关+PK+勋章+排行榜+配音挑战", "社区+路径（3天）：小组+语音挑战+互评+学习路径+CDN", "联调上线（2天）：1000并发压测 + 灰度发布 + 冒烟测试"],
        badge: "✅ 已完成", badgeColor: C.v1Green },
      { x: 6.4, w: 2.6, label: "V3.0 完整版", sub: "Day 31-40 · 30 人天", color: C.v3Purple, icon: colorIcons.cogs,
        tasks: ["管理后台（4天）：教师端+运营端+RBAC+Elasticsearch", "C端升级（4天）：智能客服+实时TTS+话题陈述+微信OAuth", "联调上线（2天）：5000并发压测+全链路监控+运营培训"],
        badge: "🟣 规划中", badgeColor: C.v3Purple },
    ];

    phases.forEach((p) => {
      // Timeline dot
      slide.addShape(pres.shapes.OVAL, { x: p.x + p.w / 2 - 0.12, y: 1.57, w: 0.24, h: 0.24, fill: { color: p.color } });

      // Card
      const cardY = 2.0;
      slide.addShape(pres.shapes.RECTANGLE, { x: p.x, y: cardY, w: p.w, h: 3.2, fill: { color: C.white }, shadow: mkCardShadow() });
      // Header
      slide.addShape(pres.shapes.RECTANGLE, { x: p.x, y: cardY, w: p.w, h: 0.55, fill: { color: p.color } });
      slide.addImage({ data: p.icon, x: p.x + 0.1, y: cardY + 0.1, w: 0.3, h: 0.3 });
      slide.addText(p.label, { x: p.x + 0.5, y: cardY, w: 1.3, h: 0.32, fontSize: 14, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
      slide.addText(p.sub, { x: p.x + 0.5, y: cardY + 0.3, w: 1.4, h: 0.22, fontSize: 8, fontFace: "Microsoft YaHei", color: "FFFFFF", margin: 0 });
      // Badge
      slide.addShape(pres.shapes.RECTANGLE, { x: p.x + p.w - 0.92, y: cardY + 0.12, w: 0.78, h: 0.28, fill: { color: p.badgeColor } });
      slide.addText(p.badge, { x: p.x + p.w - 0.92, y: cardY + 0.12, w: 0.78, h: 0.28, fontSize: 7, fontFace: "Microsoft YaHei", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });

      // Tasks
      p.tasks.forEach((t, ti) => {
        slide.addText("• " + t, { x: p.x + 0.1, y: cardY + 0.7 + ti * 0.52, w: p.w - 0.2, h: 0.48, fontSize: 8, fontFace: "Microsoft YaHei", color: C.textDark, margin: 0 });
      });
    });

    // Bottom summary
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 5.35, w: 9.4, h: 0.03, fill: { color: C.cyan, transparency: 50 } });
    slide.addText("资源估算：V1.0 ~50 元 API 费用 + ~100 元/月服务器 | V2.0 ~500 元 + ~300 元/月 | V3.0 ~1000 元 + ~500 元/月 | 合计 API ~1550 元", {
      x: 0.5, y: 5.38, w: 9.0, h: 0.22, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0
    });
  }

  // ==========================================================
  // SLIDE 12 — 核心业务流程
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "核心业务流程", "发音评测流程（左）+ 智能对话流程（右），展示完整的「测→评→练→看」闭环");

    // Left - Pronunciation eval flow
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 4.0, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.teal } });
    slide.addText("发音评测流程", { x: 0.4, y: 1.35, w: 4.4, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const evalFlow = [
      { step: "①", title: "选择练习内容", desc: "从系统预设的跟读句子列表中选择，展示标准文本 + TTS 示范发音" },
      { step: "②", title: "录音采集", desc: "Push-to-Talk 长按录音，Web Audio API 采集，MIME 检测（优先 WAV，微信降级 WebM）" },
      { step: "③", title: "音频预处理", desc: "ffmpeg 转码：统一 16kHz Mono WAV 格式，时长校验 ≤60s，大小校验 ≥1KB" },
      { step: "④", title: "AI Gateway 处理", desc: "ASR 语音转文本 → 发音评测 API 比对标准发音 → 返回音素级评分" },
      { step: "⑤", title: "结果渲染", desc: "三维评分展示 + 逐词颜色标记（红/黄/绿）+ 音素纠错面板 + 重练按钮" },
    ];
    evalFlow.forEach((f, i) => {
      const yb = 2.0 + i * 0.58;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yb, w: 4.2, h: 0.5, fill: { color: C.lightBg } });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yb, w: 0.05, h: 0.5, fill: { color: C.teal } });
      slide.addText(f.step + " " + f.title, { x: 0.7, y: yb + 0.02, w: 3.8, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(f.desc, { x: 0.7, y: yb + 0.26, w: 3.8, h: 0.2, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });

    // Right - Conversation flow
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 4.0, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.purple } });
    slide.addText("智能对话流程", { x: 5.2, y: 1.35, w: 4.4, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const convFlow = [
      { step: "①", title: "场景选择", desc: "5 个场景卡片（餐厅/酒店/机场/校园/职场），选择场景 + 难度等级" },
      { step: "②", title: "创建会话", desc: "后端创建 Session，加载场景 Prompt 模板 + 角色设定（服务员/前台/面试官等）" },
      { step: "③", title: "多轮对话", desc: "用户录音 → ASR 转写 → LLM 对话（动态 Temperature）→ AI 回复 → TTS 语音播报" },
      { step: "④", title: "轮次控制", desc: "5 轮对话逐轮推进，每轮用户录音时长限制 60s，超时自动进入下一轮" },
      { step: "⑤", title: "独立评分", desc: "对话结束 → 单独 LLM 调用评分（Temp=0.1-0.3, 语法 40%/词汇 30%/流利 30%）→ 评分弹窗" },
    ];
    convFlow.forEach((f, i) => {
      const yb = 2.0 + i * 0.58;
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: yb, w: 4.2, h: 0.5, fill: { color: C.lightBg } });
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: yb, w: 0.05, h: 0.5, fill: { color: C.purple } });
      slide.addText(f.step + " " + f.title, { x: 5.5, y: yb + 0.02, w: 3.8, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(f.desc, { x: 5.5, y: yb + 0.26, w: 3.8, h: 0.2, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });
  }

  // ==========================================================
  // SLIDE 13 — 安全设计体系
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.darkBg };
    slide.addText("安全保障体系", { x: 0.6, y: 0.3, w: 8.8, h: 0.65, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0 });
    slide.addText("生产级安全防护 — 7 大安全策略全面覆盖 OWASP Top 10 常见风险", { x: 0.6, y: 0.85, w: 8.8, h: 0.35, fontSize: 11, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });

    const securityItems = [
      { icon: colorIcons.shield, title: "API Key 零前端暴露", desc: "所有第三方 AI API 调用统一走后端 AI Gateway 代理，前端代码中不存储任何 API Key。ASR/评测/LLM/TTS 全部经后端转发，网路抓包也无法获取密钥。", color: C.red, tag: "机密性" },
      { icon: colorIcons.lock, title: "字段级答案过滤", desc: "测评题目表 assessment_questions.correct_answer 在 API 响应序列化层强制白名单排除。即使后端误返回，中间件 AnswerFilter 也会自动 strip 该字段。", color: C.amber, tag: "数据安全" },
      { icon: colorIcons.code, title: "Prompt 注入防护", desc: "用户语音 ASR 转写文本：① 长度限制 ≤500 字符强制截断 ② 敏感词正则检测（过滤「Ignore」「System」「指令」等）③ LLM 输出敏感内容兜底替换。", color: C.cyan, tag: "注入防御" },
      { icon: colorIcons.cloud, title: "JWT 安全存储策略", desc: "开发环境：localStorage + Authorization Header。生产环境：httpOnly + Secure + SameSite=Strict Cookie。后端同时支持两种读取方式，环境变量 JWT_STORAGE_MODE 控制。", color: C.blue, tag: "认证安全" },
      { icon: colorIcons.server, title: "CORS 域名白名单", desc: "生产环境 Access-Control-Allow-Origin 严格限制为具体域名，禁用 * 通配符。CSP 头限制脚本来源，CSRF Token 双重防护。", color: C.green, tag: "跨域安全" },
      { icon: colorIcons.brain, title: "评分与对话分离", desc: "对话 Prompt 中绝不嵌入评分指令。对话结束后独立一次 LLM 调用评分，使用低 Temperature（0.1-0.3）确保一致性和客观性，权重：语法 40% + 词汇 30% + 流利 30%。", color: C.teal, tag: "逻辑安全" },
      { icon: colorIcons.clock, title: "审计与数据生命周期", desc: "所有 API 操作 append-only 记录至 audit_logs 表，不可篡改。语音文件 168 小时（7 天）定时删除（@Scheduled 每小时轮询）。全局限流：注册 3/min/IP, 登录 10/min/IP, 评测 1/s/用户。", color: C.purple, tag: "合规" },
      { icon: colorIcons.warning, title: "友好错误文案", desc: "禁止向用户展示技术术语（confidence<0.3、HTTP 500、JSON parse error、timeout）。错误统一映射为已批准的友好文案，如「评测遇到问题，请稍后重试」。", color: C.red, tag: "用户体验" },
    ];

    securityItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xBase = 0.3 + col * 4.8;
      const yBase = 1.35 + row * 1.02;

      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 4.55, h: 0.88, fill: { color: C.darkBg2 } });
      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 0.05, h: 0.88, fill: { color: item.color } });
      slide.addImage({ data: item.icon, x: xBase + 0.15, y: yBase + 0.1, w: 0.3, h: 0.3 });
      slide.addText(item.title, { x: xBase + 0.55, y: yBase + 0.05, w: 2.8, h: 0.25, fontSize: 12, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
      // Tag
      slide.addShape(pres.shapes.RECTANGLE, { x: xBase + 3.5, y: yBase + 0.08, w: 0.8, h: 0.2, fill: { color: item.color, transparency: 60 } });
      slide.addText(item.tag, { x: xBase + 3.5, y: yBase + 0.08, w: 0.8, h: 0.2, fontSize: 7, fontFace: "Microsoft YaHei", color: C.white, align: "center", valign: "middle", margin: 0 });
      slide.addText(item.desc, { x: xBase + 0.15, y: yBase + 0.4, w: 4.25, h: 0.42, fontSize: 8.5, fontFace: "Microsoft YaHei", color: C.textLight, margin: 0 });
    });
  }

  // ==========================================================
  // SLIDE 14 — 数据库设计
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "数据库设计与工程规范", "MySQL 8.0 InnoDB + Flyway 版本化迁移 + 代码工程规范");

    // Left - DB Design
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 3.9, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.navy } });
    slide.addImage({ data: colorIcons.database, x: 0.5, y: 1.43, w: 0.3, h: 0.3 });
    slide.addText("数据库设计", { x: 0.9, y: 1.35, w: 3.5, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const dbItems = [
      { sub: "核心表结构（10+ 张）", desc: "users · assessment_questions · assessment_records · practice_records · conversation_sessions · conversation_messages · conversation_scores · user_progress · audit_logs · user_achievements" },
      { sub: "引擎与字符集", desc: "InnoDB 引擎（行锁 + 事务 + 外键），utf8mb4 字符集（支持 emoji），utf8mb4_unicode_ci 排序规则" },
      { sub: "时间字段规范", desc: "所有时间字段统一 UTC 存储（created_at/updated_at），前端按浏览器时区（Intl.DateTimeFormat）展示" },
      { sub: "主键策略", desc: "自增 BIGINT 主键（id-type: AUTO），@TableName 明确映射表名，避免 MyBatis-Plus 默认命名" },
      { sub: "Flyway 迁移规范", desc: "命名：V{version}__{description}.sql（双下划线），每次迁移同时编写 undo/ 子目录回滚脚本" },
      { sub: "JSON 列扩展", desc: "半结构化数据使用 JSON 列存储（如评测详情、对话元数据），预留 feature_flags 字段支持版本平滑升级" },
    ];
    dbItems.forEach((item, i) => {
      const yb = 2.0 + i * 0.52;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yb, w: 0.05, h: 0.42, fill: { color: C.navy } });
      slide.addText(item.sub, { x: 0.7, y: yb, w: 3.9, h: 0.2, fontSize: 10.5, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(item.desc, { x: 0.7, y: yb + 0.22, w: 3.9, h: 0.2, fontSize: 8, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });

    // Right - Engineering
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 3.9, fill: { color: C.white }, shadow: mkCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.6, h: 0.5, fill: { color: C.blue } });
    slide.addImage({ data: colorIcons.code, x: 5.3, y: 1.43, w: 0.3, h: 0.3 });
    slide.addText("工程规范与代码质量", { x: 5.7, y: 1.35, w: 3.5, h: 0.5, fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

    const engItems = [
      { sub: "API 设计规范", desc: "路径前缀 /api/v1/，统一响应体 ResponseVO(code, message, data)，HTTP 状态码语义正确（200/201/400/401/404/500）" },
      { sub: "三层分层架构", desc: "Controller（接收请求+参数校验）→ Service（业务逻辑编排）→ Mapper（MyBatis-Plus 数据访问），层间通过接口解耦" },
      { sub: "Maven 多模块", desc: "es-server（启动入口）· es-ai-gateway（AI代理）· es-modules（5 业务模块）· es-common（公共工具）· es-security（安全）" },
      { sub: "测试策略", desc: "568 测试用例：单元测试（JUnit 5 + Mockito）+ API 契约测试 + 前后端集成测试 + 安全合规测试" },
      { sub: "文档与注释", desc: "中文文档优先（PRD/HLD/API设计/DB设计），代码标识符英文，注释简洁说明 WHY（非 WHAT）" },
      { sub: "AI Agent 协作", desc: "4 个 Claude Code 子智能体：BE（后端开发）· FE（前端开发）· QA（测试）· PM（产品管理），按 HLD 接口契约并行开发" },
    ];
    engItems.forEach((item, i) => {
      const yb = 2.0 + i * 0.52;
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: yb, w: 0.05, h: 0.42, fill: { color: C.blue } });
      slide.addText(item.sub, { x: 5.5, y: yb, w: 3.9, h: 0.2, fontSize: 10.5, fontFace: "Calibri", color: C.textDark, bold: true, margin: 0 });
      slide.addText(item.desc, { x: 5.5, y: yb + 0.22, w: 3.9, h: 0.2, fontSize: 8, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });
  }

  // ==========================================================
  // SLIDE 15 — 项目关键数据
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.lightBg };
    addSectionHeader(slide, "项目关键数据与里程碑", "V1.0 MVP 交付成果 + 三版本规划数据");

    // Big stat cards
    const stats = [
      { num: "13", label: "API 接口", sub: "/api/v1/ 路径", color: C.blue },
      { num: "12", label: "前端页面", sub: "React 19 SPA", color: C.cyan },
      { num: "568", label: "测试用例", sub: "单元+集成+安全", color: C.green },
      { num: "40", label: "天总工期", sub: "3 版本 × 3 人", color: C.amber },
      { num: "7", label: "功能模块", sub: "含规划版本", color: C.purple },
      { num: "4", label: "AI 能力", sub: "ASR/评测/LLM/TTS", color: C.teal },
    ];

    stats.forEach((s, i) => {
      const xBase = 0.3 + i * 1.6;
      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: 1.4, w: 1.42, h: 1.45, fill: { color: C.white }, shadow: mkCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: xBase, y: 1.4, w: 1.42, h: 0.05, fill: { color: s.color } });
      slide.addText(s.num, { x: xBase, y: 1.55, w: 1.42, h: 0.6, fontSize: 40, fontFace: "Georgia", color: s.color, bold: true, align: "center", margin: 0 });
      slide.addText(s.label, { x: xBase, y: 2.15, w: 1.42, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.textDark, bold: true, align: "center", margin: 0 });
      slide.addText(s.sub, { x: xBase, y: 2.45, w: 1.42, h: 0.25, fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0 });
    });

    // V1.0 Success Metrics
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 3.1, w: 9.4, h: 0.45, fill: { color: C.v1Green, transparency: 85 } });
    slide.addText("V1.0 成功指标", { x: 0.5, y: 3.1, w: 1.5, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.v1Green, bold: true, valign: "middle", margin: 0 });
    slide.addText("注册→首次评测转化率 >70%  |  首次对话完成率 >50%  |  发音评测与人工评分偏差 ≤1 档  |  单次会话时长 >8 分钟  |  四平台录音兼容通过", {
      x: 2.0, y: 3.1, w: 7.5, h: 0.45, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textDark, valign: "middle", margin: 0
    });

    // V2.0 Success Metrics
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 3.7, w: 9.4, h: 0.45, fill: { color: C.v2Blue, transparency: 85 } });
    slide.addText("V2.0 成功指标", { x: 0.5, y: 3.7, w: 1.5, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.v2Blue, bold: true, valign: "middle", margin: 0 });
    slide.addText("次日留存率 >40%  |  7 日留存率 >25%  |  人均每日练习次数 >5 次  |  社区日均 UGC >100 条  |  1000 并发压测通过", {
      x: 2.0, y: 3.7, w: 7.5, h: 0.45, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textDark, valign: "middle", margin: 0
    });

    // V3.0 Success Metrics
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 4.3, w: 9.4, h: 0.45, fill: { color: C.v3Purple, transparency: 85 } });
    slide.addText("V3.0 成功指标", { x: 0.5, y: 4.3, w: 1.5, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.v3Purple, bold: true, valign: "middle", margin: 0 });
    slide.addText("教师→布置作业→点评完整流程通过  |  运营看板核心指标可查  |  智能客服自动解决率 >60%  |  5000 并发压测通过  |  离线模式可用", {
      x: 2.0, y: 4.3, w: 7.5, h: 0.45, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textDark, valign: "middle", margin: 0
    });

    // Key risks
    slide.addText("关键风险与缓解", { x: 0.5, y: 4.95, w: 2.5, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.red, bold: true, margin: 0 });
    const risks = [
      "发音评测 API 效果不达预期 → 前 3 天前置验证 10 条样本，不达标立即切换",
      "微信浏览器录音不兼容 → 前 3 天四平台验证，WebM→WAV 降级方案已实现",
      "40 天工期紧张 → 3 人并行最大化效率，API 契约先行，非核心功能果断后移",
      "LLM 评分一致性差 → 独立评分 + 低 Temperature(0.1-0.3) + 人工抽检",
    ];
    risks.forEach((r, i) => {
      const col = i % 2;
      slide.addText("• " + r, { x: 0.5 + col * 4.8, y: 5.25 + (i < 2 ? 0 : 0.22), w: 4.5, h: 0.2, fontSize: 8.5, fontFace: "Microsoft YaHei", color: C.textMuted, margin: 0 });
    });
  }

  // ==========================================================
  // SLIDE 16 — CLOSING
  // ==========================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.darkBg };
    slide.addShape(pres.shapes.OVAL, { x: -2, y: -2, w: 5, h: 5, fill: { color: C.navy, transparency: 60 } });
    slide.addShape(pres.shapes.OVAL, { x: 7.5, y: 3.5, w: 4.5, h: 4.5, fill: { color: C.cyan, transparency: 88 } });

    slide.addText("谢谢！", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontSize: 56, fontFace: "Georgia", color: C.white, bold: true, align: "center", margin: 0 });

    slide.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 2.0, w: 3, h: 0.03, fill: { color: C.cyan } });

    slide.addText("AI 英语口语训练系统", { x: 0.5, y: 2.3, w: 9, h: 0.7, fontSize: 28, fontFace: "Georgia", color: C.cyan, align: "center", margin: 0 });

    slide.addText("基于自然语言处理与大语言模型的智能口语学习平台", { x: 1.5, y: 3.0, w: 7, h: 0.4, fontSize: 14, fontFace: "Microsoft YaHei", color: C.textLight, align: "center", margin: 0 });

    slide.addText([
      { text: "V1.0 MVP ✅ 已完成  |  V2.0 增强版 ✅ 已完成  |  V3.0 完整版 🟣 规划中", options: { fontSize: 12, color: C.textLight } },
    ], { x: 1.5, y: 3.5, w: 7, h: 0.4, fontFace: "Microsoft YaHei", align: "center", margin: 0 });

    slide.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 4.0, w: 3, h: 0.02, fill: { color: C.cyan, transparency: 60 } });

    slide.addText("React 19 · TypeScript · Tailwind CSS 4 · Zustand 5 · Spring Boot 3.2 · MyBatis-Plus 3.5 · MySQL 8.0 · Flyway", {
      x: 0.5, y: 4.2, w: 9, h: 0.35, fontSize: 10, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0
    });
    slide.addText("ASR 语音识别 · 音素级发音评测 · LLM 情景对话 · TTS 语音合成 · AI Gateway 统一代理", {
      x: 0.5, y: 4.55, w: 9, h: 0.35, fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0
    });
  }

  // ==========================================================
  // WRITE
  // ==========================================================
  await pres.writeFile({ fileName: "h:\\NLP-ES\\AI英语口语训练系统_项目演示_v2.pptx" });
  console.log("PPT 生成完成: h:\\NLP-ES\\AI英语口语训练系统_项目演示_v2.pptx");
  console.log("共 16 页精美幻灯片");
}

main().catch(err => { console.error(err); process.exit(1); });
