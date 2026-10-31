# 自定义改动说明（基于 PocketPal AI v1.22.0）

本分支在原版基础上新增两个能力，均复用原版现成的 function-call（talent）工具框架，
不改动 llama.cpp 原生推理，只做 JS/TS 层与设置页 UI。

## 新增能力

### 1. 内网 SearXNG 联网搜索（`searxng-local`）
- 新增 `src/services/search/providers/searxngLocal.ts`：调用用户自建、跑在局域网的
  SearXNG 实例 `${baseUrl}/search?q=...&format=json`，无需 API Key。
- `SearchProviderStore` 新增 `searxngBaseUrl`（AsyncStorage 明文保存，非密钥）、
  `setSearxngBaseUrl()`、`isNeedsBaseUrl()`、`getSearxngBaseUrl()`。
- 设置页 → Internet Search：搜索源下拉新增「SearXNG（本地/内网）」，选中后把
  原来的 Key 输入框换成「内网地址」输入框，例如 `http://192.168.1.100:8080`。
- 沿用原版的隐私同意总开关（consent）、结果条数预算与缓存。
- 未填地址时 `canSearch()` 为 false，搜索工具直接返回"未配置"提示，不会报错崩溃。

### 2. 本地文档库检索（`local_docs` 工具）
- 新增 `src/services/documents/documentStore.ts`：用 AsyncStorage 保存导入的文本文件
  （txt/md/log/json/csv），按约 800 字切片，轻量关键词打分检索（含中文 2-gram），
  单文件上限 40 万字符。
- 新增 `src/services/talents/DocumentRetrievalEngine.ts`：实现 TalentEngine，模型通过
  `local_docs(query)` 工具只取命中的若干片段喂给自己，**整篇文件不进入对话上下文**，
  从根源避免上万 token 的 prefill 爆炸。
- 设置页新增「文档库」卡片：导入文本文件、查看片段数、移除单个文档。
- 助手卡片（Pal）的工具开关区会自动出现「检索本地文档」开关，与 web_search 并列。

## 构建（GitHub Actions）
- 工作流：`.github/workflows/build-debug-apk.yml`
- 触发：push 到 main/master，或 Actions 页面手动 `Run workflow`。
- 配置：JDK17、Node22、关闭 llama.rn 源码编译（用预编译 so）、仅编 arm64-v8a、
  输出 Debug APK 到 Artifacts（免签名，可直接装手机）。
- 这是个人调试包，跳过了上游 release 的质量门（payload/hexagon/plus-gate）。

## 使用前提
- 联网搜索：需先在同一局域网跑好 SearXNG（PC 端后续部署），填入内网地址；不填则
  该功能静默不可用，不影响本地文档与纯聊天。
- 本地文档：直接在设置页文档库导入即可，离线可用。

## 改动文件清单
- 新增：`src/services/search/providers/searxngLocal.ts`
- 新增：`src/services/documents/documentStore.ts`
- 新增：`src/services/talents/DocumentRetrievalEngine.ts`
- 新增：`.github/workflows/build-debug-apk.yml`
- 修改：`src/services/search/types.ts`、`src/services/search/index.ts`、
  `src/store/SearchProviderStore.ts`、`src/services/talents/index.ts`、
  `src/screens/SettingsScreen/SettingsScreen.tsx`、`src/locales/en.json`、
  `src/locales/zh.json`、`src/services/search/__tests__/index.test.ts`
