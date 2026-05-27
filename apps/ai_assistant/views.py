import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required
from .services import AIQueryService


@staff_member_required
def ai_fullpage(request):
    """Full-page AI chat view"""
    return render(request, 'ai/fullpage.html', {'title': 'AI 数据助手'})


@staff_member_required
@require_POST
def ai_query(request):
    """AI natural language query endpoint"""
    try:
        body = json.loads(request.body)
        question = body.get('question', '').strip()
        api_key = body.get('api_key', '') or None
        model = body.get('model', '') or None
        api_base = body.get('api_base', '') or None
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'error': '请求格式不正确'}, status=400)

    if not question:
        return JsonResponse({'error': '请输入问题'}, status=400)
    if len(question) > 500:
        return JsonResponse({'error': '问题过长（最多500字）'}, status=400)

    service = AIQueryService()
    try:
        result = service.query(question, api_key_override=api_key, model_override=model, api_base_override=api_base)
        return JsonResponse(result)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'AI 调用失败: {str(e)}'}, status=500)
