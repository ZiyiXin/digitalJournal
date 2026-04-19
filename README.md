# 角色数字手账（digitalJournal）

一个基于 React + TypeScript + Express + SQLite 的角色数字手账应用。  
当前版本已支持前后端持久化：空间、时间线、相册和树洞数据会写入本地数据库，刷新不丢失。
当前仓库已补齐 Linux 服务器可用的图片缩略图、上传回收、配额校验和生产构建入口，适合先以单机模式部署到腾讯云轻量应用服务器。

## 在线演示

- GitHub Pages Demo: [https://ziyixin.github.io/digitalJournal/](https://ziyixin.github.io/digitalJournal/)

说明：

- 当前线上 Demo 是为 GitHub Pages 单独构建的一份纯静态站点。
- Demo 不连接真实后端，不依赖 Express、SQLite 或服务端上传目录。
- Demo 使用仓库中的静态演示素材，并在浏览器 `localStorage` 中模拟登录态和数据读写。
- 仓库中的完整版仍然是前后端分离架构：前端为 `React + Vite`，后端为 `Express`，数据持久化使用 `SQLite + data/uploads`。
- GitHub Pages 版本只用于展示 UI 和交互流程，不等同于真实生产部署形态。

## 技术栈

- 前端: React 19, TypeScript, Vite 6, Tailwind CSS 4, motion, lucide-react
- 后端: Express 4, TypeScript, multer
- 数据库: SQLite（better-sqlite3）

## 本地运行

### 1) 安装依赖

```bash
npm install
```

### 2) 环境变量

本地开发请复制 `.env.example` 到 `.env`（或直接在系统环境里设置）：

```bash
PORT=3001
HOST=127.0.0.1
DATA_DIR=./data
LEGACY_OWNER_EMAIL=legacy@digital-journal.local
LEGACY_OWNER_PASSWORD=ChangeMeNow123!
LEGACY_OWNER_NICKNAME=Legacy Owner
STORAGE_CAPACITY_GB=20
ORPHAN_UPLOAD_TTL_HOURS=24
```

说明：

- 本地开发时不要设置 `NODE_ENV=production`，否则登录 Cookie 会启用 `secure`，HTTP 本地环境下无法正常登录。
- 生产环境再设置 `NODE_ENV=production`。
- 后台管理面板默认只允许 `LEGACY_OWNER_EMAIL` 对应账号访问。

### 3) 启动开发环境

```bash
npm run dev
```

- 前端默认: `http://localhost:3000`
- 后端默认: `http://localhost:3001`

Vite 已配置代理，前端请求 `/api` 和 `/uploads` 会转发到后端。

## 常用脚本

```bash
npm run dev          # 并行启动前后端
npm run dev:client   # 仅前端
npm run dev:server   # 仅后端
npm run build        # 构建前端生产产物
npm run build:github-pages # 构建 GitHub Pages demo 产物
npm run start        # 运行生产版后端
npm run start:server # 运行生产版后端
npm run verify:stage1 # 阶段1账号隔离验收
npm run lint         # TypeScript 类型检查
```

## 数据与上传目录

- SQLite 数据库: `data/digital-journal.db`
- 上传文件目录: `data/uploads`

以上目录已加入 `.gitignore`。
也可以通过 `DATA_DIR` 环境变量改到共享目录，例如 `/srv/digital-journal/shared/data`。

首次启动说明：

- 仓库不包含任何真实业务数据。
- 服务首次启动时会自动创建空的数据库和上传目录。
- 不会自动创建演示空间或默认用户。
- 只有检测到旧版本历史数据且缺少 `owner_id` 时，才会触发 legacy 数据回填。

## 迭代文档

- 阶段 1（账号 + 数据隔离）改造清单：`docs/stage1-account-isolation-checklist.md`
- 海外服务器部署手册：`docs/overseas-server-deployment-guide.md`
- 完整版 / GitHub Pages Demo 双版本结构说明：`docs/full-vs-demo-architecture.md`

## Demo 与完整版的区别

### GitHub Pages Demo

- 访问地址：`https://ziyixin.github.io/digitalJournal/`
- 构建命令：`npm run build:github-pages`
- 构建产物：`dist-gh-pages/`
- 运行形态：纯静态资源
- 数据来源：演示静态素材 + 浏览器 `localStorage`
- 用途：展示页面风格、内容结构和交互效果

### 完整版

- 本地开发：`npm run dev`
- 正式构建：`npm run build`
- 后端入口：`server/index.ts`
- 运行形态：前后端分离，前端请求真实 `/api/*`
- 数据来源：`SQLite` 数据库 + `data/uploads` 上传目录
- 用途：真实账号、会话、空间数据和图片上传持久化

## 当前 API（核心）

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `GET /api/me`
- `GET /api/admin/dashboard`（后台统计：用户数、照片存储、容量使用）
- `GET /api/account/dashboard`（当前账户空间/存储额度）
- `GET /api/spaces`
- `GET /api/spaces/:id`
- `POST /api/spaces`
- `PUT /api/spaces/:id`
- `PUT /api/spaces/:id/full`（保存完整空间快照）
- `DELETE /api/spaces/:id`
- `POST /api/uploads`（`multipart/form-data`，字段名 `file`）

## 生产部署（腾讯云轻量推荐）

推荐形态：

- Ubuntu 22.04 LTS
- Node.js 22 LTS
- Nginx 反向代理 `80/443`
- Node 服务仅监听 `127.0.0.1:3001`
- SQLite 与上传目录保存在本机磁盘

典型部署目录：

- 应用目录：`/srv/digital-journal/current`
- 共享数据目录：`/srv/digital-journal/shared/data`
- 环境变量文件：`/srv/digital-journal/shared/.env`

部署步骤：

```bash
npm install
npm run build
NODE_ENV=production npm run start
```

生产环境建议使用 `.env` 文件，例如：

```bash
PORT=3001
HOST=127.0.0.1
NODE_ENV=production
DATA_DIR=/srv/digital-journal/shared/data
LEGACY_OWNER_EMAIL=legacy@digital-journal.local
LEGACY_OWNER_PASSWORD=请改成强密码
LEGACY_OWNER_NICKNAME=Legacy Owner
STORAGE_CAPACITY_GB=20
ORPHAN_UPLOAD_TTL_HOURS=24
```

样板配置：

- Nginx: `deploy/nginx/digital-journal.conf`
- systemd: `deploy/systemd/digital-journal.service`

## 生产特性

- 缩略图由 `sharp` 生成，可直接运行在 Linux 服务器。
- 上传接口会同时校验单用户存储配额和全站磁盘容量上限。
- 覆盖保存、删除空间后，会清理不再被任何记录引用的图片文件。
- 启动时会清理超过 `ORPHAN_UPLOAD_TTL_HOURS` 的陈旧孤儿上传文件。
- 后端可直接加载 `dist/` 前端产物，便于单机部署或挂在 Nginx 后面。
