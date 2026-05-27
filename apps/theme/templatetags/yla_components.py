"""YanLeafAdmin — 组件模板标签"""
from django import template
from django.utils.translation import gettext_lazy as _
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def stat_card(title, value, trend=None, icon='fa-chart-bar', color='info'):
    """统计卡片组件"""
    icon_html = f'<i class="fas {icon}"></i>'
    trend_html = ''
    if trend:
        is_up = trend.startswith('+') or 'up' in trend.lower()
        arrow = 'fa-arrow-up' if is_up else 'fa-arrow-down'
        trend_class = 'has-text-success' if is_up else 'has-text-danger'
        trend_html = f'<span class="{trend_class}"><i class="fas {arrow}"></i> {trend}</span>'
    return mark_safe(f'''
<div class="yla-stat-card box">
    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
        <span class="yla-stat-icon has-text-{color}">{icon_html}</span>
        {trend_html}
    </div>
    <div class="yla-stat-value">{value}</div>
    <div class="yla-stat-title has-text-grey">{title}</div>
</div>''')


@register.simple_tag
def status_badge(active, label_true=None, label_false=None):
    """状态标签组件。active 为 True/False。"""
    if label_true is None:
        label_true = str(_('启用'))
    if label_false is None:
        label_false = str(_('禁用'))
    cls = 'yla-badge-active' if active else 'yla-badge-inactive'
    label = label_true if active else label_false
    return mark_safe(f'<span class="yla-status-badge {cls}">{label}</span>')


@register.simple_tag
def action_btn(label, url='', method='POST', confirm=None, css_class=''):
    """AJAX 操作按钮"""
    attrs = f'data-url="{url}" data-method="{method}"'
    if confirm:
        attrs += f' data-delete-confirm="{confirm}"'
    return mark_safe(f'<button class="yla-action-btn {css_class}" {attrs}>{label}</button>')


@register.simple_tag
def empty_state(icon='fa-inbox', title=None, hint=None):
    """空状态占位"""
    t = title or str(_('暂无数据'))
    h = hint or ''
    hint_html = f'<div class="yla-empty-hint has-text-grey is-size-7 mt-1">{h}</div>' if h else ''
    return mark_safe(f'''
<div class="yla-empty-state has-text-centered py-6">
    <div class="yla-empty-icon has-text-grey-lighter mb-3">
        <i class="fas {icon} fa-3x"></i>
    </div>
    <div class="yla-empty-title has-text-weight-medium">{t}</div>
    {hint_html}
</div>''')


@register.simple_tag
def confirm_link(url, label, message=None):
    """删除确认链接"""
    msg = message or str(_('确定删除？此操作不可逆。'))
    return mark_safe(
        f'<a href="{url}" data-delete-confirm="{msg}" class="yla-delete-link">{label}</a>'
    )


@register.simple_tag
def timeline(entries):
    """时间线列表组件。entries 为 list[dict]。
    每项: {'icon': 'fa-circle', 'color': 'info', 'label': '...', 'time': '...'}
    """
    items = []
    for e in entries:
        color = e.get('color', 'info')
        icon = e.get('icon', 'fa-circle')
        items.append(f'''
<div class="yla-timeline-item">
    <span class="yla-timeline-dot has-background-{color}">
        <i class="fas {icon}"></i>
    </span>
    <div class="yla-timeline-content">
        <p class="is-size-7">{e.get('label', '')}</p>
        <p class="is-size-7 has-text-grey">{e.get('time', '')}</p>
    </div>
</div>''')
    return mark_safe(f'<div class="yla-timeline">{"".join(items)}</div>')
