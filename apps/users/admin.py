from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    change_form_template = 'admin/auth/user/change_form.html'
    list_display = [
        'username', 'email', 'chinese_name',
        'is_active', 'is_staff', 'date_joined'
    ]
    list_display_links = ['username']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    list_per_page = 10

    def chinese_name(self, obj):
        if obj.last_name or obj.first_name:
            return f'{obj.last_name}{obj.first_name}'
        return '—'
    chinese_name.short_description = _('姓名')
    chinese_name.admin_order_field = 'last_name'

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('个人信息'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('权限'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('重要日期'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )

    actions = ['activate_users', 'deactivate_users']

    def _get_names(self, queryset, limit=5):
        names = list(queryset.values_list('username', flat=True)[:limit])
        total = queryset.count()
        result = '、'.join(names)
        if total > limit:
            result += ' 等 %d 人' % total
        return result

    @admin.action(description=_('激活所选用户'))
    def activate_users(self, request, queryset):
        names = self._get_names(queryset)
        updated = queryset.update(is_active=True)
        self.message_user(request, '已激活 %d 个用户：%s' % (updated, names))

    @admin.action(description=_('禁用所选用户'))
    def deactivate_users(self, request, queryset):
        names = self._get_names(queryset)
        updated = queryset.update(is_active=False)
        self.message_user(request, '已禁用 %d 个用户：%s' % (updated, names))
