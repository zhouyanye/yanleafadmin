from django import forms
from django.contrib.auth.forms import AuthenticationForm
from captcha.fields import CaptchaField

class YanleafAdminLoginForm(AuthenticationForm):
    """重写 Admin 登录表单，强行塞入 captcha 校验字段"""
    captcha = CaptchaField(
        label="验证码",
        error_messages={
            'invalid': '验证码输入错误，请重新输入',
            'required': '请输入验证码'
        }
    )