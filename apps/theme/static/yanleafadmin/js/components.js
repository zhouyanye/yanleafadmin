/** YanLeafAdmin — 组件自动初始化 */
(function($) {
    'use strict';

    $(function() {
        // Wrap empty-state in box if not already wrapped
        $('.yla-empty-state').each(function() {
            var $es = $(this);
            if (!$es.parent().hasClass('box') && !$es.parent().parent().hasClass('box')) {
                $es.wrap('<div class="box"></div>');
            }
        });
    });
})(jQuery);
