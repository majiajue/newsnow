#!/bin/bash

# Git Hooks 切换脚本

HOOKS_FILE=".git/hooks/pre-commit"
BACKUP_FILE=".git/hooks/pre-commit.backup"

if [ -f "$HOOKS_FILE" ] && [ ! -f "$BACKUP_FILE" ]; then
    # 禁用 hooks
    echo "🚫 禁用 Git Hooks..."
    mv "$HOOKS_FILE" "$BACKUP_FILE"
    echo "✅ Git Hooks 已禁用"
    echo "💡 现在可以直接提交，不会运行验证"
    echo "💡 使用 './toggle-git-hooks.sh' 重新启用"
elif [ -f "$BACKUP_FILE" ]; then
    # 启用 hooks
    echo "✅ 启用 Git Hooks..."
    mv "$BACKUP_FILE" "$HOOKS_FILE"
    chmod +x "$HOOKS_FILE"
    echo "✅ Git Hooks 已启用"
    echo "💡 提交时会运行 ESLint 验证"
else
    echo "❌ 未找到 Git Hooks 文件"
fi

echo ""
echo "📋 其他跳过验证的方法："
echo "   1. 使用环境变量: SKIP_SIMPLE_GIT_HOOKS=1 git commit -m '消息'"
echo "   2. 使用参数: git commit --no-verify -m '消息'"
echo "   3. 使用此脚本: ./toggle-git-hooks.sh" 