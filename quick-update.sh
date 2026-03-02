#!/bin/bash
# 智慧养老系统 - 快速更新脚本
# 用途：一键更新部署到CentOS 7服务器
# 使用方法：./quick-update.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/opt/zzyl"
BACKUP_DIR="/opt/zzyl/backups"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示分隔线
show_separator() {
    echo "=========================================="
}

# 备份数据
backup_data() {
    log_info "开始备份数据..."

    # 创建备份目录
    mkdir -p $BACKUP_DIR

    # 备份数据库
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/zzyl_backup_$TIMESTAMP.sql"

    docker exec zzyl-mysql mysqldump -uroot -p123456 zzyl > $BACKUP_FILE

    if [ $? -eq 0 ]; then
        log_success "数据库备份成功：$BACKUP_FILE"
        log_info "备份文件大小：$(ls -lh $BACKUP_FILE | awk '{print $5}')"
    else
        log_error "数据库备份失败！"
        return 1
    fi

    # 备份上传文件
    if [ -d "$PROJECT_DIR/data/uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C $PROJECT_DIR/data/uploads .
        log_success "上传文件备份成功"
    fi
}

# 拉取最新代码
pull_latest_code() {
    log_info "开始拉取最新代码..."

    cd $PROJECT_DIR

    # 检查是否有未提交的修改
    if ! git diff-index --quiet HEAD --; then
        log_warning "检测到本地有未提交的修改"
        read -p "是否暂存并继续？(y/n): " choice
        if [ "$choice" = "y" ]; then
            git stash
            log_info "已暂存本地修改"
        else
            log_error "更新已取消"
            return 1
        fi
    fi

    # 拉取最新代码
    git pull origin main

    if [ $? -eq 0 ]; then
        log_success "代码拉取成功"

        # 显示最新提交
        log_info "最新提交：$(git log -1 --pretty=format:'%h - %s (%cr)')"
    else
        log_error "代码拉取失败！"
        return 1
    fi
}

# 重新构建镜像
rebuild_images() {
    log_info "开始重新构建Docker镜像..."
    log_warning "这可能需要5-10分钟，请耐心等待..."

    cd $PROJECT_DIR

    # 停止旧服务
    log_info "停止旧服务..."
    docker compose down

    # 构建新镜像
    log_info "构建新镜像..."
    docker compose build --no-cache

    if [ $? -eq 0 ]; then
        log_success "镜像构建成功"
    else
        log_error "镜像构建失败！"
        return 1
    fi
}

# 启动新服务
start_services() {
    log_info "启动新服务..."

    cd $PROJECT_DIR
    docker compose up -d

    log_info "等待服务启动（60秒）..."
    sleep 60

    # 检查服务状态
    log_info "检查服务状态..."
    docker compose ps

    # 检查是否有异常容器
    UNHEALTHY=$(docker compose ps | grep -c "Exit\|Restarting" || true)

    if [ $UNHEALTHY -gt 0 ]; then
        log_warning "有 $UNHEALTHY 个容器状态异常"
        log_info "查看详细日志："
        docker compose logs --tail 50
        return 1
    else
        log_success "所有服务启动正常"
        return 0
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."

    # 检查后端API
    log_info "检查后端API..."
    if curl -f -s http://localhost:9995/doc.html > /dev/null; then
        log_success "后端API正常"
    else
        log_error "后端API无法访问"
        return 1
    fi

    # 检查前端
    log_info "检查前端..."
    if curl -f -s http://localhost > /dev/null; then
        log_success "前端服务正常"
    else
        log_error "前端服务无法访问"
        return 1
    fi

    # 检查数据库连接
    log_info "检查数据库连接..."
    if docker exec zzyl-mysql mysqladmin ping -h localhost -uroot -p123456 > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败"
        return 1
    fi

    # 检查Redis连接
    log_info "检查Redis连接..."
    if docker exec zzyl-redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis连接正常"
    else
        log_error "Redis连接失败"
        return 1
    fi

    log_success "部署验证通过！"
}

# 显示访问信息
show_access_info() {
    show_separator
    log_info "部署完成！"
    show_separator
    echo ""
    echo -e "${GREEN}访问地址：${NC}"
    echo -e "  前端：      http://192.168.100.128"
    echo -e "  API文档：   http://192.168.100.128:9995/doc.html"
    echo ""
    echo -e "${GREEN}测试账号：${NC}"
    echo -e "  用户名：    admin@qq.com"
    echo -e "  密码：      888itcast.CN764%..."
    echo ""
    echo -e "${GREEN}更新内容：${NC}"
    echo -e "  ✓ 品牌Logo更新为'智慧养老'"
    echo -e "  ✓ 移除登录页面默认密码"
    echo -e "  ✓ API接口文档更新"
    echo ""
    echo -e "${YELLOW}管理命令：${NC}"
    echo -e "  查看日志：  docker compose logs -f"
    echo -e "  重启服务：  docker compose restart"
    echo -e "  停止服务：  docker compose down"
    echo -e "  管理工具：  ./docker-manage.sh"
    echo ""
    show_separator
}

# 主函数
main() {
    show_separator
    echo -e "${GREEN}智慧养老系统 - 快速更新脚本${NC}"
    show_separator
    echo ""

    # 确认更新
    log_warning "即将执行以下操作："
    echo "  1. 备份数据库和文件"
    echo "  2. 拉取最新代码"
    echo "  3. 重新构建Docker镜像"
    echo "  4. 重启所有服务"
    echo "  5. 验证部署"
    echo ""

    read -p "确认继续？(y/n): " confirm
    if [ "$confirm" != "y" ]; then
        log_info "更新已取消"
        exit 0
    fi

    # 执行更新步骤
    show_separator

    # 步骤1：备份数据
    backup_data
    if [ $? -ne 0 ]; then
        log_error "备份失败，更新终止"
        exit 1
    fi

    # 步骤2：拉取代码
    pull_latest_code
    if [ $? -ne 0 ]; then
        log_error "代码拉取失败，更新终止"
        exit 1
    fi

    # 步骤3：重新构建
    rebuild_images
    if [ $? -ne 0 ]; then
        log_error "镜像构建失败，更新终止"
        exit 1
    fi

    # 步骤4：启动服务
    start_services
    if [ $? -ne 0 ]; then
        log_error "服务启动异常"
        log_warning "可以尝试手动排查或回滚"
        exit 1
    fi

    # 步骤5：验证部署
    verify_deployment
    if [ $? -ne 0 ]; then
        log_error "部署验证失败"
        log_warning "请检查服务状态和日志"
        exit 1
    fi

    # 显示访问信息
    show_access_info
}

# 执行主函数
main
