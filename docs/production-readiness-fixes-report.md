# 生产上线阻塞项修复报告

分支：`codex/prod-readiness-fixes`

日期：`2026-03-12`

## 本次修复

### 1. Linux 可用的图片缩略图

- 将 `sips` 替换为 `sharp`，避免部署到腾讯云 Ubuntu 后上传失败。
- 上传失败时继续保留原有清理逻辑，避免磁盘残留半成品文件。

涉及文件：

- `server/index.ts`
- `package.json`

### 2. 空间数量配额绕过

- `PUT /api/spaces/:id/full` 在保存前新增目标判定：
  - 已有且归当前用户：允许更新
  - 不存在：按“创建新空间”走空间数量配额检查
  - 属于其他用户：统一返回 404

涉及文件：

- `server/index.ts`
- `server/repository.ts`

### 3. 图片文件回收

- 新增上传存储模块，统一处理上传 URL 解析、引用判断和孤儿文件清理。
- 在以下场景下清理不再被任何数据库记录引用的图片：
  - 更新空间元信息
  - 覆盖保存完整空间快照
  - 删除空间
- 启动时增加陈旧孤儿上传清理，处理“上传后未保存”的历史残留文件。

涉及文件：

- `server/upload-storage.ts`
- `server/repository.ts`
- `server/index.ts`

### 4. 总容量限制

- 原先 `STORAGE_CAPACITY_GB` 只用于后台统计。
- 现在上传时会同时检查：
  - 当前用户存储配额
  - 全站总磁盘容量上限

涉及文件：

- `server/admin-dashboard.ts`
- `server/index.ts`

### 5. 生产构建与启动

- `npm run build` 继续只构建前端产物 `dist/`。
- `npm run start` / `npm run start:server` 改为通过正式依赖里的 `tsx` 启动服务端，不再依赖 `devDependencies`。
- 增加 Nginx 与 systemd 样板配置。

涉及文件：

- `package.json`
- `deploy/nginx/digital-journal.conf`
- `deploy/systemd/digital-journal.service`

### 6. 数据目录可配置

- 数据库与上传目录不再强依赖 `process.cwd()/data`。
- 现在支持通过 `DATA_DIR` 指向共享目录，便于服务器发布目录切换。

涉及文件：

- `server/db.ts`
- `.env.example`
- `README.md`
- `deploy/systemd/digital-journal.service`

### 7. 旧数据缩略图迁移

- 历史上传路径迁移时，补上以下字段：
  - `avatar_thumbnail_image`
  - `hero_thumbnail_image`
  - `timeline_images.thumbnail_url`

涉及文件：

- `server/db.ts`

### 8. 验收脚本修复

- 阶段 1 脚本改为上传真实 PNG，而不是 `text/plain`。
- 脚本启动开发态服务端，不再依赖生产构建产物已存在。

涉及文件：

- `scripts/verify-stage1-auth-isolation.sh`

### 9. 管理员能力前后端对齐

- 后端 `/api/auth/register`、`/api/auth/login`、`/api/me` 现在返回 `canAccessAdminDashboard`。
- 前端菜单不再写死管理员邮箱，改为使用后端下发的权限位。

涉及文件：

- `server/index.ts`
- `server/types.ts`
- `src/types.ts`
- `src/App.tsx`

## 部署建议

- 腾讯云轻量应用服务器建议使用 `Ubuntu 22.04 LTS`
- 推荐 `2 vCPU / 4 GB / 60 GB SSD`
- Nginx 对外开放 `80/443`
- Node 仅监听内网 `127.0.0.1:3001`
- 环境变量文件建议放在 `/srv/digital-journal/shared/.env`
- `HOST` 建议固定为 `127.0.0.1`
- `DATA_DIR` 建议指向 `/srv/digital-journal/shared/data`

## 当前未完成的验证

- 已完成本地命令验证：
  - `npm run lint`
  - `npm run build`
  - `npm run verify:stage1`
- `npm audit` 在 Codex 沙箱里无法连通 npm registry，需要在你的本机或服务器上执行。
