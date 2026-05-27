"""YanLeafAdmin — 配置中心。读取 settings.YANLEAF_ADMIN，合并默认值。"""
from django.conf import settings

DEFAULTS = {
    'site_title': 'YanleafAdmin',
    'theme_color': '#485fc7',
    'sidebar_width': '250px',
    'border_radius': '12px',
    'show_credit': True,
    'dark_mode_default': 'auto',
    'default_language': 'zh-hans',
    'datatables_page_length': 10,
    'datatables_export': True,
    'charts_enabled': True,
    'charts_default_period': '7d',
    'login_captcha': True,
    'captcha_length': 4,
    'captcha_image_size': (140, 45),
    'menu_icons': {},
    'ai_assistant_enabled': True,
}


def get_config():
    """返回合并后的配置字典"""
    user = getattr(settings, 'YANLEAF_ADMIN', {})
    cfg = DEFAULTS.copy()
    cfg.update(user)
    return cfg
