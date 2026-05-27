"""YanLeafAdmin — SmartChart 模板标签"""
import json
from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def smart_chart(app_label, model_name, field_name, chart_type='', period='7d', height='300px'):
    """渲染 SmartChart 容器"""
    config = json.dumps({
        'appLabel': app_label,
        'modelName': model_name,
        'fieldName': field_name,
        'type': chart_type or '',
        'period': period,
    }, ensure_ascii=False)
    escaped_config = config.replace(chr(34), '&quot;')
    return mark_safe(f'''
<div class="yla-chart-container box" style="height:{height};position:relative;">
    <div class="yla-chart" data-yla-chart="{escaped_config}" style="width:100%;height:100%;"></div>
</div>''')
