"""YanLeafAdmin — 上下文处理器"""
from .settings import get_config


def yanleaf_settings(request):
    config = get_config()
    return {
        'YANLEAF_CONFIG': config,
        'YANLEAF_SHOW_CREDIT': config.get('show_credit', True),
        'YANLEAF_SIDEBAR_WIDTH': config.get('sidebar_width', '250px'),
        'YANLEAF_THEME_COLOR': config.get('theme_color', '#485fc7'),
    }
