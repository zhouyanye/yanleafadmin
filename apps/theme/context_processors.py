"""YanLeafAdmin — 上下文处理器"""
from .settings import get_config


def yanleaf_settings(request):
    config = get_config()
    # 检测 i18n URL
    try:
        from django.urls import reverse
        reverse('set_language')
        has_i18n = True
    except Exception:
        has_i18n = False

    # 检测 ER 图 URL 是否已配置
    try:
        from django.urls import reverse
        reverse('erd_engine:er_page')
        has_erd = True
    except Exception:
        has_erd = False

    return {
        'YANLEAF_CONFIG': config,
        'YANLEAF_SHOW_CREDIT': config.get('show_credit', True),
        'YANLEAF_SIDEBAR_WIDTH': config.get('sidebar_width', '250px'),
        'YANLEAF_THEME_COLOR': config.get('theme_color', '#485fc7'),
        'YLA_HAS_SET_LANGUAGE': has_i18n,
        'YLA_HAS_ERD': has_erd,
    }
