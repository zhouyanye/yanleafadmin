"""
演示数据填充命令
用法: python manage.py seed_demo_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User


class Command(BaseCommand):
    help = '填充演示用户数据'

    def handle(self, *args, **options):
        created = 0
        users_data = [
            {'username': 'zhangsan',  'email': 'zhangsan@example.com',   'first_name': '三',     'last_name': '张', 'is_staff': True},
            {'username': 'lisi',      'email': 'lisi@example.com',       'first_name': '四',     'last_name': '李', 'is_staff': False},
            {'username': 'wangwu',    'email': 'wangwu@example.com',     'first_name': '五',     'last_name': '王', 'is_staff': False},
            {'username': 'zhaoliu',   'email': 'zhaoliu@example.com',    'first_name': '六',     'last_name': '赵', 'is_staff': False},
            {'username': 'sunqi',     'email': 'sunqi@example.com',      'first_name': '七',     'last_name': '孙', 'is_staff': False},
            {'username': 'zhouba',    'email': 'zhouba@example.com',     'first_name': '八',     'last_name': '周', 'is_staff': False},
            {'username': 'wujiu',     'email': 'wujiu@example.com',      'first_name': '九',     'last_name': '吴', 'is_staff': False},
            {'username': 'editor01',  'email': 'editor01@example.com',   'first_name': '编辑',   'last_name': '内容', 'is_staff': True},
            {'username': 'editor02',  'email': 'editor02@example.com',   'first_name': '小编',   'last_name': '运营', 'is_staff': True},
            {'username': 'viewer01',  'email': 'viewer01@example.com',   'first_name': '访客',   'last_name': '游客', 'is_staff': False},
            {'username': 'manager01', 'email': 'manager@example.com',    'first_name': '经理',   'last_name': '陈', 'is_staff': True},
            {'username': 'dev01',     'email': 'dev01@example.com',      'first_name': '开发',   'last_name': '林', 'is_staff': True},
            {'username': 'tester01',  'email': 'tester01@example.com',   'first_name': '测试',   'last_name': '黄', 'is_staff': False},
            {'username': 'inactive01','email': 'inactive@example.com',   'first_name': '禁用',   'last_name': '账户', 'is_staff': False},
            {'username': 'analyst01', 'email': 'analyst@example.com',    'first_name': '分析',   'last_name': '数据', 'is_staff': False},
        ]

        for i, data in enumerate(users_data):
            username = data['username']
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f'跳过已存在用户: {username}'))
                continue

            days_ago = (len(users_data) - i) * 3 + i * 7
            is_active = 'inactive' not in username

            user = User.objects.create_user(
                username=username,
                email=data['email'],
                password='demo123456',
                first_name=data['first_name'],
                last_name=data['last_name'],
                is_staff=data['is_staff'],
                is_active=is_active,
            )
            # 伪造注册日期使其分散
            User.objects.filter(pk=user.pk).update(
                date_joined=timezone.now() - timedelta(days=days_ago)
            )
            created += 1
            self.stdout.write(self.style.SUCCESS(f'创建用户: {username} ({data["last_name"]}{data["first_name"]})'))

        self.stdout.write(self.style.SUCCESS(f'\n完成！共创建 {created} 个演示用户。'))
        self.stdout.write(self.style.WARNING('所有演示用户密码统一为: demo123456'))
