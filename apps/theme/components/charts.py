"""YanLeafAdmin — SmartChart 自动图表数据构造器"""
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.apps import apps
from datetime import datetime, timedelta


class SmartChartBuilder:
    """根据 Model 字段类型自动生成 ECharts option 数据"""

    @staticmethod
    def build(model_cls, field_name, chart_type=None, period='7d', queryset=None):
        qs = queryset if queryset is not None else model_cls.objects.all()
        field = model_cls._meta.get_field(field_name)
        if chart_type is None:
            chart_type = SmartChartBuilder._infer_type(field)

        if chart_type == 'trend':
            return SmartChartBuilder._build_trend(qs, field_name, period)
        elif chart_type == 'pie':
            return SmartChartBuilder._build_pie(qs, field_name)
        elif chart_type == 'bar':
            return SmartChartBuilder._build_bar(qs, field_name)
        return {}

    @staticmethod
    def _infer_type(field):
        from django.db.models import DateField, DateTimeField, BooleanField
        if isinstance(field, (DateField, DateTimeField)):
            return 'trend'
        if isinstance(field, BooleanField):
            return 'pie'
        if hasattr(field, 'choices') and field.choices:
            return 'bar'
        return 'bar'

    @staticmethod
    def _build_trend(qs, field_name, period):
        days = int(period.rstrip('d'))
        since = datetime.now().date() - timedelta(days=days - 1)
        data = (
            qs.filter(**{f'{field_name}__date__gte': since})
            .annotate(day=TruncDate(field_name))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        labels, values = [], []
        for entry in data:
            labels.append(entry['day'].strftime('%m-%d') if entry['day'] else '?')
            values.append(entry['count'])
        return {
            'xAxis': [{'type': 'category', 'data': labels}],
            'yAxis': [{'type': 'value'}],
            'series': [{
                'type': 'line', 'data': values, 'smooth': True,
                'lineStyle': {'width': 2},
                'areaStyle': {'opacity': 0.1}
            }]
        }

    @staticmethod
    def _build_pie(qs, field_name):
        data = qs.values(field_name).annotate(count=Count('id'))
        pie_data = []
        for entry in data:
            val = entry[field_name]
            if val is True:
                label = '是'
            elif val is False:
                label = '否'
            elif val is None:
                label = '(空)'
            else:
                label = str(val)
            pie_data.append({'name': label, 'value': entry['count']})
        return {
            'series': [{
                'type': 'pie',
                'radius': ['40%', '70%'],
                'data': pie_data,
                'label': {'show': True, 'formatter': '{b}: {c}'}
            }]
        }

    @staticmethod
    def _build_bar(qs, field_name):
        data = qs.values(field_name).annotate(count=Count('id')).order_by('-count')[:10]
        labels = [str(d[field_name]) or '(空)' for d in data]
        values = [d['count'] for d in data]
        return {
            'xAxis': [{'type': 'category', 'data': labels}],
            'yAxis': [{'type': 'value'}],
            'series': [{'type': 'bar', 'data': values}]
        }


def chart_data_api(request, app_label, model_name, field_name):
    """SmartChart JSON API 视图"""
    model_cls = apps.get_model(app_label, model_name)
    if model_cls is None:
        return JsonResponse({'error': '模型不存在'}, status=404)
    chart_type = request.GET.get('type', None) or None
    period = request.GET.get('period', '7d')
    option = SmartChartBuilder.build(model_cls, field_name, chart_type, period)
    return JsonResponse(option, safe=False)
