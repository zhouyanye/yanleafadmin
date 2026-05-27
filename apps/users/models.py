from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    自定义用户模型，继承自 Django 内置的 AbstractUser。
    未来可以在这里添加扩展字段，例如：
    bio = models.TextField(blank=True, verbose_name="个人简介")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="头像")
    """
    
    # 修改用户名为邮箱登录（可选，如果需要的话）或者保持现状
    # 这里保持现状，但预留了扩展空间
    
    class Meta:
        verbose_name = "用户"
        verbose_name_plural = "用户"
        db_table = "auth_user"  # 指定表名，方便直接 SQL 查询