# App Store 应用上线监控工具

一个基于 Web 的实时监控工具，用于检查应用是否在苹果 App Store 上线。

## 功能特性

- ✅ 实时监控应用上线状态
- ✅ 自定义应用ID和国家/地区
- ✅ 可设置开始时间和请求频率
- ✅ 自动保存查询记录到本地存储
- ✅ 美观的现代化界面
- ✅ 响应式设计，支持移动端

## 使用方法

1. 打开 `index.html` 文件（可以直接在浏览器中打开）
2. 输入应用ID（App Store 中的应用ID）
3. 选择国家/地区
4. 设置开始时间（可选）
5. 设置请求频率（秒）
6. 点击"开始监控"按钮

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

## 注意事项

1. 请求频率建议设置在 60 秒以上，避免过于频繁的请求
2. 查询记录保存在浏览器本地存储中，清除浏览器数据会丢失记录
3. 某些应用可能只在特定地区上线，可以尝试切换国家/地区

## 许可证

MIT License

