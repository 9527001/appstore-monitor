# GitHub Pages 部署指南

## 快速部署步骤

### 1. 创建 GitHub 仓库

1. 在 GitHub 上创建一个新仓库（例如：`appstore-monitor`）
2. 不要初始化 README、.gitignore 或 license（我们已经有了）

### 2. 初始化 Git 并推送代码

```bash
cd appstore_monitor

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 初始提交 App Store 监控工具"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/appstore-monitor.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

### 3. 启用 GitHub Pages

#### 方法1：使用 GitHub Actions（推荐）

1. 进入仓库的 Settings
2. 点击左侧的 Pages
3. 在 Source 部分，选择 "GitHub Actions"
4. 代码推送后会自动触发部署

#### 方法2：手动选择分支

1. 进入仓库的 Settings
2. 点击左侧的 Pages
3. 在 Source 部分，选择 "Deploy from a branch"
4. 选择 `main` 分支和 `/ (root)` 目录
5. 点击 Save

### 4. 访问你的网站

部署完成后，你的网站地址将是：
```
https://yourusername.github.io/appstore-monitor/
```

## 更新部署

每次推送代码到 `main` 分支时，GitHub Actions 会自动重新部署。

```bash
# 修改代码后
git add .
git commit -m "feat: 更新功能"
git push
```

## 自定义域名（可选）

1. 在仓库的 Settings > Pages 中
2. 在 Custom domain 部分输入你的域名
3. 按照提示配置 DNS 记录

## 故障排除

### 部署失败

- 检查 GitHub Actions 工作流是否有错误
- 确保 `.github/workflows/deploy.yml` 文件存在且格式正确
- 检查仓库的 Settings > Actions > General 中是否启用了 Actions

### 页面无法访问

- 等待几分钟让部署完成
- 检查仓库的 Settings > Pages 中是否显示部署成功
- 清除浏览器缓存后重试

### CORS 错误

如果遇到跨域问题，可能需要：
- 使用代理服务器
- 或者部署到支持 CORS 的服务器

## 本地测试

在部署前，可以在本地测试：

```bash
# 使用 Python 简单服务器
python3 -m http.server 8000

# 或使用 Node.js
npx http-server

# 然后在浏览器访问 http://localhost:8000
```

