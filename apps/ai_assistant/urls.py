from django.urls import path
from . import views

app_name = 'ai_assistant'

urlpatterns = [
    path('query/', views.ai_query, name='ai_query'),
    path('full/', views.ai_fullpage, name='ai_fullpage'),
    path('full/<str:session_id>/', views.ai_fullpage, name='ai_fullpage_session'),
    path('history/', views.ai_history, name='ai_history'),
    path('sessions/', views.ai_sessions, name='ai_sessions'),
]
