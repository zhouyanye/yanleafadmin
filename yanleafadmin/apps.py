"""YanLeafAdmin AppConfig"""
import os as _os
from django.apps import AppConfig as _AppConfig


class YanleafConfig(_AppConfig):
    """YanLeafAdmin 主题 AppConfig"""
    name = 'yanleafadmin'
    verbose_name = 'YanLeafAdmin'
    path = ''

    def __init__(self, app_name, app_module):
        super().__init__(app_name, app_module)
        import apps.theme as _theme
        self.path = _os.path.dirname(_os.path.abspath(_theme.__file__))

    def ready(self):
        from apps.theme.apps import ThemeConfig
        import apps.theme as _theme_mod
        proxy = ThemeConfig(self.name, _theme_mod)
        proxy.path = self.path
        ThemeConfig.ready(proxy)
