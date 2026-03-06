# 阶段 1 改造清单：账号系统 + 数据强隔离（仅私有可见）

> 适用项目：`React + Express + SQLite`（当前仓库）  
> 当前目标：只实装账号、登录态、空间数据隔离；所有账本内容仅账号本人可见。  
> 暂不实装：好友、公开空间、精细分享。  
> 预留扩展口：`visibility` 字段与统一授权函数。

---

## 1. 范围与完成标准（DoD）

- [x] 支持注册、登录、登出、获取当前用户（`/api/me`）。
- [x] 所有空间/相册/树洞/上传都必须登录后访问。
- [x] 用户 A 无法读取或修改用户 B 的任何空间数据（包含通过直接猜 `spaceId`）。
- [x] 所有查询和写入都带 `owner_id` 条件。
- [x] 数据库迁移后，历史数据已归属到某个明确用户，不存在 `owner_id` 空值。
- [x] 预留 `visibility` 字段（当前仅允许 `private`）。

---

## 2. 实施顺序（建议按提交拆分）

1. `feat(db): users + sessions + owner_id + visibility`
2. `feat(auth): register/login/logout/me + session cookie`
3. `refactor(repo): all space operations scoped by owner_id`
4. `feat(api): protect routes with requireAuth + upload isolation`
5. `feat(web): auth bootstrap + login/register screen`
6. `test: add manual verification script/checklist`

---

## 3. 数据库改造（`server/db.ts`）

### 3.1 新增表

- [x] 新建 `users`。
- [x] 新建 `user_sessions`（服务端 session）。

建议字段：

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_image TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3.2 现有业务表补充归属字段

- [x] `spaces` 增加 `owner_id`、`visibility`。
- [x] `timeline_entries` 增加 `owner_id`。
- [x] `timeline_images` 增加 `owner_id`（便于直接过滤/清理）。
- [x] `treehole_entries` 增加 `owner_id`。

建议字段定义：

```sql
-- 全部默认 private，仅作为后续分享扩展口
ALTER TABLE spaces ADD COLUMN owner_id TEXT;
ALTER TABLE spaces ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';

ALTER TABLE timeline_entries ADD COLUMN owner_id TEXT;
ALTER TABLE timeline_images ADD COLUMN owner_id TEXT;
ALTER TABLE treehole_entries ADD COLUMN owner_id TEXT;
```

### 3.3 回填迁移策略（必须落地）

- [x] 若历史无用户数据：创建一个 `legacy` 用户并记录 `legacyUserId`。
- [x] 将历史 `spaces` 及其子表全部回填为 `legacyUserId`。
- [x] 完成回填后添加索引。

建议索引：

```sql
CREATE INDEX IF NOT EXISTS idx_spaces_owner_created
  ON spaces(owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_entries_owner_space
  ON timeline_entries(owner_id, space_id);
CREATE INDEX IF NOT EXISTS idx_timeline_images_owner_entry
  ON timeline_images(owner_id, entry_id);
CREATE INDEX IF NOT EXISTS idx_treehole_entries_owner_space
  ON treehole_entries(owner_id, space_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_exp
  ON user_sessions(user_id, expires_at);
```

### 3.4 初始化样例数据调整

- [x] 关闭“无账号时自动插入演示空间”逻辑，避免共享公共数据。
- [ ] 可改为：用户首次注册时为该用户创建一个默认空间（可选）。

---

## 4. 认证与会话（新增 `server/auth/*`）

### 4.1 新增模块建议

- [x] `server/auth/password.ts`  
  - `hashPassword(plain)`  
  - `verifyPassword(plain, hash)`
- [x] `server/auth/session.ts`  
  - `createSession(userId, reqMeta)`  
  - `validateSession(rawToken)`  
  - `revokeSession(rawToken)`
- [x] `server/auth/middleware.ts`  
  - `requireAuth`：解析 cookie，挂载 `req.user`。
- [x] `server/auth/constants.ts`  
  - `SESSION_COOKIE_NAME = 'dj_sid'`  
  - `SESSION_TTL_DAYS = 30`

### 4.2 依赖

- [ ] 安装：`argon2`、`cookie-parser`。  
  - 现状：使用 Node 内建 `scrypt` 与手写 cookie 解析，安全可用但与原建议不一致。
- [ ] 类型：`@types/cookie-parser`。

### 4.3 登录态策略（阶段 1 推荐）

- [x] 使用 HttpOnly Cookie 存 session token（不落 localStorage）。
- [x] token 仅保存明文于 cookie，DB 中存 `sha256(token)`。
- [x] cookie 配置：
  - `httpOnly: true`
  - `sameSite: 'lax'`
  - `secure: process.env.NODE_ENV === 'production'`
  - `maxAge: 30d`

---

## 5. 仓储层改造（`server/repository.ts`）

> 核心原则：每个函数必须接收 `ownerId` 并在 SQL 中强制过滤。

### 5.1 函数签名改造

- [x] `listSpaces(ownerId: string): Space[]`
- [x] `getSpaceById(spaceId: string, ownerId: string): Space | null`
- [x] `createSpace(ownerId: string, input: CreateSpaceInput): Space`
- [x] `updateSpaceMeta(spaceId: string, ownerId: string, input: ...): Space | null`
- [x] `saveSpaceSnapshot(space: Space, ownerId: string): Space`
- [x] `deleteSpace(spaceId: string, ownerId: string): boolean`

### 5.2 SQL 改造点

- [x] `spaces` 查询必须 `WHERE id = ? AND owner_id = ?`。
- [x] `timeline_entries/treehole_entries/timeline_images` 的写入都要带 `owner_id`。
- [x] 删除时必须 `DELETE ... WHERE id = ? AND owner_id = ?`。
- [x] `saveSpaceSnapshot` upsert 时带上 `owner_id`，并拒绝跨用户覆盖。

### 5.3 防越权约束

- [x] 任意 `spaceId` 在进入子表写入前，先校验该 `spaceId` 属于当前 `ownerId`。
- [x] 对不存在和无权限统一返回“不可见”（建议 404），避免探测资源存在性。

---

## 6. API 层改造（`server/index.ts`）

### 6.1 新增认证接口

- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login`
- [x] `POST /api/auth/logout`
- [x] `GET /api/me`

建议响应最小字段：

```json
{
  "id": "user_id",
  "email": "a@b.com",
  "nickname": "昵称"
}
```

### 6.2 现有业务接口加鉴权

- [x] 在 `/api/spaces*` 和 `/api/uploads` 全部加 `requireAuth`。
- [x] 路由中把 `req.user.id` 传给 repository。

### 6.3 上传隔离

- [x] 上传目录改为：`data/uploads/<userId>/...`。
- [x] 返回 URL：`/uploads/<userId>/<filename>`。
- [x] 静态资源访问策略（二选一）：
  - 阶段 1 快速版：仍走静态目录，但路径含 `userId`（最小隔离）。
  - 阶段 1 强安全版：改为受保护下载路由，校验当前用户后再读文件（当前采用此方案）。

---

## 7. 类型与前端 API 改造（`src/types.ts` + `src/lib/api.ts`）

### 7.1 类型扩展

- [x] 新增 `User` 类型（`id/email/nickname/avatarImage?`）。
- [x] `Space` 可选预留：`visibility?: 'private' | 'public' | 'friends' | 'custom'`。  
  - 当前校验只允许 `'private'`，其余值拒绝。

### 7.2 API 方法补充

- [x] `register(payload)`  
- [x] `login(payload)`  
- [x] `logout()`  
- [x] `fetchMe()`  
- [x] `requestJson` 增加 `credentials: 'include'`，确保 cookie 生效。

### 7.3 错误处理

- [x] 统一识别 `401`：清理前端用户态并跳转登录界面。

---

## 8. 前端入口改造（`src/App.tsx`）

### 8.1 启动流程

- [x] `bootstrap` 时先 `fetchMe()`，再 `fetchSpaces()`。
- [x] 若 `401`：显示登录/注册界面，不进入空间页。

### 8.2 账号态管理

- [x] 新增 `currentUser` state。
- [x] 提供登录、注册、登出操作（最小表单即可）。
- [x] 登出后清空本地空间状态并回到登录页。

### 8.3 现有空间逻辑兼容

- [x] `handleCreateSpace/handleRenameSpace/handleDeleteSpace/saveSpaceSnapshot` 不改业务行为，只依赖已鉴权 API。

---

## 9. “留口”设计（暂不实装分享）

- [x] `spaces.visibility` 字段先入库，默认 `private`。
- [x] 新增授权函数骨架：`canViewSpace(currentUserId, ownerId, visibility)`。  
  - 阶段 1 仅返回 `currentUserId === ownerId`。
- [x] 所有读取接口统一经过授权函数，后续扩展 public/friends 时不改路由结构。

---

## 10. 验收用例（必须逐条跑）

推荐直接执行自动验收脚本：`npm run verify:stage1`（脚本：`scripts/verify-stage1-auth-isolation.sh`）。

### 10.1 功能用例

- [x] 用户 A 注册并创建空间 `S1`。
- [x] 用户 B 注册并创建空间 `S2`。
- [x] A 访问 `/api/spaces/:S2` => 404/403。
- [x] B 访问 `/api/spaces/:S1` => 404/403。
- [x] A 尝试 `PUT /api/spaces/:S2/full` => 404/403。
- [x] 未登录调用任意 `/api/spaces` => 401。

### 10.2 数据用例

- [x] `spaces/timeline_entries/timeline_images/treehole_entries` 均有正确 `owner_id`。
- [x] `SELECT COUNT(*) FROM spaces WHERE owner_id IS NULL OR owner_id = ''` = 0。

### 10.3 上传用例

- [x] A 上传图片，B 不能通过同路径直接用于自己的私有数据（至少路径无法枚举到）。

---

## 11. 建议的最小接口契约（阶段 1）

### 11.1 注册

- `POST /api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "Passw0rd!",
  "nickname": "UserA"
}
```

返回 `201` + 用户信息，并写入 session cookie。

### 11.2 登录

- `POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "Passw0rd!"
}
```

返回 `200` + 用户信息，并写入 session cookie。

### 11.3 当前用户

- `GET /api/me`：登录返回用户，未登录返回 `401`。

### 11.4 登出

- `POST /api/auth/logout`：服务端删除 session，清除 cookie，返回 `204`。

---

## 12. 风险提示（阶段 1 容易踩坑）

- [ ] 只在路由层鉴权但 repository 没加 `owner_id` 条件，会被绕过。
- [ ] 上传目录若不分用户，很容易出现跨账号资源引用。
- [ ] 前端若把 token 存 localStorage，XSS 风险更高；优先 HttpOnly cookie。
- [ ] SQLite `ALTER TABLE` 能力有限，迁移脚本要先加列再回填，避免一次性强约束失败。

---

## 13. 可直接开始改造的文件清单

- [ ] 修改：`server/db.ts`
- [ ] 修改：`server/index.ts`
- [ ] 修改：`server/repository.ts`
- [ ] 修改：`server/types.ts`
- [ ] 新增：`server/auth/password.ts`
- [ ] 新增：`server/auth/session.ts`
- [ ] 新增：`server/auth/middleware.ts`
- [ ] 修改：`src/lib/api.ts`
- [ ] 修改：`src/types.ts`
- [ ] 修改：`src/App.tsx`
