"""YanLeafAdmin — 上下文处理器"""
from .settings import get_config


def yanleaf_settings(request):
    config = get_config()
    # 安全检测 set_language URL 是否可用
    try:
        from django.urls import reverse
        reverse('set_language')
        has_i18n = True
    except Exception:
        has_i18n = False

    return {
        'YANLEAF_CONFIG': config,
        'YANLEAF_SHOW_CREDIT': config.get('show_credit', True),
        'YANLEAF_SIDEBAR_WIDTH': config.get('sidebar_width', '250px'),
        'YANLEAF_THEME_COLOR': config.get('theme_color', '#485fc7'),
        'YLA_HAS_SET_LANGUAGE': has_i18n,
    }
