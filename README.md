# Anki AI Coach

告别 Anki 卡片堆积地狱——不用手动制卡，AI 从你的学习材料中自动出题，SM-2 算法安排复习。

## 为什么做这个

Anki 的问题：每学一个新知识点就要手动做卡片，漏几天不复习就会积压成百上千张待处理卡片，最终放弃。

解决思路：**不打牌，只出题**。选择本地的 PDF/PPTX/DOCX/笔记文件，AI 读取后自动生成测试题。每次复习都是全新出题，没有卡片库就没有堆积。答得好间隔拉长，答不好明天再来——SM-2 算法自动接管。

## 核心流程

```
读取本地文件 → AI 总结教程 → AI 生成测试 → 逐题作答 → 自动判分 → SM-2 排期复习
```

- **支持 8 种格式**：PDF、DOCX、PPTX、MD、TXT、CSV、TSV、Anki APKG
- **三种题型**：选择题 + 填空题 + 简答题，AI 根据材料关联度出跨材料综合题
- **离线可用**：没配 API Key 时走规则引擎出题，SQLite 本地存储，不需要后端

## 技术栈

Electron · React 18 · TypeScript · SQLite (sql.js WASM) · Zustand · DeepSeek API · TailwindCSS · Vite

## 快速开始

```bash
pnpm install
pnpm seed          # 填充示例数据
pnpm dev           # 启动 Vite + Electron
```

在右侧 Info 面板配置 DeepSeek API Key 即可启用 AI 出题。

## 目录结构

```
src/
├── components/     # React UI（三栏布局、日历、试题查看器）
├── services/       # AI 出题管线、SM-2 算法、评分引擎
├── database/       # SQLite schema/查询/种子数据
├── store/          # Zustand 状态管理
└── utils/          # 文件解析（PDF/DOCX/PPTX/MD/CSV）
electron/           # Electron 主进程、IPC 桥接
```
