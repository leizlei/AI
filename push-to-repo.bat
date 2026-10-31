@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ============================================================
REM  一键推送脚本（Windows）
REM  用法：把下面 REPO_URL 改成你自己的仓库地址，然后双击本文件。
REM  示例(GitHub): https://github.com/leizlei/AI.git
REM  示例(Gitee) : https://gitee.com/你的用户名/仓库名.git
REM ============================================================

set "REPO_URL=在这里粘贴你的仓库地址.git"

if "%REPO_URL%"=="在这里粘贴你的仓库地址.git" (
  echo [错误] 请先用记事本打开本文件，把 REPO_URL 改成你的仓库地址再运行。
  pause
  exit /b 1
)

echo [1/5] 初始化 git（如已初始化会自动跳过）
if not exist ".git" git init -q

echo [2/5] 配置本地提交身份（仅本机，不影响账号）
git config user.name "local-builder"
git config user.email "builder@local"

echo [3/5] 暂存并提交全部文件
git add .
git commit -m "feat: local searxng search + on-device document retrieval" || echo (没有新文件，继续)

echo [4/5] 切换到 main 分支并绑定远程仓库
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [5/5] 推送（首次会弹出浏览器让你登录授权）
git push -u origin main

echo.
echo 完成。如果上面显示错误，把红色报错整段复制发给我。
pause
