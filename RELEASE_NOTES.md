# V2.0.0 五层全域资讯中心版

## 升级摘要
从 V1.2.0 主流平台互动观察版重磅升级为每日自动巡检的全域资讯系统。

## 修改文件
- `index.html`：新增丽君全域资讯中心、今日丽君日报、五层信息源状态、诊断与搜索。
- `app.js`：新增四级回退、五层分类、日报摘要、来源统计、收藏与诊断。
- `styles.css`：新增资讯编辑台、健康状态卡、移动端适配并延续青黛视觉。
- `sw.js`：缓存升级至 V2.0.0。
- `manifest.webmanifest`：更新应用名称、描述和主题色。
- `README.md`：重写部署与维护说明。
- `data/dynamics.json`、`data/social.json`：保留并沿用陈丽君专属资料。

## 新增文件
- `data/daily.json`
- `data/source-registry.json`
- `functions/api/news.js`
- `scripts/update-news.mjs`
- `.github/workflows/daily-news.yml`

## 删除文件
无。

## 上传要求
必须全量替换，不能只替换首页。

## 测试
已执行 JavaScript 语法、JSON 格式、ZIP 完整性和关键文件存在性检查。
