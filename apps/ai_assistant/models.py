"""AI Chat History model"""
from django.db import models
from django.conf import settings


class AiChatMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.CharField(max_length=36, default='default', db_index=True)
    role = models.CharField(max_length=10)
    content = models.TextField()
    title = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'AI 聊天记录'
        verbose_name_plural = 'AI 聊天记录'
        indexes = [
            models.Index(fields=['user', 'session']),
        ]


class AiChatSession(models.Model):
    """对话会话"""
    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default='新对话')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'AI 对话会话'
        verbose_name_plural = 'AI 对话会话'
