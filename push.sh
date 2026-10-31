#!/usr/bin/env bash
# 一键推送脚本（macOS / Linux / 终端备用）
# 用法：把下面 REPO_URL 改成你的仓库地址，然后运行  bash push.sh
REPO_URL="在这里粘贴你的仓库地址.git"

set -e
[ "$REPO_URL" = "在这里粘贴你的仓库地址.git" ] && { echo "请先编辑本文件填入仓库地址"; exit 1; }

[ -d .git ] || git init -q
git config user.name "local-builder"
git config user.email "builder@local"
git add .
git commit -m "feat: local searxng search + on-device document retrieval" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main
echo "完成。"
