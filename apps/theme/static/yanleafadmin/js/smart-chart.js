/** YanLeafAdmin — SmartChart 自动图表前端 */
(function($) {
    'use strict';

    function initSmartCharts() {
        if (typeof echarts === 'undefined') return;

        $('[data-yla-chart]').each(function() {
            var $el = $(this);
            if ($el.data('yla-chart-ready')) return;
            $el.data('yla-chart-ready', true);

            var config = $el.data('yla-chart');
            var url = '/yla-api/chart/' + config.appLabel + '/' +
                      config.modelName + '/' + config.fieldName + '/';
            url += '?type=' + (config.type || '') + '&period=' + (config.period || '7d');

            var chart = echarts.init($el[0]);
            var baseOption = {
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true }
            };

            $.getJSON(url, function(data) {
                var option = $.extend(true, {}, baseOption, data);
                chart.setOption(option);
            }).fail(function() {
                $el.html('<div class="has-text-centered has-text-grey py-6">图表加载失败</div>');
            });

            // Resize on window resize
            $(window).on('resize.ylaChart', function() {
                try { chart.resize(); } catch(e) {}
            });

            // Re-render on dark mode toggle
            var observer = new MutationObserver(function() {
                try { chart.dispose(); } catch(e) {}
                chart = echarts.init($el[0]);
                $.getJSON(url, function(data) {
                    chart.setOption($.extend(true, {}, baseOption, data));
                });
            });
            observer.observe(document.documentElement, {
                attributes: true, attributeFilter: ['class']
            });
        });
    }

    $(function() { initSmartCharts(); });

    // Expose for dynamic content
    window.YLA = window.YLA || {};
    window.YLA.initSmartCharts = initSmartCharts;
})(jQuery);
