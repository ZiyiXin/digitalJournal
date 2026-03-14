# 角色数字手账（digitalJournal）

一个基于 React + TypeScript + Express + SQLite 的角色数字手账应用。  
当前版本已支持前后端持久化：空间、时间线、相册和树洞数据会写入本地数据库，刷新不丢失。
当前仓库已补齐 Linux 服务器可用的图片缩略图、上传回收、配额校验和生产构建入口，适合先以单机模式部署到腾讯云轻量应用服务器。

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

复制 `.env.example` 到 `.env.local`（或直接在系统环境里设置）:

```bash
PORT=3001
HOST=127.0.0.1
NODE_ENV=production
DATA_DIR=./data
LEGACY_OWNER_EMAIL=legacy@digital-journal.local
LEGACY_OWNER_PASSWORD=ChangeMeNow123!
LEGACY_OWNER_NICKNAME=Legacy Owner
STORAGE_CAPACITY_GB=20
ORPHAN_UPLOAD_TTL_HOURS=24
# 后台管理面板仅允许 legacy@digital-journal.local 访问
```

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

## 迭代文档

- 阶段 1（账号 + 数据隔离）改造清单：`docs/stage1-account-isolation-checklist.md`

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

样板配置：

- Nginx: `deploy/nginx/digital-journal.conf`
- systemd: `deploy/systemd/digital-journal.service`

## 生产特性

- 缩略图由 `sharp` 生成，可直接运行在 Linux 服务器。
- 上传接口会同时校验单用户存储配额和全站磁盘容量上限。
- 覆盖保存、删除空间后，会清理不再被任何记录引用的图片文件。
- 启动时会清理超过 `ORPHAN_UPLOAD_TTL_HOURS` 的陈旧孤儿上传文件。
- 后端可直接加载 `dist/` 前端产物，便于单机部署或挂在 Nginx 后面。
