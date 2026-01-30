#!/bin/bash

# 获取脚本所在目录
cd "$(dirname "$0")"

echo "==================================="
echo "  JSONL 工具箱 - 本地服务器"
echo "==================================="
echo ""
echo "服务器正在启动..."
echo "地址: http://localhost:8000"
echo ""
echo "按 Ctrl+C 可停止服务器"
echo "关闭此窗口也会停止服务器"
echo ""
echo "==================================="
echo ""

# 启动 Python HTTP 服务器
# 自动打开浏览器
sleep 1 && open http://localhost:8000 &

python3 -m http.server 8000
