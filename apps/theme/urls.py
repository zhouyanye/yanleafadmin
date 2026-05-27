"""YanLeafAdmin — 通用 AJAX 路由"""
from django.urls import path
from .components.actions import toggle_field, action_delete
from .components.charts import chart_data_api

app_name = 'yla_api'

urlpatterns = [
    path('toggle/<str:app_label>/<str:model_name>/<path:pk>/<str:field_name>/',
         toggle_field, name='toggle_field'),
    path('delete/<str:app_label>/<str:model_name>/<path:pk>/',
         action_delete, name='action_delete'),
    path('chart/<str:app_label>/<str:model_name>/<str:field_name>/',
         chart_data_api, name='chart_data'),
]
