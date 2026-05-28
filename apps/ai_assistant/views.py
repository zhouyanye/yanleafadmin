import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required
from .services import AIQueryService


@staff_member_required
def ai_fullpage(request, session_id=None):
    """Full-page AI chat view, optionally with session history"""
    from .models import AiChatSession
    title = 'AI 数据助手'
    if session_id:
        try:
            s = AiChatSession.objects.get(id=session_id, user=request.user)
            title = s.title or title
        except AiChatSession.DoesNotExist:
            pass
    return render(request, 'ai/fullpage.html', {
        'title': title,
        'session_id': session_id or '',
    })


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


@staff_member_required
def ai_history(request):
    """Chat history CRUD with session support"""
    from .models import AiChatMessage, AiChatSession
    session_id = request.GET.get('session', 'default')

    if request.method == 'GET':
        msgs = AiChatMessage.objects.filter(
            user=request.user, session=session_id
        ).order_by('created_at')[:100]
        return JsonResponse({
            'messages': [{'role': m.role, 'content': m.content} for m in msgs]
        })

    if request.method == 'POST':
        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, AttributeError):
            return JsonResponse({'error': '格式错误'}, status=400)

        # 兼容两种格式：纯列表 或 {session, title, messages}
        if isinstance(body, list):
            msg_list = body
            sid = session_id
            title = ''
        else:
            msg_list = body.get('messages', [])
            sid = body.get('session', session_id)
            title = body.get('title', '')

        # Save session
        if sid and sid != 'default':
            import django.utils.timezone
            AiChatSession.objects.update_or_create(
                id=sid, user=request.user,
                defaults={'title': title or '对话 ' + sid[:8], 'updated_at': django.utils.timezone.now()}
            )

        # Save messages
        AiChatMessage.objects.filter(user=request.user, session=sid).delete()
        for m in msg_list[-50:]:
            AiChatMessage.objects.create(
                user=request.user, session=sid,
                role=m.get('role', 'bot'), content=m.get('content', ''),
                title=title or ''
            )
        return JsonResponse({'status': 'ok', 'session': sid})

    if request.method == 'DELETE':
        AiChatMessage.objects.filter(user=request.user, session=session_id).delete()
        return JsonResponse({'status': 'ok'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@staff_member_required
def ai_sessions(request):
    """List user's chat sessions"""
    from .models import AiChatSession
    sessions = AiChatSession.objects.filter(user=request.user).order_by('-updated_at')[:20]
    return JsonResponse({
        'sessions': [{'id': s.id, 'title': s.title, 'updated': s.updated_at.isoformat()} for s in sessions]
    })
