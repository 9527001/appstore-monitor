# App Store 应用上线监控工具

一个基于 Web 的实时监控工具，用于检查应用是否在苹果 App Store 上线。

## 功能特性

- ✅ 实时监控应用上线状态
- ✅ **目标版本查询**：自动检测指定版本是否已上线
- ✅ 查询成功后自动停止监控
- ✅ 支持 Webhook 通知（可选）
- ✅ 自定义应用ID和国家/地区
- ✅ 可设置开始时间和请求频率
- ✅ 自动保存查询记录到本地存储
- ✅ 美观的现代化界面
- ✅ 响应式设计，支持移动端

## 使用方法

### 快速开始

**⚠️ 重要：必须通过 HTTP 服务器运行，不能直接打开 HTML 文件！**

1. **启动本地服务器**（选择一种方式）：
   ```bash
   # 方式1：使用 Python（推荐）
   python3 -m http.server 8000
   
   # 方式2：使用 Node.js
   npx http-server
   
   # 方式3：使用项目提供的脚本
   chmod +x start.sh
   ./start.sh
   ```

2. **在浏览器中访问**：`http://localhost:8000`

3. **输入应用ID**：在 App Store 链接中找到应用ID
3. **输入目标版本号**：输入要查询的版本号（例如：`4.9.1`）
4. 选择国家/地区
5. 设置请求频率（秒，建议 60 秒以上）
6. （可选）配置 Webhook URL，用于接收通知
7. 点击"开始监控"按钮

### 目标版本查询

系统会自动比较当前版本和目标版本：
- 如果当前版本 **≥ 目标版本**，说明目标版本已上线 ✅
- 如果当前版本 **< 目标版本**，说明目标版本未上线 ❌
- **查询成功后，系统会自动停止监控**

## 应用ID获取方法

在 App Store 链接中找到应用ID：

```
https://apps.apple.com/cn/app/wechat/id414478124
                                    ^^^^^^^^^^^^
                                    这就是应用ID
```

## 部署到 GitHub Pages

### 方法1：手动部署

1. 将项目推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 `main` 分支的 `/root` 目录
4. 访问 `https://yourusername.github.io/repository-name/`

### 方法2：使用 GitHub Actions 自动部署

项目已包含 `.github/workflows/deploy.yml` 工作流，推送代码后会自动部署。

## 技术栈

- 纯 HTML/CSS/JavaScript
- 使用 iTunes Search API
- LocalStorage 本地存储
- 响应式设计

## 浏览器支持

- Chrome/Edge (推荐)
- Firefox
- Safari
- 移动端浏览器

## Webhook 通知

配置 Webhook URL 后，当目标版本查询成功时，系统会自动发送 POST 请求到指定地址。

**请求格式：**
```json
{
  "event": "version_online",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "targetVersion": "4.9.1",
  "currentVersion": "4.9.1",
  "appId": "1514564893",
  "country": "cn",
  "appInfo": {
    "trackName": "应用名称",
    "version": "4.9.1",
    "trackViewUrl": "https://apps.apple.com/..."
  },
  "message": "目标版本 4.9.1 已上线！当前版本：4.9.1"
}
```

## 注意事项

1. ⚠️ 请求频率建议设置在 60 秒以上，避免过于频繁的请求
2. ⚠️ 查询记录保存在浏览器本地存储中，清除浏览器数据会丢失记录
3. ⚠️ 某些应用可能只在特定地区上线，可以尝试切换国家/地区
4. ⚠️ Webhook URL 和配置信息会保存在本地，不会上传到服务器

## 许可证

MIT License

