"""YanLeafAdmin — 通用 AJAX Action 视图"""
from django.apps import apps
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST
from django.contrib.admin.utils import unquote


@require_POST
def toggle_field(request, app_label, model_name, pk, field_name):
    """通用布尔字段切换。返回 JSON。"""
    model_cls = apps.get_model(app_label, model_name)
    if model_cls is None:
        return JsonResponse({'messages': [{'level': 'error', 'message': '模型不存在'}]}, status=400)

    obj = get_object_or_404(model_cls, pk=unquote(pk))
    new_val = not getattr(obj, field_name)
    setattr(obj, field_name, new_val)
    obj.save(update_fields=[field_name])

    return JsonResponse({
        'status': 'active' if new_val else 'inactive',
        'messages': [{
            'level': 'success',
            'message': f'"{obj}" 状态已更新',
            'tags': 'toast'
        }]
    })


@require_POST
def action_delete(request, app_label, model_name, pk):
    """通用 AJAX 删除视图。返回 JSON。"""
    model_cls = apps.get_model(app_label, model_name)
    if model_cls is None:
        return JsonResponse({'messages': [{'level': 'error', 'message': '模型不存在'}]}, status=400)

    obj = get_object_or_404(model_cls, pk=unquote(pk))
    obj_name = str(obj)
    obj.delete()

    return JsonResponse({
        'redirect': f'/admin/{app_label}/{model_name}/',
        'messages': [{
            'level': 'success',
            'message': f'"{obj_name}" 已删除',
            'tags': 'toast'
        }]
    })
