"""YanLeafAdmin AppConfig — 代理 apps.theme.ThemeConfig"""
import os as _os
from apps.theme.apps import ThemeConfig


class YanleafConfig(ThemeConfig):
    """代理 AppConfig，让用户只需 'yanleafadmin' 即可启用"""
    name = 'yanleafadmin'

    def __init__(self, app_name, app_module):
        super().__init__(app_name, app_module)
        # 覆盖 path 指向真正的模板/静态文件目录
        import apps.theme
        self.path = _os.path.dirname(_os.path.abspath(apps.theme.__file__))
