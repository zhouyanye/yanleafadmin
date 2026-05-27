/**
 * YanLeafAdmin — 密码强度实时校验
 */
(function() {
    var pw = document.querySelector('#id_password1') || document.querySelector('#id_new_password1');
    if (!pw) return;
    var rules = document.querySelectorAll('.pwd-checklist li[data-rule]');
    if (!rules.length) return;
    pw.addEventListener('input', function() {
        var v = this.value || '';
        rules.forEach(function(li) {
            var r = li.dataset.rule;
            var ok = false;
            if (r === 'len') ok = v.length >= 8;
            else if (r === 'alpha') ok = /[a-zA-Z]/.test(v);
            else if (r === 'digit') ok = /\d/.test(v);
            else if (r === 'special') ok = /[^a-zA-Z0-9]/.test(v) || /[A-Z]/.test(v);
            li.className = v ? (ok ? 'pass' : 'fail') : 'pending';
        });
    });
})();
