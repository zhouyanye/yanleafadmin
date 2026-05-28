from django.apps import AppConfig


class ThemeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.theme'
    
    def ready(self):
        from django.contrib import admin
        from django.conf import settings as django_settings
        from .settings import get_config

        config = get_config()

        # 登出后重定向到登录页
        if not getattr(django_settings, 'LOGOUT_REDIRECT_URL', None):
            django_settings.LOGOUT_REDIRECT_URL = '/admin/login/'

        # 自动注入 context processor（pip 用户不用手动配置）
        cp_path = 'apps.theme.context_processors.yanleaf_settings'
        for tpl in django_settings.TEMPLATES:
            opts = tpl.get('OPTIONS', {})
            cps = opts.get('context_processors', [])
            if cp_path not in cps:
                cps = list(cps)
                cps.append(cp_path)
                opts['context_processors'] = cps

        # 登录验证码（可选）
        if config.get('login_captcha'):
            try:
                from django.apps import apps as _apps
                _apps.get_app_config('captcha')
                from .forms import YanleafAdminLoginForm
                admin.site.login_form = YanleafAdminLoginForm
            except (LookupError, ImportError):
                pass  # captcha 未安装或未注册

        # 每页条数
        from django.contrib.admin import ModelAdmin
        ModelAdmin.list_per_page = config.get('datatables_page_length', 10)

        # 保留 per_page 参数补丁
        self._patch_changelist_per_page()

        # 仪表盘首页（pip install 时自动启用）
        try:
            from apps.dashboard_engine.apps import DashboardEngineConfig
            import apps.dashboard_engine
            dashboard_cfg = DashboardEngineConfig(apps.dashboard_engine.__name__, apps.dashboard_engine)
            dashboard_cfg.path = __import__('os').path.dirname(apps.dashboard_engine.__file__)
            dashboard_cfg.ready()
        except Exception:
            pass

        # ER 图引擎（自动添加模板目录，无需注册 app）
        try:
            import apps.erd_engine
            erd_tpl = __import__('os').path.join(
                __import__('os').path.dirname(apps.erd_engine.__file__), 'templates')
            for tpl in django_settings.TEMPLATES:
                dirs = list(tpl.get('DIRS', []))
                if erd_tpl not in dirs:
                    dirs.append(erd_tpl)
                    tpl['DIRS'] = dirs
        except Exception:
            pass

    def _patch_changelist_per_page(self):
        from django.contrib.admin.views.main import ChangeList
        from django.core.paginator import Paginator

        _orig_init = ChangeList.__init__

        def patched_init(self, request, *args, **kwargs):
            # 1) 保存自定义参数，然后从 request.GET 中移除（否则 Django 当字段筛选报 e=1）
            raw = request.GET.get('per_page', '')
            want_all = 'all' in request.GET
            has_custom = bool(raw.isdigit() or want_all)

            if has_custom:
                try:
                    request.GET._mutable = True
                except AttributeError:
                    pass
                request.GET.pop('per_page', None)
                request.GET.pop('all', None)
                try:
                    request.GET._mutable = False
                except AttributeError:
                    pass

            # 2) 原始初始化
            _orig_init(self, request, *args, **kwargs)
            self.page_end = min(self.page_num * self.list_per_page, self.full_result_count)

            # 3) 裸 URL → 不干预，走 ModelAdmin 默认
            if not has_custom:
                return

            # 4) 解析自定义参数
            new_per_page = None
            is_all = False

            if raw.isdigit():
                n = int(raw)
                if n in (10, 25, 50, 100):
                    new_per_page = n
            elif want_all:
                new_per_page = max(self.full_result_count, 1)
                is_all = True

            if new_per_page is None:
                return

            self.yla_is_all = is_all

            # 5) 写入 session（仅备份，不作为读取依据）
            try:
                request.session['yla_per_page'] = 'all' if is_all else new_per_page
            except Exception:
                pass

            # 6) 应用新的 list_per_page
            self.list_per_page = new_per_page

            # 7) 注入 cl.params + 兜底标记，确保翻页/筛选链接 100% 携带此参数
            self.params.pop('all', None)
            self.params.pop('per_page', None)
            if is_all:
                self.params['all'] = '1'
                self.yla_qs_extra = 'all=1'
            else:
                self.params['per_page'] = str(new_per_page)
                self.yla_qs_extra = 'per_page=' + str(new_per_page)

            # 8) 重建分页器
            try:
                full_qs = self.paginator.object_list
                self.paginator = Paginator(full_qs, self.list_per_page)
            except Exception:
                self.paginator.per_page = self.list_per_page

            p = request.GET.get('p', 1)
            try:
                self.page_num = int(p)
            except (TypeError, ValueError):
                self.page_num = 1
            if self.page_num < 1:
                self.page_num = 1
            if self.page_num > self.paginator.num_pages:
                self.page_num = self.paginator.num_pages

            self.result_list = list(self.paginator.get_page(self.page_num))
            self.result_count = self.paginator.count
            self.can_show_all = False
            self.multi_page = self.result_count > self.list_per_page
            self.page_end = min(self.page_num * self.list_per_page, self.full_result_count)

        ChangeList.__init__ = patched_init
