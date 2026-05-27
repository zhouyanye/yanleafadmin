import json
from django.http import JsonResponse
from django.contrib.admin.models import LogEntry
from django.contrib.admin.views.decorators import staff_member_required


@staff_member_required
def log_diff_api(request, log_id):
    """Return parsed diff for a LogEntry"""
    try:
        entry = LogEntry.objects.get(pk=log_id)
    except LogEntry.DoesNotExist:
        return JsonResponse({'error': '记录不存在'}, status=404)

    try:
        msg = entry.get_change_message()
        if isinstance(msg, str) and msg:
            msg = json.loads(msg)
    except Exception:
        msg = []

    changes = []
    if isinstance(msg, list):
        for item in msg:
            if 'changed' in item:
                fields = item['changed'].get('fields', [])
                for f in fields:
                    changes.append({'field': f, 'old': '', 'new': ''})
            elif 'added' in item:
                changes.append({'field': item.get('name', 'object'), 'old': '', 'new': '新增'})
            elif 'deleted' in item:
                changes.append({'field': item.get('name', 'object'), 'old': '', 'new': '删除'})

    return JsonResponse({'changes': changes})
