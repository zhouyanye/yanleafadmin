/**
 * YanLeafAdmin — 用户编辑页密码字段美化
 * 将 ReadOnlyPasswordHashWidget 的算法文本替换为干净徽章
 */
(function() {
    var pwDiv = document.querySelector('#id_password');
    if (!pwDiv) return;

    var text = pwDiv.textContent || '';
    var algo = 'PBKDF2';
    if (text.indexOf('bcrypt') !== -1) algo = 'BCrypt';
    else if (text.indexOf('argon2') !== -1) algo = 'Argon2';

    var pwLink = pwDiv.querySelector('a');
    var linkHref = pwLink ? pwLink.getAttribute('href') : '../password/';
    var linkText = pwLink ? (pwLink.textContent.trim() || '修改密码') : '修改密码';

    pwDiv.innerHTML =
        '<div class="pwd-display">' +
            '<div class="pwd-display-badge"><i class="fas fa-shield-alt"></i> 已使用 <strong>' + algo + '</strong> 加密存储</div>' +
            '<a href="' + linkHref + '" class="pwd-display-link"><i class="fas fa-key"></i> ' + linkText + '</a>' +
        '</div>';
})();
