/**
 * YanLeafAdmin — 穿梭框组件重写
 * 将 Django admin 原生 SelectFilter2 替换为 Bulma 极简白卡片风格
 * 支持：深色/浅色模式、实时搜索、动画过渡、i18n
 */
(function($) {
    'use strict';

    var lang = (window.YLA && window.YLA.lang === 'zh-hans') ? 'zh-hans' : 'en';

    var i18n = {
        'zh-hans': {
            available: '可选项目',
            chosen: '已选项目',
            search: '搜索…',
            choose: '添加选中',
            remove: '移除选中',
            chooseAll: '全部添加',
            removeAll: '全部移除',
            noResults: '无匹配项',
            itemSelected: '项已选'
        },
        'en': {
            available: 'Available',
            chosen: 'Chosen',
            search: 'Search…',
            choose: 'Add selected',
            remove: 'Remove selected',
            chooseAll: 'Add all',
            removeAll: 'Remove all',
            noResults: 'No results',
            itemSelected: 'selected'
        }
    };

    var t = i18n[lang] || i18n['zh-hans'];

    /* ------------------------------------------------------------
       初始化：找到所有穿梭框并转换
       ------------------------------------------------------------ */
    function initFilterWidgets() {
        $('.selector').each(function() {
            var $selector = $(this);
            // 避免重复转换
            if ($selector.data('yla-filter-ready')) return;
            $selector.data('yla-filter-ready', true);

            var $selects = $selector.find('select');
            if ($selects.length < 2) return;

            var $fromSelect = $selects.eq(0); // 可选
            var $toSelect   = $selects.eq(1); // 已选

            // 隐藏 Django 原生 UI
            $selector.find('.selector-available, .selector-chooser, .selector-chosen').hide();

            buildCardUI($selector, $fromSelect, $toSelect);
        });
    }

    /* ------------------------------------------------------------
       构建卡片 UI
       ------------------------------------------------------------ */
    function buildCardUI($container, $fromSelect, $toSelect) {
        var widgetId = 'yla-filter-' + Math.random().toString(36).substr(2, 8);

        var html = '<div class="yla-filter-widget columns is-desktop is-vcentered" id="' + widgetId + '">';

        // 左卡片 — 可选项目
        html += '<div class="column is-5">';
        html +=   '<div class="yla-filter-card box p-0">';
        html +=     '<div class="yla-filter-card-header">';
        html +=       '<span class="yla-filter-card-title">' + t.available + '</span>';
        html +=       '<span class="yla-filter-count tag is-light" data-role="from-count"></span>';
        html +=     '</div>';
        html +=     '<div class="yla-filter-search-box">';
        html +=       '<i class="fas fa-search"></i>';
        html +=       '<input type="text" class="yla-filter-search" placeholder="' + t.search + '" data-role="from-search">';
        html +=     '</div>';
        html +=     '<div class="yla-filter-list" data-role="from-list"></div>';
        html +=   '</div>';
        html += '</div>';

        // 中间按钮组
        html += '<div class="column is-2 is-narrow">';
        html +=   '<div class="yla-filter-actions">';
        html +=     '<button type="button" class="yla-filter-btn" data-action="choose" title="' + t.choose + '">';
        html +=       '<i class="fas fa-chevron-right"></i>';
        html +=     '</button>';
        html +=     '<button type="button" class="yla-filter-btn" data-action="remove" title="' + t.remove + '">';
        html +=       '<i class="fas fa-chevron-left"></i>';
        html +=     '</button>';
        html +=     '<button type="button" class="yla-filter-btn yla-filter-btn-all" data-action="choose-all" title="' + t.chooseAll + '">';
        html +=       '<i class="fas fa-angles-right"></i>';
        html +=     '</button>';
        html +=     '<button type="button" class="yla-filter-btn yla-filter-btn-all" data-action="remove-all" title="' + t.removeAll + '">';
        html +=       '<i class="fas fa-angles-left"></i>';
        html +=     '</button>';
        html +=   '</div>';
        html += '</div>';

        // 右卡片 — 已选项目
        html += '<div class="column is-5">';
        html +=   '<div class="yla-filter-card box p-0">';
        html +=     '<div class="yla-filter-card-header">';
        html +=       '<span class="yla-filter-card-title">' + t.chosen + '</span>';
        html +=       '<span class="yla-filter-count tag is-dark" data-role="to-count"></span>';
        html +=     '</div>';
        html +=     '<div class="yla-filter-search-box">';
        html +=       '<i class="fas fa-search"></i>';
        html +=       '<input type="text" class="yla-filter-search" placeholder="' + t.search + '" data-role="to-search">';
        html +=     '</div>';
        html +=     '<div class="yla-filter-list" data-role="to-list"></div>';
        html +=   '</div>';
        html += '</div>';

        html += '</div>';

        var $widget = $(html);
        $container.append($widget);

        // 填充选项
        populateCard($widget, $fromSelect, 'from');
        populateCard($widget, $toSelect, 'to');

        // 更新计数
        updateCounts($widget);

        // 绑定事件
        bindEvents($widget, $fromSelect, $toSelect);
    }

    /* ------------------------------------------------------------
       从 <select> 填充卡片列表
       ------------------------------------------------------------ */
    function populateCard($widget, $select, side) {
        var $list = $widget.find('[data-role="' + side + '-list"]');
        $select.find('option').each(function() {
            var $opt = $(this);
            var $item = $('<div class="yla-filter-item">')
                .text($opt.text())
                .data('value', $opt.val())
                .appendTo($list);

            if ($opt.is(':selected')) {
                $item.addClass('is-highlighted');
            }
        });
    }

    /* ------------------------------------------------------------
       更新计数标签
       ------------------------------------------------------------ */
    function updateCounts($widget) {
        var fromTotal = $widget.find('[data-role="from-list"] .yla-filter-item').length;
        var toTotal   = $widget.find('[data-role="to-list"] .yla-filter-item').length;
        $widget.find('[data-role="from-count"]').text(fromTotal);
        $widget.find('[data-role="to-count"]').text(toTotal);
    }

    /* ------------------------------------------------------------
       同步卡片状态到原生 <select>（用于表单提交）
       ------------------------------------------------------------ */
    function syncToSelects($widget, $fromSelect, $toSelect) {
        // 可选区：所有项都是 unselected
        var fromValues = [];
        $widget.find('[data-role="from-list"] .yla-filter-item').each(function() {
            fromValues.push($(this).data('value'));
        });
        $fromSelect.find('option').each(function() {
            $(this).prop('selected', false);
        });
        $toSelect.find('option').each(function() {
            var v = $(this).val();
            $(this).prop('selected', fromValues.indexOf(v) === -1);
        });
    }

    /* ------------------------------------------------------------
       移动项目（带动画）
       ------------------------------------------------------------ */
    function moveItems($widget, $fromSelect, $toSelect, sourceSide, targetSide, all) {
        var $sourceList = $widget.find('[data-role="' + sourceSide + '-list"]');
        var $targetList = $widget.find('[data-role="' + targetSide + '-list"]');

        var $items;
        if (all) {
            $items = $sourceList.find('.yla-filter-item');
        } else {
            $items = $sourceList.find('.yla-filter-item.is-highlighted');
        }

        if (!$items.length) return;

        $items.each(function() {
            var $item = $(this);
            // 从源移除（fadeOut 动画）
            $item.addClass('yla-filter-item-moving');
            var $clone = $item.clone();
            $item.slideUp(200, function() { $item.remove(); });

            // 添加到目标（fadeIn 动画）
            $clone.removeClass('is-highlighted yla-filter-item-moving');
            $clone.hide();
            $targetList.append($clone);
            $clone.slideDown(200);
        });

        // 延迟同步
        setTimeout(function() {
            updateCounts($widget);
            syncToSelects($widget, $fromSelect, $toSelect);
        }, 250);
    }

    /* ------------------------------------------------------------
       绑定事件
       ------------------------------------------------------------ */
    function bindEvents($widget, $fromSelect, $toSelect) {
        var $fromList = $widget.find('[data-role="from-list"]');
        var $toList   = $widget.find('[data-role="to-list"]');

        // 点击项目切换高亮
        $widget.on('click', '.yla-filter-item', function(e) {
            // 不拦截双击
            if (e.detail === 2) return;
            $(this).toggleClass('is-highlighted');
        });

        // 双击快速移动
        $widget.on('dblclick', '.yla-filter-item', function() {
            var $item = $(this);
            $item.addClass('is-highlighted');
            var side = $item.closest('[data-role]').data('role');
            if (side === 'from-list') {
                moveItems($widget, $fromSelect, $toSelect, 'from', 'to', false);
            } else {
                moveItems($widget, $fromSelect, $toSelect, 'to', 'from', false);
            }
        });

        // 按钮操作
        $widget.on('click', '[data-action]', function() {
            var action = $(this).data('action');
            switch (action) {
                case 'choose':
                    moveItems($widget, $fromSelect, $toSelect, 'from', 'to', false);
                    break;
                case 'remove':
                    moveItems($widget, $fromSelect, $toSelect, 'to', 'from', false);
                    break;
                case 'choose-all':
                    moveItems($widget, $fromSelect, $toSelect, 'from', 'to', true);
                    break;
                case 'remove-all':
                    moveItems($widget, $fromSelect, $toSelect, 'to', 'from', true);
                    break;
            }
        });

        // 实时搜索过滤
        $widget.on('input', '.yla-filter-search', function() {
            var $input = $(this);
            var side = $input.data('role'); // "from-search" or "to-search"
            var listSide = side.replace('-search', '-list'); // → "from-list" or "to-list"
            var keyword = $input.val().toLowerCase();
            var $list = $widget.find('[data-role="' + listSide + '"]');

            if (!keyword) {
                $list.find('.yla-filter-item').show();
                return;
            }

            $list.find('.yla-filter-item').each(function() {
                var text = $(this).text().toLowerCase();
                $(this).toggle(text.indexOf(keyword) !== -1);
            });
        });

        // 初始化选中状态同步
        syncToSelects($widget, $fromSelect, $toSelect);
    }

    /* ------------------------------------------------------------
       页面加载 + Django 动态行重新扫描 + 延迟重试
       ------------------------------------------------------------ */
    $(function() {
        initFilterWidgets();
        // 延迟重试（处理 Django admin JS 异步渲染的 .selector）
        setTimeout(initFilterWidgets, 300);
        setTimeout(initFilterWidgets, 900);
    });

    // 暴露全局方法
    window.YLA = window.YLA || {};
    window.YLA.initFilterWidgets = initFilterWidgets;

})(jQuery);
