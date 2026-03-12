# 角色数字手账（digitalJournal）

一个基于 React + TypeScript + Express + SQLite 的角色数字手账应用。  
当前版本已支持前后端持久化：空间、时间线、相册和树洞数据会写入本地数据库，刷新不丢失。

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
LEGACY_OWNER_EMAIL=legacy@digital-journal.local
LEGACY_OWNER_PASSWORD=ChangeMeNow123!
LEGACY_OWNER_NICKNAME=Legacy Owner
STORAGE_CAPACITY_GB=20
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
npm run start:server # 后端（非 watch）
npm run verify:stage1 # 阶段1账号隔离验收
npm run lint         # TypeScript 类型检查
npm run build        # 构建前端产物
```

## 数据与上传目录

- SQLite 数据库: `data/digital-journal.db`
- 上传文件目录: `data/uploads`

以上目录已加入 `.gitignore`。

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
- `GET /api/spaces`
- `GET /api/spaces/:id`
- `POST /api/spaces`
- `PUT /api/spaces/:id`
- `PUT /api/spaces/:id/full`（保存完整空间快照）
- `DELETE /api/spaces/:id`
- `POST /api/uploads`（`multipart/form-data`，字段名 `file`）
