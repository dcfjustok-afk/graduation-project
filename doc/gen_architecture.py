"""
生成项目架构图 PNG - 基于区块链的可信任务日志审计系统
使用 matplotlib 绘制专业架构图
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
import os

# ========== 配置 ==========
fig, ax = plt.subplots(1, 1, figsize=(20, 14), dpi=150)
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')
fig.patch.set_facecolor('white')

# 字体配置 - Windows 中文
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ========== 颜色定义 ==========
C_AGENT_BG = '#E8F5E9'
C_AGENT_BD = '#2E7D32'
C_SERVER_BG = '#E3F2FD'
C_SERVER_BD = '#1565C0'
C_CONTRACT_BG = '#FFF3E0'
C_CONTRACT_BD = '#E65100'
C_WEB_BG = '#F3E5F5'
C_WEB_BD = '#6A1B9A'
C_DB_BG = '#FCE4EC'
C_DB_BD = '#C62828'
C_SHARED_BG = '#E0F7FA'
C_SHARED_BD = '#00838F'
C_ARROW = '#455A64'
C_TITLE = '#212121'
C_SUB = '#616161'

def draw_rounded_box(ax, x, y, w, h, label, sub_label, bg, bd, fontsize=11, sub_fontsize=9):
    """画圆角矩形模块"""
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                          facecolor=bg, edgecolor=bd, linewidth=2.5)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2 + 0.18, label, ha='center', va='center',
            fontsize=fontsize, fontweight='bold', color=bd)
    if sub_label:
        ax.text(x + w/2, y + h/2 - 0.22, sub_label, ha='center', va='center',
                fontsize=sub_fontsize, color=C_SUB)
    return box

def draw_inner_box(ax, x, y, w, h, label, bg='#FAFAFA', bd='#BDBDBD', fontsize=8.5):
    """画内部小模块"""
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                          facecolor=bg, edgecolor=bd, linewidth=1.2)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, label, ha='center', va='center',
            fontsize=fontsize, color='#333333')

def draw_arrow(ax, x1, y1, x2, y2, label='', color=C_ARROW, style='->', lw=2):
    """画带标签的箭头"""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw,
                               connectionstyle='arc3,rad=0.05'))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my + 0.2, label, ha='center', va='center',
                fontsize=8, color=color, fontstyle='italic',
                bbox=dict(boxstyle='round,pad=0.15', facecolor='white', 
                         edgecolor='none', alpha=0.9))

# ========== 标题 ==========
ax.text(10, 13.5, '基于区块链的可信任务日志审计系统 — 系统架构图', 
        ha='center', va='center', fontsize=18, fontweight='bold', color=C_TITLE)
ax.text(10, 13.0, 'Blockchain-based Trusted Task Log Audit System Architecture',
        ha='center', va='center', fontsize=11, color='#9E9E9E')

# ========== 1. 日志文件 ==========
draw_rounded_box(ax, 0.3, 9.5, 2.8, 1.8, '日志文件', 'Log Files (.log)', '#F5F5F5', '#757575')

# ========== 2. Agent 模块 ==========
# 外框
agent_box = FancyBboxPatch((0.3, 5.0), 4.8, 4.0, boxstyle="round,pad=0.2",
                            facecolor=C_AGENT_BG, edgecolor=C_AGENT_BD, linewidth=2.5)
ax.add_patch(agent_box)
ax.text(2.7, 8.7, '日志采集 Agent', ha='center', va='center',
        fontsize=13, fontweight='bold', color=C_AGENT_BD)
ax.text(2.7, 8.3, 'Node.js + TypeScript', ha='center', va='center',
        fontsize=9, color=C_SUB)

# Agent 内部模块
draw_inner_box(ax, 0.6, 7.2, 2.0, 0.8, '增量文件读取\nFileReader', C_AGENT_BG, C_AGENT_BD)
draw_inner_box(ax, 2.8, 7.2, 2.0, 0.8, '偏移量存储\nOffsetStore', C_AGENT_BG, C_AGENT_BD)
draw_inner_box(ax, 0.6, 5.5, 2.0, 0.8, '日志收集器\nLogCollector', C_AGENT_BG, C_AGENT_BD)
draw_inner_box(ax, 2.8, 5.5, 2.0, 0.8, '重试队列\nRetryQueue', C_AGENT_BG, C_AGENT_BD)

# Agent 内部箭头
draw_arrow(ax, 1.6, 7.2, 1.6, 6.3, '', C_AGENT_BD, '->', 1.5)
draw_arrow(ax, 2.6, 5.9, 2.8, 5.9, '', C_AGENT_BD, '->', 1.5)

# ========== 3. Server 模块 ==========
server_box = FancyBboxPatch((6.0, 3.5), 7.5, 8.5, boxstyle="round,pad=0.2",
                             facecolor=C_SERVER_BG, edgecolor=C_SERVER_BD, linewidth=2.5)
ax.add_patch(server_box)
ax.text(9.75, 11.6, '后端服务 Server', ha='center', va='center',
        fontsize=14, fontweight='bold', color=C_SERVER_BD)
ax.text(9.75, 11.15, 'Express 5 + TypeScript + SQLite', ha='center', va='center',
        fontsize=9, color=C_SUB)

# API 层
api_bg = '#BBDEFB'
draw_inner_box(ax, 6.4, 9.5, 7.0, 1.3, '', api_bg, C_SERVER_BD, 9)
ax.text(9.9, 10.55, 'API 接口层 (10 个 RESTful 接口)', ha='center', va='center',
        fontsize=10, fontweight='bold', color=C_SERVER_BD)
api_texts = [
    'POST /api/logs', 'GET /api/logs', 'POST /api/audits/run',
    'GET /api/alerts', 'GET /api/overview', 'POST /api/logs/generate'
]
for i, t in enumerate(api_texts):
    col = i % 3
    row = i // 3
    ax.text(7.4 + col * 2.3, 10.1 - row * 0.35, t, ha='center', va='center',
            fontsize=7.5, color='#333', family='monospace')

# 业务层
draw_inner_box(ax, 6.4, 7.5, 2.2, 1.6, '区块链服务\nSHA-256 哈希\n合约调用', '#C8E6C9', '#388E3C', 9)
draw_inner_box(ax, 8.8, 7.5, 2.2, 1.6, '审计服务\n三方哈希比对\n异常检测', '#FFECB3', '#F57F17', 9)
draw_inner_box(ax, 11.2, 7.5, 2.0, 1.6, '告警服务\n自动生成\n严重分级', '#FFCDD2', '#D32F2F', 9)

ax.text(9.75, 9.25, '业务逻辑层 (Services)', ha='center', va='center',
        fontsize=10, fontweight='bold', color=C_SERVER_BD)

# 数据层
draw_inner_box(ax, 6.4, 5.8, 7.0, 1.3, '', '#E1F5FE', C_SERVER_BD, 9)
ax.text(9.9, 6.85, '数据访问层 (Repository Pattern)', ha='center', va='center',
        fontsize=10, fontweight='bold', color=C_SERVER_BD)
repos = ['日志仓库\nLogRepo', '审计仓库\nAuditRepo', '告警仓库\nAlertRepo', '总览仓库\nOverviewRepo']
for i, r in enumerate(repos):
    ax.text(7.3 + i * 1.8, 6.25, r, ha='center', va='center', fontsize=8, color='#333')

# Server 内部箭头
draw_arrow(ax, 9.9, 9.5, 9.9, 9.3, '', C_SERVER_BD, '->', 1.5)
draw_arrow(ax, 9.9, 7.5, 9.9, 7.1, '', C_SERVER_BD, '->', 1.5)

# ========== 4. DataBase ==========
db_box = FancyBboxPatch((6.0, 0.5), 7.5, 2.6, boxstyle="round,pad=0.2",
                          facecolor=C_DB_BG, edgecolor=C_DB_BD, linewidth=2.5)
ax.add_patch(db_box)
ax.text(9.75, 2.8, 'SQLite 数据库 (5张表 + 5个索引)', ha='center', va='center',
        fontsize=11, fontweight='bold', color=C_DB_BD)

tables = [
    ('logs\n日志原文', '#FFCDD2'),
    ('log_hash_records\n上链记录', '#F8BBD0'),
    ('audit_records\n审计记录', '#E1BEE7'),
    ('alerts\n告警记录', '#D1C4E9'),
    ('agent_states\nAgent状态', '#C5CAE9')
]
for i, (t, c) in enumerate(tables):
    draw_inner_box(ax, 6.4 + i * 1.4, 1.0, 1.3, 1.2, t, c, C_DB_BD, 8)

# Server -> DB 箭头
draw_arrow(ax, 9.75, 5.8, 9.75, 3.1, 'SQL 读写', C_DB_BD, '->', 2)

# ========== 5. 智能合约 ==========
contract_box = FancyBboxPatch((14.5, 5.5), 5.0, 6.5, boxstyle="round,pad=0.2",
                               facecolor=C_CONTRACT_BG, edgecolor=C_CONTRACT_BD, linewidth=2.5)
ax.add_patch(contract_box)
ax.text(17.0, 11.6, '以太坊区块链', ha='center', va='center',
        fontsize=14, fontweight='bold', color=C_CONTRACT_BD)
ax.text(17.0, 11.15, 'Hardhat / Ethereum Network', ha='center', va='center',
        fontsize=9, color=C_SUB)

# 合约内部
draw_inner_box(ax, 14.8, 9.5, 4.4, 1.3, 'LogRegistry 智能合约\nSolidity 0.8.24 + OpenZeppelin AccessControl',
               C_CONTRACT_BG, C_CONTRACT_BD, 9.5)

funcs = [
    'storeLog(taskId, logHash)\n写入日志哈希存证',
    'getLogsByTaskId(taskId)\n按任务查询链上记录',
    'getLog(recordId)\n按ID查询单条记录'
]
for i, f in enumerate(funcs):
    draw_inner_box(ax, 14.8, 6.0 + (2-i)*1.1, 4.4, 0.9, f, '#FFE0B2', C_CONTRACT_BD, 8.5)

# AccessControl 标注
draw_inner_box(ax, 15.5, 5.8, 2.8, 0.6, 'LOGGER_ROLE 权限控制', '#FFCC80', C_CONTRACT_BD, 8.5)

# ========== 6. 前端 Web ==========
web_box = FancyBboxPatch((14.5, 0.5), 5.0, 4.5, boxstyle="round,pad=0.2",
                           facecolor=C_WEB_BG, edgecolor=C_WEB_BD, linewidth=2.5)
ax.add_patch(web_box)
ax.text(17.0, 4.65, '前端 Web 界面', ha='center', va='center',
        fontsize=13, fontweight='bold', color=C_WEB_BD)
ax.text(17.0, 4.25, 'React 19 + Ant Design 5 + Vite 7', ha='center', va='center',
        fontsize=9, color=C_SUB)

pages = ['Dashboard\n总览页', '日志中心', '审计管理', '告警管理', '日志生成器']
for i, p in enumerate(pages):
    col = i % 3
    row = i // 3
    draw_inner_box(ax, 14.8 + col * 1.5, 2.7 - row * 1.0, 1.4, 0.8, p, '#E1BEE7', C_WEB_BD, 8)

ax.text(17.0, 1.0, 'Mock / Real API 模式切换', ha='center', va='center',
        fontsize=9, color=C_WEB_BD, fontstyle='italic')

# ========== 7. 共享类型库 ==========
draw_rounded_box(ax, 0.3, 1.5, 4.8, 1.5, '共享类型库 Shared', 
                  '50+ TypeScript 类型 · 校验函数 · 响应构建器',
                  C_SHARED_BG, C_SHARED_BD, 11, 8)

# ========== 箭头连接 ==========
# 日志文件 -> Agent
draw_arrow(ax, 1.7, 9.5, 1.7, 9.0, '增量读取', C_AGENT_BD, '->', 2.5)

# Agent -> Server (HTTP)
draw_arrow(ax, 5.1, 6.5, 6.4, 9.8, 'HTTP POST\n日志提交', '#2E7D32', '->', 2.5)

# Server 区块链服务 -> 合约
draw_arrow(ax, 8.6, 8.3, 14.8, 9.5, 'Ethers.js\n哈希上链', C_CONTRACT_BD, '->', 2.5)

# Server 审计服务 -> 合约
draw_arrow(ax, 11.0, 8.3, 14.8, 7.5, '读取链上哈希\n审计比对', '#F57F17', '->', 2)

# Web -> Server API
draw_arrow(ax, 14.5, 3.0, 13.5, 9.8, 'REST API', C_WEB_BD, '->', 2.5)

# Shared -> Server
draw_arrow(ax, 3.0, 3.0, 6.0, 4.0, '', C_SHARED_BD, '->', 1.5)
# Shared -> Web
draw_arrow(ax, 5.1, 2.0, 14.5, 2.0, '', C_SHARED_BD, '->', 1.5)

# ========== 数据流标注 ==========
ax.text(0.3, 0.5, '完整数据流：日志文件 → Agent 增量采集 → Server 入库 → SHA-256 哈希上链 → 审计三方比对 → 异常自动告警 → 前端可视化',
        ha='left', va='center', fontsize=9, color='#616161', fontstyle='italic',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='#F5F5F5', edgecolor='#E0E0E0'))

# ========== 保存 ==========
output_dir = r'd:\aaaProject\graduation-project\doc'
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(output_dir, 'architecture.png'), dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.savefig(os.path.join(output_dir, 'architecture.jpg'), dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none', format='jpg')
print(f"PNG saved: {os.path.join(output_dir, 'architecture.png')}")
print(f"JPG saved: {os.path.join(output_dir, 'architecture.jpg')}")
print("Done!")
