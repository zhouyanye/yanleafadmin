# YanLeafAdmin

极简白色现代 Django Admin 后台主题体系，基于 Django + Bulma CSS + ECharts + GoJS 构建。

## 功能概览

### 核心主题
- 白色极简 + 暗黑模式双模切换（localStorage 持久化）
- 中英文 i18n 国际化（zh-hans / en）
- 侧边栏导航 + 顶部面包屑 + 用户菜单
- 登录页验证码（django-simple-captcha）

### 组件与交互
- **DataTables**：列表页一键导出 Excel / CSV / 打印
- **SweetAlert2**：编辑/删除确认弹窗，Toast 弱提示
- **Select2**：下拉搜索增强
- **Dropzone**：拖拽文件上传
- **穿梭框重写**：Bulma 卡片式左右选择器

### 可视化引擎
- **SmartChart**：根据 Model 字段类型自动生成 ECharts 图表（趋势/饼图/柱状图）
- **仪表盘热力图**：近半年操作活跃度（类 GitHub 绿格子墙）
- **模块玫瑰图**：近 7 天模块活跃度分布
- **系统动态时间线**：10 条最新操作记录，Badge 四级颜色标记，展开变更 Diff

### ER 图引擎
- **Django 模型直读**：一键生成当前项目所有表的实体关系图
- **SQL DDL 解析**：粘贴建表语句自动渲染 ER 图
- **GoJS 渲染**：黑白经典风格（矩形表+椭圆字段+菱形关联）
- **表选择 + 搜索过滤**
- **中英文切换**：中文优先 COMMENT 注释，英文用原名
- **导出 PNG** + **导出 Word 三线表 (.docx)**

### AI 数据助手
- **右下角悬浮聊天机器人**，点击即可对话
- **自然语言查询**：基于 DeepSeek 驱动，自动转 Django ORM
- **SmartChart 渲染**：查询结果原地生成图表
- **多模型支持**：DeepSeek Chat / Reasoner / GPT-4o / 通义千问
- **配置保存在浏览器**：API Key 不上传服务器
- **聊天历史**：localStorage 持久化最近 50 条对话
- **全屏展开**：新标签页全屏对话

### 开发者体验
- **pip install**：`pip install yanleafadmin`
- **YANLEAF_ADMIN 配置字典**：15+ 可配置项
- **模板标签**：`stat_card` / `status_badge` / `action_btn` / `empty_state` / `confirm_link` / `timeline` / `smart_chart`
- **无 CDN 依赖**：所有静态资源本地化（17 个 vendor 包），内网可用

## 快速开始

### 环境要求
- Python 3.10+
- Django 5.0+
- django-simple-captcha >= 0.5
- (可选) python-docx — Word 导出功能

### 安装

```bash
pip install yanleafadmin
```

或开发模式：

```bash
git clone https://github.com/zhouyanye/yanleafadmin.git
cd yanleafadmin
pip install -e .
```

### 配置 settings.py

> 如果是 **pip install** 安装，直接跳到下方配置。  
> 如果是 **git clone** 到本地作为项目使用，在 `settings.py` 顶部加一行：

```python
import os, sys
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))
```

#### 最少配置（只用主题 + 仪表盘）

```python
INSTALLED_APPS = [
    'yanleafadmin',              # 主题（必须在 admin 前面，一行搞定）
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'captcha',                   # 登录验证码
    'apps.users.apps.UsersConfig',
    'apps.dashboard_engine.apps.DashboardEngineConfig',
]

AUTH_USER_MODEL = 'users.User'
```

#### 完整配置（含 ER 图 + AI 助手）

在最少配置基础上追加：

```python
INSTALLED_APPS += [
    'apps.erd_engine.apps.ErdEngineConfig',
    'apps.ai_assistant.apps.AiAssistantConfig',
]
```

#### 语言与主题配置

```python
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True

LANGUAGES = [
    ('zh-hans', '简体中文'),
    ('en', 'English'),
]

# 所有配置项均可选，不写则使用默认值
YANLEAF_ADMIN = {
    'theme_color': '#485fc7',
    'show_credit': True,
    'dark_mode_default': 'auto',
    'datatables_page_length': 10,
    'login_captcha': True,
    'charts_enabled': True,
    'ai_assistant_enabled': True,
}

# AI 助手（Key 请在 .env 中设置，不要提交到 Git）
YANLEAF_AI = {
    'enabled': True,
    'model': 'deepseek-chat',
    'api_base': 'https://api.deepseek.com/v1',
}
```

### .env 文件（可选）

```bash
YANLEAF_AI_API_KEY=sk-xxxxxxxxxxxxxxxx
YANLEAF_AI_API_BASE=https://api.deepseek.com/v1
YANLEAF_AI_MODEL=deepseek-chat
```

### 初始化

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data   # 生成演示用户数据
python manage.py runserver
```

访问 `http://127.0.0.1:8000/admin/`

## 项目结构

```
yanleaf_admin_project/
├── core/                          # Django 项目配置
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── theme/                     # 主题核心（模板 + CSS + JS + 组件）
│   │   ├── components/            # actions.py（AJAX 视图）
│   │   ├── templatetags/          # yla_components.py / yla_charts.py
│   │   ├── static/yanleafadmin/
│   │   │   ├── css/               # admin.css + 各页面 CSS
│   │   │   ├── js/                # core.js + filter-widget.js + smart-chart.js
│   │   │   └── vendor/            # 本地化第三方库（17 个包）
│   │   └── templates/admin/       # base.html + login + change_list + change_form
│   ├── dashboard_engine/          # 仪表盘与可视化
│   │   ├── apps.py                # 热力图/玫瑰图/系统动态数据构造
│   │   ├── views.py               # 日志 Diff API
│   │   └── templates/admin/dashboard_index.html
│   ├── erd_engine/                # ER 图引擎
│   │   ├── sql_parser.py          # SQL DDL 解析器
│   │   ├── views.py               # ER 数据 API
│   │   ├── components/charts.py   # SmartChart 构造器
│   │   ├── static/erd/er-diagram.js  # GoJS ER 图渲染
│   │   └── templates/erd/er_diagram.html
│   ├── ai_assistant/              # AI 数据助手
│   │   ├── services.py            # LLM Prompt + ORM 查询引擎
│   │   ├── views.py               # /api/ai/query/ 接口
│   │   ├── static/ai/ai-search.js # 悬浮聊天机器人
│   │   └── templates/ai/fullpage.html  # 全屏对话页
│   └── users/                     # 用户模型 + 种子数据
├── yanleafadmin/                  # pip 入口包（代理 apps/theme）
│   ├── __init__.py
│   └── apps.py
├── docs/                          # 文档与设计规格
├── setup.py                       # pip 安装包
├── MANIFEST.in
└── README.md
```

### URL 配置

如果使用了 ER 图、AI 助手等功能，需要在 `urls.py` 中添加对应路由：

```python
from django.urls import path, include

urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),   # 语言切换（必须）
    path('admin/', admin.site.urls),
    path('admin/erd/', include('apps.erd_engine.urls')),  # ER 图
    path('api/ai/', include('apps.ai_assistant.urls')),   # AI 助手
    path('yla-api/', include('apps.theme.urls')),          # SmartChart 等
]
```

## YANLEAF_ADMIN 完整配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `site_title` | str | `YanleafAdmin` | 站点标题 |
| `theme_color` | str | `#485fc7` | 主题色 |
| `sidebar_width` | str | `250px` | 侧边栏宽度 |
| `show_credit` | bool | `True` | 侧边栏署名 |
| `dark_mode_default` | str | `auto` | 暗黑模式: auto / light / dark |
| `default_language` | str | `zh-hans` | 默认语言 |
| `datatables_page_length` | int | `10` | 列表每页条数 |
| `datatables_export` | bool | `True` | 启用导出按钮 |
| `charts_enabled` | bool | `True` | 启用 SmartChart |
| `charts_default_period` | str | `7d` | 默认图表周期 |
| `login_captcha` | bool | `True` | 登录验证码 |
| `captcha_length` | int | `4` | 验证码长度 |
| `captcha_image_size` | tuple | `(140, 45)` | 验证码图片尺寸 |
| `menu_icons` | dict | `{}` | 模型图标映射 |
| `ai_assistant_enabled` | bool | `True` | AI 助手开关 |

## 模板标签

```django
{% load yla_components %}
{% stat_card "今日新增" 128 "+12%" "fa-user-plus" "info" %}
{% status_badge True "启用" "禁用" %}
{% action_btn "审核通过" approve_url method="POST" %}
{% empty_state icon="fa-inbox" title="暂无数据" hint="点击上方按钮开始添加" %}
{% confirm_link delete_url "删除" "确定删除此用户？" %}

{% load yla_charts %}
{% smart_chart "users" "user" "date_joined" "trend" "7d" %}
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 后端框架 | Django 5.2 |
| CSS 框架 | Bulma 1.0 |
| 表格 | DataTables 2.1 + Buttons 3.1 |
| 图表 | Apache ECharts 5.5 |
| ER 图 | GoJS |
| AI | DeepSeek / OpenAI 兼容 API |
| 弹窗 | SweetAlert2 11 |
| 下拉 | Select2 4.0 |
| 上传 | Dropzone 6.0 |
| 日期 | Bulma Calendar 6.1 |
| Word 导出 | python-docx 1.2 |
| SQL 解析 | sqlparse |

## License

MIT License — 详见 [LICENSE](LICENSE)

## 作者

**zhouyanye** — [github.com/zhouyanye](https://github.com/zhouyanye)



## Star History

<a href="https://www.star-history.com/?repos=zhouyanye%2Fyanleafadmin&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=zhouyanye/yanleafadmin&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=zhouyanye/yanleafadmin&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=zhouyanye/yanleafadmin&type=date&legend=top-left" />
 </picture>
</a>
