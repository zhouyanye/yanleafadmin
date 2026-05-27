/**
 * YanLeafAdmin — 核心交互脚本
 * (C) yanleafadmin — github.com/zhouyanye/yanleafadmin
 */
(function($) {
    'use strict';

    /* ---- A. 暗黑模式 ---- */
    var $html = $('html');
    var $icon = $('#dark-mode-icon');

    function setDarkMode(on) {
        $html.toggleClass('theme-dark', on);
        if ($icon.length) {
            $icon.attr('class', on ? 'fas fa-sun' : 'fas fa-moon');
        }
        localStorage.setItem('yla-theme', on ? 'dark' : 'light');
    }

    if ($html.hasClass('theme-dark')) {
        $icon.attr('class', 'fas fa-sun');
    }

    $('#dark-mode-toggle').on('click', function() {
        setDarkMode(!$html.hasClass('theme-dark'));
    });

    /* ---- B. Bulma Dropdown ---- */
    $(document).on('click', '.dropdown:not(.is-active) .dropdown-trigger > *', function(e) {
        e.stopPropagation();
        var $dd = $(this).closest('.dropdown');
        $('.dropdown.is-active').not($dd).removeClass('is-active');
        $dd.toggleClass('is-active');
    });
    $(document).on('click', function() {
        $('.dropdown.is-active').removeClass('is-active');
    });

    /* ---- C. 移动端侧边栏 ---- */
    var $sidebar = $('#yanleaf-sidebar');
    var $overlay = $('#sidebar-overlay');

    function closeSidebar() {
        $sidebar.removeClass('is-open');
        $overlay.removeClass('is-visible');
    }
    function openSidebar() {
        $sidebar.addClass('is-open');
        $overlay.addClass('is-visible');
    }

    $('#sidebar-toggle').on('click', function() {
        $sidebar.hasClass('is-open') ? closeSidebar() : openSidebar();
    });
    $overlay.on('click', closeSidebar);

    /* ---- D. DataTables 工厂 & 页面辅助 ---- */
    window.YLA = window.YLA || {};

    window.YLA.changePageSize = function(n) {
        var url = new URL(window.location.href);
        if (n === '0') {
            url.searchParams.set('all', '1');
            url.searchParams.delete('per_page');
        } else {
            url.searchParams.set('per_page', n);
            url.searchParams.delete('all');
        }
        url.searchParams.delete('p');
        window.location.href = url.toString();
    };

    window.YLA.initDataTable = function(tableSelector, options) {
        var langCode = window.YLA.lang || 'zh-hans';
        var langUrl = '/static/yanleafadmin/js/i18n/datatables.' + langCode + '.json';
        var defaults = {
            language: { url: langUrl },
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, '全部']],
            dom: "<'is-flex is-justify-content-space-between is-align-items-center mb-3'Bf>rt<'is-flex is-justify-content-space-between is-align-items-center mt-3'lip>",
            buttons: [
                { extend: 'copy', text: '复制' },
                { extend: 'excel', text: 'Excel' },
                { extend: 'csv', text: 'CSV' },
                { extend: 'print', text: '打印' }
            ]
        };
        return $(tableSelector).DataTable($.extend(true, {}, defaults, options || {}));
    };

    /* ---- E. SweetAlert2 消息处理 ---- */
    function showSwalMessage(level, message, tags) {
        var cleanMessage = $('<span>').html(message).text();
        var isError = (level === 'error' || level === 'danger');
        var isToast = (tags && tags.indexOf('toast') !== -1) || !isError;

        if (isToast) {
            var typeClass = 'toast-info';
            var fasIcon = 'fa-circle-info';
            if (level === 'success') { typeClass = 'toast-success'; fasIcon = 'fa-circle-check'; }
            else if (isError)    { typeClass = 'toast-error';   fasIcon = 'fa-circle-xmark'; }
            else if (level === 'warning') { typeClass = 'toast-warning'; fasIcon = 'fa-triangle-exclamation'; }

            var $toast = $(
                '<div class="yla-toast ' + typeClass + '">' +
                    '<i class="fas ' + fasIcon + ' toast-icon"></i>' +
                    '<span>' + cleanMessage + '</span>' +
                '</div>');
            $('#yla-toast-container').append($toast);
            setTimeout(function() {
                $toast.addClass('yla-toast-out');
                setTimeout(function() { $toast.remove(); }, 260);
            }, isError ? 5000 : 3000);
        } else {
            Swal.fire({
                icon: 'error',
                title: cleanMessage.length > 40 ? cleanMessage.substring(0,40) + '…' : cleanMessage,
                text: cleanMessage.length > 40 ? cleanMessage : '',
                width: '360px',
                confirmButtonText: '确定',
                customClass: {
                    popup: 'yla-swal-popup yla-swal-sm',
                    title: 'yla-swal-title',
                    confirmButton: 'yla-swal-confirm-btn'
                }
            });
        }
    }

    // 页面加载时处理 Django Messages
    $(function() {
        var $msgData = $('#django-messages');
        if ($msgData.length) {
            try {
                var messages = JSON.parse($msgData.text());
                messages.forEach(function(msg) {
                    showSwalMessage(msg.level, msg.message, msg.tags);
                });
                $msgData.remove();
            } catch(e) {}
        }
    });

    /* ---- F. AJAX 全局拦截器 ---- */
    $(document).ajaxSuccess(function(event, xhr, settings) {
        if (settings.dataType === 'script' || settings.dataType === 'jsonp') return;
        try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.messages && Array.isArray(data.messages)) {
                data.messages.forEach(function(msg) {
                    showSwalMessage(msg.level || 'info', msg.message, msg.tags || '');
                });
            }
        } catch(e) {}
    });

    /* ---- G. 删除确认拦截 ---- */
    $(document).on('click', '[data-delete-confirm]', function(e) {
        e.preventDefault();
        var $el = $(this);
        var message = $el.data('delete-confirm') || '您确定要删除吗？此操作不可逆。';
        var url = $el.attr('href') || $el.data('url') || '';
        var method = $el.data('method') || 'POST';
        var redirect = $el.data('redirect') || '';

        Swal.fire({
            title: '确认删除',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            reverseButtons: true,
            customClass: {
                popup: 'yla-swal-popup',
                title: 'yla-swal-title',
                confirmButton: 'yla-swal-confirm-btn',
                cancelButton: 'yla-swal-cancel-btn'
            }
        }).then(function(result) {
            if (!result.isConfirmed) return;

            if (url && method.toUpperCase() === 'GET') {
                window.location.href = url;
                return;
            }

            $.ajax({
                url: url,
                type: method,
                headers: { 'X-CSRFToken': window.YLA.csrfToken || '' },
                success: function(resp) {
                    if (resp && resp.messages) {
                        resp.messages.forEach(function(m) {
                            showSwalMessage(m.level || 'success', m.message, m.tags || '');
                        });
                    } else {
                        showSwalMessage('success', '删除成功', 'toast');
                    }
                    if (redirect) {
                        setTimeout(function() { window.location.href = redirect; }, 800);
                    } else if ($.fn.DataTable && $.fn.DataTable.isDataTable('.dataTable')) {
                        $('.dataTable').DataTable().ajax.reload(null, false);
                    } else {
                        setTimeout(function() { window.location.reload(); }, 800);
                    }
                },
                error: function(xhr) {
                    var errMsg = '删除失败，请稍后再试';
                    try {
                        var errData = JSON.parse(xhr.responseText);
                        if (errData.message) errMsg = errData.message;
                    } catch(e) {}
                    showSwalMessage('error', errMsg);
                }
            });
        });
    });

    /* ---- H. 状态切换 ---- */
    $(document).on('click', '[data-ajax-toggle]', function(e) {
        e.preventDefault();
        var $el = $(this);
        var url = $el.data('ajax-toggle');
        var method = $el.data('method') || 'POST';

        $.ajax({
            url: url,
            type: method,
            headers: { 'X-CSRFToken': window.YLA.csrfToken || '' },
            success: function(resp) {
                if (resp && resp.messages) {
                    resp.messages.forEach(function(m) {
                        showSwalMessage(m.level || 'success', m.message, m.tags || 'toast');
                    });
                }
                if (resp && resp.status) {
                    $el.toggleClass('is-active', resp.status === 'active')
                       .toggleClass('is-inactive', resp.status !== 'active')
                       .text(resp.status === 'active' ? ($el.data('active-text') || '启用') : ($el.data('inactive-text') || '禁用'));
                }
            },
            error: function() {
                showSwalMessage('error', '操作失败');
            }
        });
    });

    /* ---- I. CSRF Token ---- */
    window.YLA.csrfToken = (function() {
        var cookie = document.cookie.match(/csrftoken=([\w-]+)/);
        return cookie ? cookie[1] : '';
    })();

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader('X-CSRFToken', window.YLA.csrfToken);
            }
        }
    });

    /* ---- J. 内联表格动态行 ---- */
    var inlineAddObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            $(mutation.addedNodes).each(function() {
                var $node = $(this);
                if ($node.is('.form-row') && !$node.is('.empty-form')) {
                    $node.addClass('dynamic-inline-add-row');
                    setTimeout(function() {
                        if (window.YLA && window.YLA.initFilterWidgets) {
                            window.YLA.initFilterWidgets();
                        }
                        $node.find('select.yla-enhanced').select2({
                            dropdownAutoWidth: true,
                            width: '100%'
                        });
                    }, 50);
                }
            });
        });
    });

    $(function() {
        $('.inline-group').each(function() {
            var tbody = this.querySelector('tbody');
            if (tbody) {
                inlineAddObserver.observe(tbody, { childList: true, subtree: false });
            }
        });
    });

})(jQuery);
