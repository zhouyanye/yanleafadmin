from django.apps import AppConfig


class ErdEngineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.erd_engine'
    verbose_name = 'ER 图引擎'

    def ready(self):
        pass
