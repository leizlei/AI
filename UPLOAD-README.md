# 解压即推：把代码送进仓库并出 APK

这个压缩包已经替你做好了 git 初始化和首次提交准备，**不用自己敲 add/commit**。

## 你只需要做两件事

### 第 1 步：填仓库地址
1. 解压压缩包，进入 `pocketpal-ai` 文件夹。
2. 用记事本打开 `push-to-repo.bat`（Windows）。
3. 把第一行 `set "REPO_URL=在这里粘贴你的仓库地址.git"` 里的地址换成你自己的，例如：
   - GitHub：`https://github.com/leizlei/AI.git`
   - Gitee（国内更稳）：`https://gitee.com/你的用户名/仓库名.git`
4. 保存。

### 第 2 步：双击运行 `push-to-repo.bat`
- 它会自动完成：初始化 → 提交 → 绑定远程 → 推送。
- 首次 push 会弹浏览器让你登录授权，登录完就传上去了。
- 如果连 GitHub 超时/打不开，就把地址换成 Gitee 仓库地址再跑一次（脚本不用改别的）。

> 终端用户备用：`bash push.sh`（先在文件里填好 REPO_URL）。

## 推送后出 APK
- **GitHub**：仓库 → Actions → 选 `Build Debug APK` → 等变绿 → 底部 Artifacts 下载。
- **Gitee**：需要我再给你一份 Gitee Go 流水线脚本（国内网络更顺），跟我说一声即可。

## 功能
- 本地文档检索：设置页 → 文档库 → 导入 txt/md/log；在助手工具开关里打开「检索本地文档」，装完即可用。
- 内网 SearXNG 搜索：等老电脑搭好 SearXNG，在设置 → Internet Search 选「SearXNG（本地/内网）」填内网地址。

## 出错怎么办
把运行窗口里的红色报错整段复制发给我，我按报错改。网络超时最常见，换 Gitee 或重跑一次即可。
