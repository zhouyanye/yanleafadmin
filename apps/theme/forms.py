from django import forms
from django.contrib.auth.forms import AuthenticationForm

try:
    from captcha.fields import CaptchaField
    _has_captcha = True
except ImportError:
    _has_captcha = False
    CaptchaField = None


class YanleafAdminLoginForm(AuthenticationForm):
    """重写 Admin 登录表单，可选 captcha"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if _has_captcha and CaptchaField:
            self.fields['captcha'] = CaptchaField(
                label="验证码",
                error_messages={
                    'invalid': '验证码输入错误，请重新输入',
                    'required': '请输入验证码'
                }
            )