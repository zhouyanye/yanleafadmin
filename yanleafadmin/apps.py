"""YanLeafAdmin AppConfig — 代理 apps.theme.ThemeConfig"""
import os as _os
from apps.theme.apps import ThemeConfig


class YanleafConfig(ThemeConfig):
    """代理 AppConfig，让用户只需 'yanleafadmin' 即可启用"""
    name = 'yanleafadmin'
    # 指向真正的模板/静态文件路径
    path = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), 'apps', 'theme')
