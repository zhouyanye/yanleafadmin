import datetime
from django.apps import AppConfig
from django.utils import timezone
class DashboardEngineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.dashboard_engine'

    def ready(self):
        from django.contrib import admin
        from django.contrib.auth import get_user_model
        import json

        try:
            import psutil
            _has_psutil = True
        except ImportError:
            _has_psutil = False

        original_index = admin.site.index

        def custom_index(request, extra_context=None):
            if extra_context is None:
                extra_context = {}
            User = get_user_model()
            try:
                total_users = User.objects.count()
                active_users = User.objects.filter(is_active=True).count()

                today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                today_count = User.objects.filter(date_joined__gte=today_start).count()

                memory_percent = psutil.virtual_memory().percent if _has_psutil else 0.0
            except Exception:
                total_users = 0
                active_users = 0
                today_count = 0
                memory_percent = 0.0

            # 最近 7 天用户注册趋势
            chart_labels = []
            chart_data = []
            week_new = 0
            yesterday_count = 0
            try:
                today = timezone.now().date()
                start = today - datetime.timedelta(days=6)
                for i in range(7):
                    d = start + datetime.timedelta(days=i)
                    chart_labels.append(d.strftime('%m-%d'))
                    day_start = timezone.make_aware(datetime.datetime.combine(d, datetime.time.min))
                    day_end = timezone.make_aware(datetime.datetime.combine(d + datetime.timedelta(days=1), datetime.time.min))
                    cnt = User.objects.filter(date_joined__gte=day_start, date_joined__lt=day_end).count()
                    chart_data.append(cnt)
                week_new = sum(chart_data)
                yesterday_count = chart_data[-2] if len(chart_data) >= 2 else 0
            except Exception:
                pass

            # 趋势计算
            today_vs_yesterday = today_count - yesterday_count
            if yesterday_count > 0:
                today_pct = round(today_vs_yesterday / yesterday_count * 100)
            elif today_count > 0:
                today_pct = 100
            else:
                today_pct = 0

            if total_users > 0:
                active_pct = round(active_users / total_users * 100)
            else:
                active_pct = 0

            # Latest 10 log entries with badge types and diff data
            recent_logs = []
            try:
                from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
                from django.contrib.contenttypes.models import ContentType
                action_map = {ADDITION: '添加', CHANGE: '修改', DELETION: '删除'}
                action_badge = {ADDITION: 'success', CHANGE: 'info', DELETION: 'danger'}

                # Sensitive field names
                SENSITIVE_FIELDS = {'groups', 'user_permissions', 'is_staff', 'is_superuser', 'is_active', 'password'}

                for entry in LogEntry.objects.select_related('user', 'content_type').order_by('-action_time')[:10]:
                    action = action_map.get(entry.action_flag, '操作')
                    badge = action_badge.get(entry.action_flag, 'info')
                    diff_data = []

                    # Parse change_message for diff
                    try:
                        msg = entry.get_change_message()
                        if isinstance(msg, str) and msg:
                            msg = json.loads(msg)
                        if isinstance(msg, list):
                            for item in msg:
                                if 'changed' in item and 'fields' in item['changed']:
                                    for field_name in item['changed']['fields']:
                                        diff_data.append({'field': field_name, 'type': 'changed'})
                                        # Check if sensitive
                                        if field_name in SENSITIVE_FIELDS:
                                            badge = 'warning'
                                elif 'added' in item:
                                    badge = 'success'
                                elif 'deleted' in item:
                                    badge = 'danger'
                    except Exception:
                        pass

                    recent_logs.append({
                        'id': entry.pk,
                        'user': str(entry.user),
                        'action': action,
                        'badge': badge,
                        'object_name': str(entry.object_repr)[:60],
                        'time': entry.action_time,
                        'diff': diff_data,
                        'has_diff': len(diff_data) > 0,
                        'module': str(entry.content_type) if entry.content_type else '',
                    })
            except Exception:
                pass

            # Activity heatmap (past ~6 months)
            heatmap_data = []
            try:
                from django.contrib.admin.models import LogEntry
                from django.db.models import Count
                from django.db.models.functions import TruncDate
                since_heat = timezone.now() - datetime.timedelta(days=180)
                heat_entries = (
                    LogEntry.objects
                    .filter(action_time__gte=since_heat)
                    .annotate(day=TruncDate('action_time'))
                    .values('day')
                    .annotate(count=Count('id'))
                    .order_by('day')
                )
                for e in heat_entries:
                    heatmap_data.append([e['day'].strftime('%Y-%m-%d'), e['count']])
            except Exception:
                pass

            # Module stats (past 7 days pie chart)
            module_stats = []
            try:
                from django.contrib.admin.models import LogEntry
                from django.db.models import Count
                since_week = timezone.now() - datetime.timedelta(days=7)
                top_modules = (
                    LogEntry.objects
                    .filter(action_time__gte=since_week)
                    .values('content_type__model')
                    .annotate(count=Count('id'))
                    .order_by('-count')[:6]
                )
                module_data = []
                for m in top_modules:
                    label = m['content_type__model'] or 'other'
                    module_data.append({'name': label, 'value': m['count']})
                module_stats = module_data
            except Exception:
                pass

            # Session environment info
            import re
            client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            if client_ip and ',' in client_ip:
                client_ip = client_ip.split(',')[0].strip()
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            # Parse browser/OS from UA
            browser_icon = 'fa-question'
            os_icon = 'fa-question'
            ua_lower = user_agent.lower()
            if 'chrome' in ua_lower and 'edg' not in ua_lower:
                browser_icon = 'fa-chrome'
            elif 'edg' in ua_lower:
                browser_icon = 'fa-edge'
            elif 'firefox' in ua_lower:
                browser_icon = 'fa-firefox'
            elif 'safari' in ua_lower and 'chrome' not in ua_lower:
                browser_icon = 'fa-safari'
            if 'windows' in ua_lower:
                os_icon = 'fa-windows'
            elif 'mac' in ua_lower:
                os_icon = 'fa-apple'
            elif 'linux' in ua_lower:
                os_icon = 'fa-linux'
            elif 'android' in ua_lower:
                os_icon = 'fa-android'
            elif 'iphone' in ua_lower or 'ipad' in ua_lower:
                os_icon = 'fa-apple'

            extra_context.update({
                'total_users_count': total_users,
                'active_users_count': active_users,
                'today_users_count': today_count,
                'memory_usage': f"{memory_percent}%",
                'chart_labels': chart_labels,
                'chart_data': chart_data,
                'week_new': week_new,
                'today_vs_yesterday': today_vs_yesterday,
                'today_pct': today_pct,
                'active_pct': active_pct,
                'recent_logs': recent_logs,
                'heatmap_data': heatmap_data,
                'heatmap_data_json': json.dumps(heatmap_data, ensure_ascii=False),
                'module_stats': module_stats,
                'module_stats_json': json.dumps(module_stats, ensure_ascii=False),
                'client_ip': client_ip,
                'browser_icon': browser_icon,
                'os_icon': os_icon,
            })
            return original_index(request, extra_context=extra_context)

        admin.site.index = custom_index
        admin.site.site_header = "Yanleaf Admin Dashboard"
        admin.site.index_template = 'admin/dashboard_index.html'
