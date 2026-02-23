# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.4.0] - 2026-02-23

### Added — Phase 4：打卡记录 + 家长端 + 后台管理

- 打卡日历页面（月视图，模块颜色点，月份切换）
- 历史记录列表页（模块筛选 + 分页 + 分数颜色 + 跳转回看）
- 学习统计 API：连续打卡、本周完成、各模块成绩、错题待复习
- 首页实时数据展示 + 底部导航
- 家长端 `/parent`（紫色主题，孩子概览 + 模块成绩 + 最近训练）
- `getStudentId()` 统一学生/家长身份解析
- 4 个 API 升级支持 `?role=parent`（stats/calendar/history/mistakes）
- 管理后台 `/admin`（深色侧边栏，概览统计卡片）
- 古文篇目 CRUD（表格 + 搜索筛选 + 弹窗表单）
- AI 模型配置管理（模块卡片 + 编辑弹窗 + Key 脱敏）
- 用户管理页（角色标签 + 训练/提交统计）
- 个人页面 `/profile`（用户信息 + 菜单 + 开发模式角色切换）

### Fixed

- 修复首页模块卡片返回时的 fade-in 动画导致布局跳动
- 修复导航重复（底部 Tab 与首页快捷卡片重叠）

---

## [0.3.0] - 2026-02-22

### Added — Phase 3：阅读模块 + 错题系统

- 古文阅读模块（AI 出题 + 逐题作答 + AI 批改 + 重点字词）
- 英文写作模块（AI 出题 + 写作 + 语法批改 + 示范段落）
- 英文阅读模块（AI 生成文章 + 5 道题 + 生词表）
- 错题本系统（自动记录 + 按模块筛选 + 答案对比）
- AI 内容缓存（TrainingPlan.aiContent 避免重复 AI 调用）
- 4 个模块路由 upsert 修复缓存竞态条件

---

## [0.2.0] - 2026-02-21

### Added — Phase 2：中文写作模块

- 每日任务自动生成（按周分配模块）
- 学生主页 Dashboard（今日任务卡片）
- 中文写作 AI 出题（记叙文/描写文/读后感/议论文）
- 写作页面（文本输入 + 实时字数 + 草稿自动保存）
- AI 批改（结构化评分 + 详细点评 + 修改建议 + 示范改写）
- 批改结果展示页（分数动画 + 分项评分）
- 重新提交 + 历史版本切换

---

## [0.1.0] - 2026-02-20

### Added — Phase 1：项目脚手架 + 核心链路

- Next.js 15 + TypeScript + Tailwind CSS + pnpm 项目初始化
- Prisma Schema（7 模型：User, ParentChild, TrainingPlan, Submission, WrongQuestion, ClassicText, AiConfig, SmsCode）
- Seed 脚本（测试学生 + 家长 + 管理员 + AI 配置）
- Dev Auth Bypass（开发模式自动登录 + 角色切换）
- AI Provider 抽象层（QwenProvider + QwenVLProvider）
- 全局布局组件（Header + 底部导航栏）
- 设计色系 Token + 移动端适配
