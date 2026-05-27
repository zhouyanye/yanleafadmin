"""ER Diagram URL configuration"""
from django.urls import path
from . import views

app_name = 'erd_engine'

urlpatterns = [
    path('', views.er_diagram_page, name='er_page'),
    path('api/models/', views.er_model_api, name='er_model_api'),
    path('api/sql/', views.er_sql_api, name='er_sql_api'),
    path('api/word/', views.er_word_export, name='er_word_export'),
]
