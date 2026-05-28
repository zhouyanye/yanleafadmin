"""YanLeafAdmin — 极简白色现代 Django Admin 主题"""
from setuptools import setup, find_packages

setup(
    name='yanleafadmin',
    version='2.0.7',
    description='极简白色现代 Django Admin 主题体系 — 基于 Django + Bulma CSS',
    long_description=open('README.md', encoding='utf-8').read() if __import__('os').path.exists('README.md') else '',
    long_description_content_type='text/markdown',
    author='zhouyanye',
    url='https://github.com/zhouyanye/yanleafadmin',
    packages=find_packages(include=['apps', 'apps.*', 'yanleafadmin']),
    include_package_data=True,
    python_requires='>=3.10',
    install_requires=[
        'Django>=5.0',
        'django-simple-captcha>=0.5',
        'requests>=2.28',
        'sqlparse>=0.4',
        'psutil>=5.9',
    ],
    extras_require={
        'word': ['python-docx>=1.0'],
        'ai': ['requests>=2.28'],
    },
    classifiers=[
        'Framework :: Django',
        'Framework :: Django :: 5.0',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
)
