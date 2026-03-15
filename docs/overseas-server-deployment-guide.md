# digitalJournal 海外服务器部署手册

这份文档按“从 0 到可访问”的顺序写，适合第一次自己部署。

适用项目：

- 前端：React + Vite
- 后端：Express
- 数据库：SQLite
- 部署方式：单机部署，Nginx 反向代理，systemd 托管 Node 进程

推荐服务器：

- 地域：`中国香港`
- 系统：`Ubuntu 22.04 LTS`
- 套餐：`2 核 2G / 50GB SSD / 30Mbps / 1TB 月流量`

为什么这样选：

- 这个项目是单机应用，前期用户少时不需要更高配置。
- 海外节点一般不需要中国内地备案，适合先测试和小范围上线。
- 中国香港对中国内地访问延迟通常更友好。

## 1. 准备清单

开始前你需要准备这些东西：

- 一台海外 Linux 服务器
- 一个域名
- 本机能执行 `ssh`、`scp`
- 这个项目的完整代码

建议你在服务器厂商控制台完成下面几件事：

1. 购买服务器，系统选 `Ubuntu 22.04 LTS`
2. 记录服务器公网 IP
3. 在防火墙或安全组里放行端口：
   - `22`：SSH 登录
   - `80`：HTTP
   - `443`：HTTPS

## 2. 域名解析

这个项目生产环境登录依赖安全 Cookie。代码里 `NODE_ENV=production` 时会把登录 Cookie 设为 `secure`，所以最终必须走 `HTTPS`。

先去你的域名服务商后台添加解析：

- 记录类型：`A`
- 主机记录：`@`
- 记录值：你的服务器公网 IP

如果你想用二级域名，也可以加一条：

- 记录类型：`A`
- 主机记录：`www`
- 记录值：你的服务器公网 IP

等解析生效后，先记住你的正式域名，比如：

```text
journal.example.com
```

后面配置 Nginx 和 HTTPS 都会用到它。

## 3. 第一次连接服务器

在你自己的电脑上执行：

```bash
ssh root@你的服务器IP
```

第一次连接会提示确认指纹，输入 `yes`。

登录后，先更新系统：

```bash
apt update
apt upgrade -y
```

## 4. 安装系统依赖

安装项目运行所需的软件：

```bash
apt install -y curl git nginx certbot python3-certbot-nginx build-essential
```

安装 Node.js 22：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

检查版本：

```bash
node -v
npm -v
nginx -v
```

`node -v` 看到 `v22.x.x` 就可以。

## 5. 创建项目目录

在服务器上创建标准目录：

```bash
mkdir -p /srv/digital-journal/current
mkdir -p /srv/digital-journal/shared/data
mkdir -p /srv/digital-journal/shared/backups
mkdir -p /srv/digital-journal/shared/releases
chown -R www-data:www-data /srv/digital-journal/shared
```

目录说明：

- `/srv/digital-journal/current`：当前运行中的代码
- `/srv/digital-journal/shared/data`：SQLite 数据库和上传文件
- `/srv/digital-journal/shared/backups`：数据库和图片备份
- `/srv/digital-journal/shared/releases`：你手动留存的发布包

## 6. 上传项目代码

最推荐的方式是从 Git 仓库拉代码。如果你现在还没有远程仓库，就先用 `scp` 上传。

### 方式 A：用 Git 仓库拉代码

在服务器上执行：

```bash
git clone 你的仓库地址 /srv/digital-journal/current
```

例如：

```bash
git clone git@github.com:yourname/digitalJournal.git /srv/digital-journal/current
```

### 方式 B：从本机上传代码

在你自己的电脑上执行：

```bash
scp -r /Users/ziyixin/Desktop/CODEX/digitalJournal root@你的服务器IP:/srv/digital-journal/current
```

如果目标目录已经存在，建议先清空再传，避免残留旧文件。

上传完成后，回到服务器执行：

```bash
cd /srv/digital-journal/current
ls
```

你应该能看到 `package.json`、`server`、`src`、`deploy` 这些目录和文件。

## 7. 配置环境变量

这个项目仓库里已经有环境变量样板文件 [/.env.example](/Users/ziyixin/Desktop/CODEX/digitalJournal/.env.example)。

在服务器上创建真正的生产环境文件：

```bash
cat >/srv/digital-journal/shared/.env <<'EOF'
PORT=3001
HOST=127.0.0.1
NODE_ENV=production
DATA_DIR=/srv/digital-journal/shared/data
LEGACY_OWNER_EMAIL=legacy@your-domain.com
LEGACY_OWNER_PASSWORD=请换成一个很长的高强度密码
LEGACY_OWNER_NICKNAME=Admin
STORAGE_CAPACITY_GB=20
ORPHAN_UPLOAD_TTL_HOURS=24
EOF
```

你至少需要改这两项：

- `LEGACY_OWNER_EMAIL`
- `LEGACY_OWNER_PASSWORD`

说明：

- `PORT=3001`：Node 服务监听本机 3001
- `HOST=127.0.0.1`：只允许 Nginx 从本机转发访问
- `DATA_DIR=/srv/digital-journal/shared/data`：数据库和上传文件不跟代码混在一起

## 8. 安装依赖并构建项目

在服务器上执行：

```bash
cd /srv/digital-journal/current
npm install
npm run build
```

如果没有报错，说明前端产物已经生成到 `dist/`。

这个项目生产模式下由 Node 直接加载 `dist/` 前端产物，同时处理 `/api` 和 `/uploads` 请求。

## 9. 配置 systemd 开机自启

仓库里已经带了 systemd 样板文件 [deploy/systemd/digital-journal.service](/Users/ziyixin/Desktop/CODEX/digitalJournal/deploy/systemd/digital-journal.service)。

在服务器上创建正式服务文件：

```bash
cat >/etc/systemd/system/digital-journal.service <<'EOF'
[Unit]
Description=Digital Journal API
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/digital-journal/current
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=DATA_DIR=/srv/digital-journal/shared/data
EnvironmentFile=/srv/digital-journal/shared/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
```

让 `www-data` 能访问代码目录：

```bash
chown -R www-data:www-data /srv/digital-journal/current
```

启动并设置开机自启：

```bash
systemctl daemon-reload
systemctl enable digital-journal
systemctl start digital-journal
```

查看状态：

```bash
systemctl status digital-journal
```

如果启动失败，直接看日志：

```bash
journalctl -u digital-journal -n 100 --no-pager
```

## 10. 先验证 Node 服务是否正常

服务启动后，在服务器上执行：

```bash
curl http://127.0.0.1:3001/api/health
```

如果正常，你会看到类似：

```json
{"ok":true,"timestamp":"2026-03-15T00:00:00.000Z"}
```

这一步通过，说明后端和 SQLite 已经能正常工作。

## 11. 配置 Nginx 反向代理

仓库里已经有 Nginx 样板 [deploy/nginx/digital-journal.conf](/Users/ziyixin/Desktop/CODEX/digitalJournal/deploy/nginx/digital-journal.conf)，但证书路径需要改成你自己的域名。

先写一份仅 HTTP 的配置，用来申请证书：

```bash
cat >/etc/nginx/sites-available/digital-journal <<'EOF'
server {
  listen 80;
  server_name journal.example.com;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF
```

把 `journal.example.com` 改成你的真实域名。

启用站点：

```bash
ln -sf /etc/nginx/sites-available/digital-journal /etc/nginx/sites-enabled/digital-journal
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

现在浏览器访问：

```text
http://你的域名/api/health
```

如果能返回 JSON，说明 Nginx 转发已经通了。

## 12. 申请 HTTPS 证书

执行：

```bash
certbot --nginx -d 你的域名
```

如果你同时配置了 `www`，可以这样：

```bash
certbot --nginx -d 你的域名 -d www.你的域名
```

按提示完成后，Certbot 会自动修改 Nginx 配置并安装证书。

然后测试自动续期：

```bash
certbot renew --dry-run
```

## 13. 把 Nginx 配置改成正式版

申请好证书后，把配置调整成下面这种更明确的结构：

```bash
cat >/etc/nginx/sites-available/digital-journal <<'EOF'
server {
  listen 80;
  server_name journal.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name journal.example.com;

  ssl_certificate /etc/letsencrypt/live/journal.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/journal.example.com/privkey.pem;

  root /srv/digital-journal/current/dist;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
EOF
```

再次把 `journal.example.com` 改成你的真实域名，然后执行：

```bash
nginx -t
systemctl reload nginx
```

## 14. 正式验证上线

现在依次检查这几个地址：

1. `https://你的域名/api/health`
2. `https://你的域名`
3. 注册一个新账号
4. 登录
5. 新建一个空间
6. 上传一张图片
7. 刷新页面确认数据还在

如果第 1 步通了但登录失败，优先检查：

- 你是不是已经启用了 HTTPS
- 浏览器访问的是否是 `https://`
- Nginx 是否把请求转发到了 `127.0.0.1:3001`

## 15. 常用运维命令

### 查看服务状态

```bash
systemctl status digital-journal
```

### 查看应用日志

```bash
journalctl -u digital-journal -f
```

### 重启应用

```bash
systemctl restart digital-journal
```

### 重载 Nginx

```bash
systemctl reload nginx
```

### 查看 80 和 443 是否监听

```bash
ss -lntp | grep -E ':80|:443|:3001'
```

## 16. 更新项目的标准流程

以后你每次发新版本，按这个顺序来：

```bash
cd /srv/digital-journal/current
git pull
npm install
npm run build
systemctl restart digital-journal
```

如果你不是用 Git，而是本机上传代码，流程改成：

1. 在本机重新上传代码到服务器
2. 进入 `/srv/digital-journal/current`
3. 执行 `npm install`
4. 执行 `npm run build`
5. 执行 `systemctl restart digital-journal`

更新后建议立即检查：

```bash
curl https://你的域名/api/health
```

## 17. SQLite 备份

这个项目当前使用 SQLite，数据库文件默认在：

```text
/srv/digital-journal/shared/data/digital-journal.db
```

上传文件目录在：

```text
/srv/digital-journal/shared/data/uploads
```

所以备份至少要包含两部分：

- `digital-journal.db`
- `uploads/`

手动备份命令：

```bash
ts=$(date +%F-%H%M%S)
mkdir -p /srv/digital-journal/shared/backups/$ts
cp /srv/digital-journal/shared/data/digital-journal.db /srv/digital-journal/shared/backups/$ts/
cp -r /srv/digital-journal/shared/data/uploads /srv/digital-journal/shared/backups/$ts/
```

更稳妥的方式是先停服务再备份：

```bash
systemctl stop digital-journal
ts=$(date +%F-%H%M%S)
mkdir -p /srv/digital-journal/shared/backups/$ts
cp /srv/digital-journal/shared/data/digital-journal.db /srv/digital-journal/shared/backups/$ts/
cp -r /srv/digital-journal/shared/data/uploads /srv/digital-journal/shared/backups/$ts/
systemctl start digital-journal
```

## 18. 你最容易踩的坑

### 1. 只开了 22 端口，没开 80/443

表现：

- 域名打不开
- Certbot 申请证书失败

### 2. 域名没解析到服务器公网 IP

表现：

- `certbot --nginx` 失败
- 浏览器打不开

### 3. 没有 HTTPS 就直接用生产模式测试登录

表现：

- 注册接口似乎正常
- 登录态存不住
- 刷新后又掉登录

原因：

- 生产环境 Cookie 是 `secure`

### 4. 数据目录和代码目录混在一起

表现：

- 更新代码时容易误删数据库和上传文件

正确做法：

- 代码放 `/srv/digital-journal/current`
- 数据放 `/srv/digital-journal/shared/data`

### 5. `www-data` 没权限访问项目目录

表现：

- systemd 服务起不来
- 日志里有权限错误

## 19. 推荐你的实际落地顺序

如果你想尽量少出错，就按这个顺序做：

1. 买中国香港 Ubuntu 22.04 服务器
2. 放行 22/80/443
3. 域名解析到服务器 IP
4. SSH 登录服务器
5. 安装 Node、Nginx、Certbot
6. 上传项目代码
7. 写 `/srv/digital-journal/shared/.env`
8. `npm install && npm run build`
9. 配置 `systemd`
10. `curl http://127.0.0.1:3001/api/health`
11. 配置 Nginx
12. 申请 HTTPS
13. 浏览器正式测试注册、登录、上传图片

## 20. 仓库内相关文件

你后面排查问题时，重点看这些文件：

- [README.md](/Users/ziyixin/Desktop/CODEX/digitalJournal/README.md)
- [/.env.example](/Users/ziyixin/Desktop/CODEX/digitalJournal/.env.example)
- [deploy/nginx/digital-journal.conf](/Users/ziyixin/Desktop/CODEX/digitalJournal/deploy/nginx/digital-journal.conf)
- [deploy/systemd/digital-journal.service](/Users/ziyixin/Desktop/CODEX/digitalJournal/deploy/systemd/digital-journal.service)
- [server/index.ts](/Users/ziyixin/Desktop/CODEX/digitalJournal/server/index.ts)
- [server/db.ts](/Users/ziyixin/Desktop/CODEX/digitalJournal/server/db.ts)

如果你愿意，下一步我可以继续帮你补一份“上线后怎么更新版本、怎么备份、怎么迁移到国内服务器”的文档，或者直接把 README 里的生产部署章节也替换成这份更完整的版本。
