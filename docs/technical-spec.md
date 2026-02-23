# Inkrement（日进）技术规格说明书

> **Tech Spec v1.0** · 配合 PRD v1.2 使用  
> 本文档预确认所有开发中的技术决策，开发阶段无需再做选型讨论。

---

## 一、技术栈总表

| 层级 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| **语言** | TypeScript | 5.x | 全栈统一语言 |
| **前端框架** | Next.js (App Router) | 15.x | SSR + API Routes 一体化 |
| **UI 样式** | Tailwind CSS | 4.x | 原子化 CSS，移动端优先 |
| **UI 组件** | shadcn/ui | latest | 基于 Radix UI 的组件库，可定制 |
| **图表** | Recharts | 2.x | 成绩统计折线图 |
| **表单** | React Hook Form + Zod | — | 表单管理 + 类型安全校验 |
| **客户端状态** | Zustand | 5.x | 轻量级状态管理 |
| **ORM** | Prisma | 6.x | 类型安全数据库操作 |
| **数据库** | SQLite | — | 单文件轻量数据库 |
| **认证** | NextAuth.js | 5.x | 手机号 + 短信验证码登录 |
| **包管理器** | pnpm | 9.x | 节省磁盘空间，安装速度快 |
| **Node.js** | Node.js | 20 LTS | 长期支持版本 |

---

## 二、部署架构

### 2.1 服务器

| 项目 | 确认方案 |
|------|----------|
| 云服务商 | 阿里云 |
| 服务器类型 | 轻量应用服务器 |
| 地域 | **香港**（免备案，即开即用） |
| 配置 | 2C2G 起步（约 ¥34/月） |
| 操作系统 | Ubuntu 22.04 LTS |
| 进程管理 | PM2 |
| 反向代理 | Nginx |
| HTTPS | Let's Encrypt (Certbot)，自动续签 |

### 2.2 域名策略

| 阶段 | 方案 |
|------|------|
| 开发测试期 | 使用公网 IP 直接访问，或绑定一个已有域名的子域名 |
| 正式上线 | 注册 `inkrement.com` 或类似域名，指向服务器 IP |
| 备案完成后 | 可选迁回大陆节点以降低延迟 |

### 2.3 外部服务

| 服务 | 提供方 | 用途 | 免费额度 |
|------|--------|------|----------|
| 短信验证码 | 阿里云短信 SMS | 用户注册/登录 | 按量付费，约 ¥0.045/条 |
| 图片存储 | Cloudflare R2 | 拍照上传作文图片 | 10GB 免费存储 + 免费出站 |
| AI 模型 | 阿里云百炼 / DeepSeek | 出题 + 批改 | 按 token 计费 |
| 代码托管 | GitHub | 源码管理 + CI/CD | 免费 |

### 2.4 CI/CD 流程

```
git push → GitHub Actions → 
  1. pnpm install
  2. pnpm build
  3. rsync 到阿里云服务器
  4. pm2 restart inkrement
```

---

## 三、数据模型（Prisma Schema）

以下为完整的数据库模型定义，对应 PRD 中所有核心表。

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // file:./dev.db
}

// ===== 用户系统 =====

model User {
  id          String   @id @default(cuid())
  phone       String   @unique
  role        String   // student | parent | admin
  grade       String?  // 预初 | 初一 | 初二 | 初三
  name        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联
  trainingPlans   TrainingPlan[]
  submissions     Submission[]
  wrongQuestions  WrongQuestion[]
  parentLinks     ParentChild[]   @relation("parent")
  childLinks      ParentChild[]   @relation("child")
}

model ParentChild {
  id         String @id @default(cuid())
  parentId   String
  studentId  String
  inviteCode String @unique

  parent  User @relation("parent", fields: [parentId], references: [id])
  student User @relation("child", fields: [studentId], references: [id])

  @@unique([parentId, studentId])
}

// ===== 训练计划 =====

model TrainingPlan {
  id         String   @id @default(cuid())
  studentId  String
  date       DateTime // 训练日期
  module     String   // chinese_writing | classical_reading | english_writing | english_reading
  status     String   @default("pending") // pending | in_progress | completed | skipped
  createdAt  DateTime @default(now())

  student     User         @relation(fields: [studentId], references: [id])
  submissions Submission[]

  @@unique([studentId, date, module])
}

// ===== 提交记录（支持多版本） =====

model Submission {
  id          String   @id @default(cuid())
  planId      String
  studentId   String
  content     String   // 学生提交的文本内容
  imageUrl    String?  // 拍照上传的图片 URL（R2）
  ocrText     String?  // OCR 识别结果
  score       Int?     // 总评分 0-100
  grade       String?  // A | B | C | D
  feedback    String?  // AI 批改结果 JSON
  version     Int      @default(1)
  createdAt   DateTime @default(now())

  plan    TrainingPlan @relation(fields: [planId], references: [id])
  student User         @relation(fields: [studentId], references: [id])
}

// ===== 错题本 =====

model WrongQuestion {
  id                String   @id @default(cuid())
  studentId         String
  module            String   // 所属模块
  questionContent   String   // 原题内容
  studentAnswer     String?  // 学生答案
  correctAnswer     String?  // 正确答案
  analysis          String?  // AI 解析
  errorCount        Int      @default(1)
  consecutiveCorrect Int     @default(0)
  status            String   @default("active") // active | archived
  lastPracticedAt   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  student User @relation(fields: [studentId], references: [id])
}

// ===== 古文篇目库 =====

model ClassicText {
  id          String  @id @default(cuid())
  title       String
  author      String
  dynasty     String
  content     String  // 原文
  translation String  // 参考译文
  notes       String  // 重点字词注释 JSON
  difficulty  Int     // 1-5
  gradeLevel  String  // 适用年级
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ===== AI 模型配置 =====

model AiConfig {
  id             String   @id @default(cuid())
  module         String   @unique // 所属模块，如 chinese_writing
  provider       String   // qwen | deepseek | glm
  modelName      String   // 具体模型名
  apiKey         String   // API Key（加密存储）
  baseUrl        String?  // 自定义 API 地址
  temperature    Float    @default(0.7)
  updatedAt      DateTime @updatedAt
}

// ===== 短信验证码 =====

model SmsCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([phone, code])
}
```

---

## 四、认证与权限

### 4.1 开发模式认证（Dev Auth Bypass）

> Phase 1-4 使用此方案，Phase 5 替换为正式短信认证。

```
开发模式（NODE_ENV=development）：
1. Seed 脚本预创建 3 个测试用户（学生/家长/管理员）
2. getCurrentUser() 直接返回 Seed 学生用户，无需登录
3. 路由守卫 Middleware 在开发模式下跳过认证校验
4. 可通过 URL 参数切换用户角色：?role=parent 或 ?role=admin
```

### 4.2 正式登录流程（Phase 5 实现）

```
1. 用户输入手机号 → 点击"获取验证码"
2. 后端校验：同一手机号 60 秒内只能发一次
3. 调用阿里云短信 API 发送 6 位验证码
4. 验证码存入 SmsCode 表，有效期 5 分钟
5. 用户输入验证码 → 后端校验
6. 首次登录自动注册，选择角色（学生/家长）
7. 签发 JWT Token（有效期 30 天，自动续期）
```

### 4.3 权限控制

| 角色 | 权限范围 |
|------|----------|
| student | 自己的训练任务、提交记录、错题本 |
| parent | 已关联孩子的所有训练数据（只读） |
| admin | 全部功能 + 后台管理 UI |

### 4.4 邀请码机制

- 学生账号自动生成唯一 6 位邀请码（大写字母 + 数字）
- 家长输入邀请码后关联，一个家长可关联多个孩子
- 邀请码一次使用后不失效（同一家长可多次关联不同孩子）

---

## 五、AI 集成规范

### 5.1 Provider 接口定义

```typescript
interface AIProvider {
  // 文本对话
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  // 结构化输出（JSON 模式）
  structuredChat<T>(messages: ChatMessage[], schema: ZodSchema<T>): Promise<T>;
  // 视觉识别（拍照 OCR）
  vision(imageUrl: string, prompt: string): Promise<string>;
}

interface ChatOptions {
  temperature?: number;   // 默认 0.7
  maxTokens?: number;     // 默认 4096
  responseFormat?: 'text' | 'json';
}
```

### 5.2 各模块默认模型分配

| 模块 | 默认模型 | 用途 |
|------|----------|------|
| 中文写作（出题） | qwen-plus | 生成写作题目 |
| 中文写作（批改） | qwen-max | 深度批改，需要强推理 |
| 古文阅读（出题+批改） | qwen-max | 古文理解需要强模型 |
| 英文写作（出题+批改） | qwen-max | 英文批改 |
| 英文阅读（生成+批改） | qwen-plus | 文章生成 + 判题 |
| 拍照 OCR | qwen-vl-max | 手写体识别 |

> 所有分配均可通过后台管理 UI 实时切换，无需重启。

### 5.3 AI 批改通用 Prompt 模板约定

- 所有 Prompt 统一存放在 `src/lib/ai/prompts/` 目录
- 每个模块一个文件：`chinese-writing.ts`、`classical-reading.ts` 等
- Prompt 模板使用模板字符串，支持动态注入：学生年级、题目内容、历次成绩
- 系统 Prompt 统一包含："你是一位面向 12 岁学生的语文/英语老师，语气鼓励正面"
- 所有批改结果要求返回 **结构化 JSON**，后端用 Zod 校验

### 5.4 批改结果 JSON Schema

**写作类：**

```typescript
const WritingFeedbackSchema = z.object({
  total_score: z.number().min(0).max(100),
  grade: z.enum(['A', 'B', 'C', 'D']),
  summary: z.string(),                    // 一句总结评语
  dimensions: z.array(z.object({
    name: z.string(),                      // 评分维度名
    score: z.number().min(0).max(100),
    comment: z.string(),                   // 详细点评
  })),
  suggestions: z.array(z.string()).min(3), // 修改建议
  rewrite_example: z.string(),            // 示范改写
  reference_essay: z.string().optional(),  // 参考范文（英文写作）
});
```

**阅读类：**

```typescript
const ReadingFeedbackSchema = z.object({
  questions: z.array(z.object({
    question_id: z.number(),
    is_correct: z.boolean(),
    student_answer: z.string(),
    correct_answer: z.string(),
    analysis: z.string(),                  // 详细解析
    source_text: z.string().optional(),    // 原文依据（英文阅读）
  })),
  total_correct: z.number(),
  total_questions: z.number(),
  score: z.number().min(0).max(100),
  vocabulary: z.array(z.object({          // 生词/重点词汇
    word: z.string(),
    meaning: z.string(),
    example: z.string().optional(),
  })).optional(),
});
```

---

## 六、API 路由设计

### 6.1 认证

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/auth/send-code` | 发送短信验证码 |
| POST | `/api/auth/verify` | 验证码校验 + 登录/注册 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/auth/logout` | 退出登录 |

### 6.2 训练系统

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/training/today` | 获取今日训练任务 |
| GET | `/api/training/generate` | 生成训练题目（AI） |
| POST | `/api/training/submit` | 提交答案，触发 AI 批改 |
| GET | `/api/training/history` | 历史训练记录列表 |
| GET | `/api/training/[id]` | 训练详情（含所有版本） |

### 6.3 错题本

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/mistakes` | 错题列表（支持按模块筛选） |
| POST | `/api/mistakes/practice` | 错题专项练习 |

### 6.4 家长端

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/parent/link` | 输入邀请码关联孩子 |
| GET | `/api/parent/children` | 已关联孩子列表 |
| GET | `/api/parent/child/[id]/records` | 查看孩子训练记录 |

### 6.5 后台管理

| Method | Path | 说明 |
|--------|------|------|
| CRUD | `/api/admin/classic-texts` | 古文篇目管理 |
| GET/PUT | `/api/admin/ai-config` | AI 模型配置 |
| GET | `/api/admin/users` | 用户列表 |
| GET | `/api/admin/stats` | 训练统计数据 |

### 6.6 文件上传

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/upload/image` | 拍照上传 → R2 存储 → 返回 URL |
| POST | `/api/upload/ocr` | 图片 URL → Qwen-VL OCR → 返回文本 |

---

## 七、前端页面与路由

### 7.1 路由结构

```
/                        → 重定向到 /dashboard 或 /login
/login                   → 登录页（手机号 + 验证码）
/register                → 注册页（选择角色 + 年级）
/dashboard               → 学生主页（今日任务 + 连续打卡）
/training/[id]           → 训练页面（做题 + 提交）
/training/[id]/result    → 批改结果页
/calendar                → 打卡日历
/history                 → 历史记录列表
/history/[id]            → 历史详情（含版本切换）
/mistakes                → 错题本
/stats                   → 成绩统计（折线图）
/parent                  → 家长主页
/parent/link             → 关联孩子（输入邀请码）
/parent/child/[id]       → 查看孩子数据
/admin                   → 后台管理首页
/admin/texts             → 古文篇目管理
/admin/ai-config         → AI 模型配置
/admin/users             → 用户管理
/admin/stats             → 训练数据统计
```

### 7.2 设计规范

| 项目 | 确认方案 |
|------|----------|
| 色系 | 清新蓝绿色系（主色 `#06b6d4` cyan-500，强调色 `#10b981` emerald-500） |
| 暗色模式 | 一期不支持，统一浅色 |
| 字体 | 中文：系统默认（-apple-system, "PingFang SC"）；英文：Inter |
| 移动端优先 | 全部页面以手机屏幕为首要适配目标，断点 `sm:640px / md:768px / lg:1024px` |
| 完成动效 | 提交成功后展示 confetti 庆祝动画 + 得分动画计数 |
| 组件库 | shadcn/ui 的 Button, Card, Input, Dialog, Select, Badge, Calendar 等 |

---

## 八、关键业务逻辑确认

### 8.1 每日任务生成规则

- 系统每天凌晨 00:00（UTC+8）通过 CRON 任务自动为学生生成当日 `TrainingPlan`
- **MVP 简化方案**：不使用独立的 CRON 服务，学生打开主页时检查今日是否有 plan，无则自动创建
- 周日无固定任务，不自动创建 plan；学生可手动进入自由练习

### 8.2 评分等级映射

| 分数区间 | 等级 |
|----------|------|
| 90-100 | A |
| 75-89 | B |
| 60-74 | C |
| 0-59 | D |

### 8.3 错题入库条件

| 模块类型 | 入库条件 |
|----------|----------|
| 中文写作 | 任一分项评分 < 60 |
| 英文写作 | 总分 < 70 或语法准确性 < 60 |
| 古文阅读 | 具体答错的题目 |
| 英文阅读 | 具体答错的题目 |

### 8.4 错题出库条件

- 连续答对 2 次（阅读类：同一题答对 2 次）
- 写作类：连续 2 次分项评分均 ≥ 70
- `consecutiveCorrect` 字段计数，答错重置为 0

### 8.5 错题复推规则

- 每个训练日最多附加 **2 道**错题
- 优先级：`errorCount DESC, lastPracticedAt ASC`
- 出现在当日任务末尾，可跳过

### 8.6 草稿自动保存

- 使用 `localStorage` 存储当前编辑内容
- 每 **60 秒**自动保存一次
- 提交成功后清除草稿
- Key 格式：`draft_${planId}`

### 8.7 拍照上传流程

```
1. 用户点击「拍照上传」→ 调用 <input type="file" accept="image/*" capture="camera">
2. 选择/拍摄照片 → 前端压缩到最大 2MB（使用 browser-image-compression）
3. 上传到 /api/upload/image → 存入 Cloudflare R2
4. 调用 /api/upload/ocr → Qwen-VL 识别文字
5. 识别结果回显到文本框 → 用户确认/修改
6. 用户点击「提交」→ 正常批改流程
```

### 8.8 重新提交逻辑

- 每次提交 `version` 自增
- 同一 `planId` 下可有多个 `Submission`
- **最终得分** = 最新版本的 `score`
- 历史版本可查看但不可编辑
- 前端展示"当前版本"和"历史版本"切换标签

---

## 九、环境变量清单

```env
# 数据库
DATABASE_URL="file:./data/inkrement.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 阿里云短信
ALIYUN_SMS_ACCESS_KEY_ID=""
ALIYUN_SMS_ACCESS_KEY_SECRET=""
ALIYUN_SMS_SIGN_NAME=""         # 短信签名
ALIYUN_SMS_TEMPLATE_CODE=""     # 验证码模板 ID

# AI 模型（默认配置，可被数据库配置覆盖）
QWEN_API_KEY=""
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="inkrement-uploads"
R2_PUBLIC_URL=""                # 公开访问域名
```

---

## 十、已确认清单

以下问题在开发阶段**不再需要确认**：

- [x] 前端框架：Next.js 15 App Router
- [x] 样式方案：Tailwind CSS 4 + shadcn/ui
- [x] 后端框架：Next.js API Routes（内置）
- [x] 数据库：SQLite + Prisma
- [x] 包管理器：pnpm
- [x] Node.js 版本：20 LTS
- [x] 认证方案：Phase 1-4 Dev Auth Bypass → Phase 5 NextAuth.js + 短信验证码
- [x] 短信服务：阿里云短信 SMS（Phase 5 实现）
- [x] 图片存储：Cloudflare R2
- [x] 部署服务器：阿里云轻量服务器（香港）免备案（Phase 5 部署）
- [x] 操作系统：Ubuntu 22.04 LTS
- [x] 进程管理：PM2
- [x] 反向代理：Nginx + Let's Encrypt
- [x] CI/CD：GitHub Actions
- [x] AI 默认模型：Qwen（qwen-max / qwen-plus / qwen-vl-max）
- [x] AI 备用模型：DeepSeek-V3
- [x] 色系设计：蓝绿色系（cyan + emerald）
- [x] 暗色模式：一期不支持
- [x] 评分等级映射：A(90+) B(75+) C(60+) D(<60)
- [x] 错题入库/出库规则：见第八章
- [x] 草稿保存策略：localStorage + 60秒间隔
- [x] 拍照上传压缩：最大 2MB
- [x] 每日任务生成：学生打开主页时按需创建
- [x] 图表库：Recharts
- [x] 域名注册方案：见附录 A

---

## 附录 A：免备案域名注册指南

> 由于服务器选择阿里云**香港节点**，无需 ICP 备案。域名可在任意注册商购买后直接使用。

### A.1 域名注册商推荐

| 注册商 | 特点 | 价格参考（.com） | 推荐理由 |
|--------|------|-------------------|----------|
| **Cloudflare Registrar** | 零加价（成本价）、自带 DNS + CDN | ~¥60/年 | 💡 **首选**：价格最低 + 自带强大 DNS |
| Namecheap | 老牌国际注册商，首年优惠大 | ~¥50/年（首年） | 备选：WhoisGuard 免费隐私保护 |
| 阿里云万网 | 国内注册商，中文界面 | ~¥69/年 | 若已有阿里云账号，管理方便 |
| Dynadot | 界面简洁，价格适中 | ~¥55/年 | 备选 |

> [!TIP]
> **推荐 Cloudflare Registrar**：成本价注册域名（无加价），自带免费 DNS 解析 + CDN + DDoS 防护。
> 注册地址：[dash.cloudflare.com](https://dash.cloudflare.com)

### A.2 域名选择建议

| 后缀 | 说明 | 是否需备案 |
|------|------|------------|
| `.com` | 最通用，建议首选 | 香港服务器不需要 |
| `.net` | 备选 | 香港服务器不需要 |
| `.app` | Google 推出，强制 HTTPS | 香港服务器不需要 |
| `.cn` | 中国域名，**必须实名认证** | 必须备案（不推荐） |

建议域名：`inkrement.com` / `inkrement.app` / `inkrement.net`

### A.3 DNS 配置步骤

以 Cloudflare 为例（其他注册商类似）：

```
步骤 1：在 Cloudflare 注册并购买域名（或将已有域名转入）
步骤 2：进入 DNS 管理页面
步骤 3：添加 A 记录

  类型: A
  名称: @               ← 主域名（inkrement.com）
  内容: <服务器公网 IP>
  代理: 开启（橙色云图标，启用 CDN）
  TTL:  Auto

步骤 4：添加 www 子域名（可选）

  类型: CNAME
  名称: www
  内容: inkrement.com
  代理: 开启

步骤 5：等待 DNS 生效（通常 1-5 分钟）
步骤 6：在浏览器访问域名验证
```

### A.4 SSL/HTTPS 配置

| 方案 | 说明 |
|------|------|
| **使用 Cloudflare 代理** | Cloudflare 自动提供 SSL 证书，无需服务器端配置。在 SSL/TLS 设置中选择 "Full (Strict)" 模式 |
| **不使用 Cloudflare 代理** | 在服务器上使用 Certbot 申请 Let's Encrypt 免费证书 |

Certbot 命令参考：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书（自动配置 Nginx）
sudo certbot --nginx -d inkrement.com -d www.inkrement.com

# 自动续签（crontab，已由 certbot 自动配置）
sudo certbot renew --dry-run
```

### A.5 完整流程总结

```
1. 在 Cloudflare 注册账号并购买域名（约 ¥60/年）
2. 购买阿里云香港轻量服务器，获得公网 IP
3. 在 Cloudflare DNS 添加 A 记录 → 指向服务器 IP
4. 开启 Cloudflare 代理（自动获得 HTTPS + CDN）
5. 在服务器 Nginx 中配置域名
6. 访问 https://inkrement.com 验证
```

> [!NOTE]
> 全程无需 ICP 备案，注册到可访问最快 **30 分钟内完成**。

---

*— 文档结束 · Tech Spec v1.0 —*
