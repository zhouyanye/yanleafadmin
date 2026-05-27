/**
 * YanLeafAdmin — 登录页脚本
 */
(function($) {
    'use strict';

    // 暗黑模式
    var $html = $('html');
    var $icon = $('#login-dark-icon');

    if ($html.hasClass('theme-dark')) {
        $icon.attr('class', 'fas fa-sun');
    }

    $('#login-dark-toggle').on('click', function() {
        var isDark = !$html.hasClass('theme-dark');
        $html.toggleClass('theme-dark', isDark);
        $icon.attr('class', isDark ? 'fas fa-sun' : 'fas fa-moon');
        localStorage.setItem('yla-theme', isDark ? 'dark' : 'light');
    });

    // 验证码刷新
    $(document).on('click', 'img.captcha', function() {
        var $img = $(this);
        $.ajax({
            url: '/captcha/refresh/',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            dataType: 'json',
            success: function(data) {
                var newImgUrl = data.new_cptch_image || data.image_url;
                var newKey = data.new_cptch_key || data.key;
                if (newImgUrl) $img.attr('src', newImgUrl);
                var $hidden = $('input[name="captcha_0"]');
                if ($hidden.length && newKey) $hidden.val(newKey);
            }
        });
    });

    // 表单错误弹窗
    $(function() {
        // Captcha input beautify
        $('.captcha-field-wrapper #id_captcha_1').addClass('yla-captcha-input');

        var $nonField = $('#login-non-field-errors');
        if ($nonField.length) {
            try {
                var errors = JSON.parse($nonField.text());
                if (errors.length) {
                    Swal.fire({
                        icon: 'error',
                        text: errors.join('；'),
                        confirmButtonText: '确定',
                        customClass: {
                            popup: 'yla-swal-popup',
                            confirmButton: 'yla-swal-confirm-btn'
                        }
                    });
                }
            } catch(e) {}
        }

        var $fieldFlag = $('#login-field-errors-flag');
        if ($fieldFlag.length) {
            Swal.fire({
                icon: 'warning',
                text: '请检查以下输入框内的错误提示。',
                confirmButtonText: '确定',
                customClass: {
                    popup: 'yla-swal-popup',
                    confirmButton: 'yla-swal-confirm-btn'
                }
            });
        }
    });

})(jQuery);
