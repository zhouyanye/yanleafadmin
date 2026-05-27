from django.urls import path
from . import views

app_name = 'ai_assistant'

urlpatterns = [
    path('query/', views.ai_query, name='ai_query'),
    path('full/', views.ai_fullpage, name='ai_fullpage'),
]
