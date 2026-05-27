/**
 * YanLeafAdmin — AI 助手 (悬浮聊天机器人)
 * 极简白配色，匹配 YanLeafAdmin 主题
 */
(function($) {
    'use strict';
    // 全屏页面不显示悬浮按钮
    if (window.location.pathname.indexOf('/ai/full') !== -1) return;
    // 配置开关
    if (typeof window.YLA !== 'undefined' && window.YLA.aiEnabled === false) return;
    if ($('#yla-ai-widget').length) return;

    function loadCfg() { try { return JSON.parse(localStorage.getItem('yla_ai_config') || '{}'); } catch(e) { return {}; } }
    function saveCfg(c) { localStorage.setItem('yla_ai_config', JSON.stringify(c)); }

    var T = '#485fc7'; // YanLeafAdmin 主题色

    var html = '' +
    '<div id="yla-ai-widget">' +
    '  <button class="yla-ai-float" id="yla-ai-float" title="AI 助手"><i class="fas fa-robot"></i></button>' +

    // ── 聊天面板 ──
    '  <div class="yla-ai-panel" id="yla-ai-panel" style="display:none">' +
    '    <div class="yla-ai-panel-hd">' +
    '      <span><i class="fas fa-robot"></i> AI 数据助手</span>' +
    '      <span style="display:flex;gap:2px;">' +
    '        <button class="yla-ai-hd-btn" id="yla-ai-config" title="设置"><i class="fas fa-cog"></i></button>' +
    '        <button class="yla-ai-hd-btn" id="yla-ai-expand" title="新窗口打开"><i class="fas fa-external-link-alt"></i></button>' +
    '        <button class="yla-ai-hd-btn" id="yla-ai-clear-chat" title="清空对话"><i class="fas fa-trash-alt"></i></button>' +
    '        <button class="yla-ai-hd-btn" id="yla-ai-min" title="关闭"><i class="fas fa-times"></i></button>' +
    '      </span></div>' +
    '    <div class="yla-ai-body" id="yla-ai-body">' +
    '      <div class="yla-ai-msg ai-bot"><div class="yla-ai-bubble"><b>你好！</b> 我是你的数据库 AI 助手。<br><br>试试问我：<br>• "最近 7 天新增了多少用户？"<br>• "每个组有多少用户？"<br>• "活跃用户占比是多少？"<br><br>首次使用请点右上角 ⚙ 配置 API Key。</div></div>' +
    '    </div>' +
    '    <div class="yla-ai-input-row">' +
    '      <input type="text" id="yla-ai-input" placeholder="输入问题，按 Enter 发送…" autocomplete="nope" name="yla_ai_q_' + Date.now() + '" />' +
    '      <button id="yla-ai-send"><i class="fas fa-paper-plane"></i></button>' +
    '    </div></div>' +

    // ── 设置面板 ──
    '  <div class="yla-ai-panel" id="yla-ai-settings" style="display:none">' +
    '    <div class="yla-ai-panel-hd">' +
    '      <span><i class="fas fa-cog"></i> 设置</span>' +
    '      <button class="yla-ai-hd-btn" id="yla-ai-settings-back"><i class="fas fa-arrow-left"></i></button>' +
    '    </div>' +
    '    <div class="yla-ai-settings-body">' +
    '      <div class="yla-ai-field"><label>API Key</label>' +
    '        <input id="yla-ai-cfg-key" type="password" placeholder="sk-xxxxxxxxxxxxxxxx" autocomplete="new-password" name="yla-ai-apikey" /></div>' +
    '      <div class="yla-ai-field"><label>Base URL</label>' +
    '        <input id="yla-ai-cfg-url" placeholder="https://api.deepseek.com/v1" autocomplete="nope" name="yla-ai-url" /></div>' +
    '      <div class="yla-ai-field"><label>模型</label>' +
    '        <select id="yla-ai-cfg-model">' +
    '          <option value="deepseek-chat">DeepSeek Chat（推荐）</option>' +
    '          <option value="deepseek-reasoner">DeepSeek Reasoner</option>' +
    '          <option value="gpt-4o">GPT-4o</option>' +
    '          <option value="gpt-4o-mini">GPT-4o Mini</option>' +
    '          <option value="qwen-plus">通义千问 Plus</option>' +
    '          <option value="__custom__">自定义…</option></select>' +
    '        <input id="yla-ai-cfg-model-custom" style="display:none;margin-top:6px" placeholder="输入模型名称" /></div>' +
    '      <button id="yla-ai-save-cfg">保存配置</button>' +
    '      <p style="font-size:0.7rem;color:var(--yla-text-muted,#999);margin-top:6px;text-align:center">配置仅保存在浏览器，不上传服务器</p>' +
    '    </div></div>' +
    '</div>';

    var css = '' +
    // 浮动按钮
    '#yla-ai-widget { position:fixed;right:20px;bottom:20px;z-index:9998;font-family:inherit }' +
    '.yla-ai-float { width:48px;height:48px;border-radius:50%;background:#485fc7;color:#fff;border:none;font-size:1.15rem;cursor:pointer;box-shadow:0 2px 12px rgba(72,95,199,.25);transition:all .2s;display:flex;align-items:center;justify-content:center }' +
    '.yla-ai-float:hover { transform:scale(1.06);box-shadow:0 4px 20px rgba(72,95,199,.35) }' +
    // 面板
    '.yla-ai-panel { position:absolute;right:0;bottom:56px;width:400px;max-height:540px;background:var(--yla-bg-card,#fff);border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.12);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--yla-border,#e5e5e5) }' +
    '.yla-ai-panel-hd { display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#485fc7;color:#fff;font-size:.85rem;font-weight:600;flex-shrink:0 }' +
    '.yla-ai-hd-btn { background:none;border:none;color:rgba(255,255,255,.8);cursor:pointer;font-size:.8rem;padding:3px 6px;border-radius:4px;transition:all .12s }' +
    '.yla-ai-hd-btn:hover { color:#fff;background:rgba(255,255,255,.15) }' +
    // 消息区
    '.yla-ai-body { flex:1;overflow-y:auto;padding:12px;min-height:120px;max-height:380px;scroll-behavior:smooth }' +
    '.yla-ai-msg { display:flex;margin-bottom:12px }' +
    '.ai-user { justify-content:flex-end }' +
    '.yla-ai-bubble { max-width:88%;padding:10px 14px;border-radius:14px;font-size:.82rem;line-height:1.55;animation:aiFade .25s;word-break:break-word;box-shadow:0 1px 2px rgba(0,0,0,.03) }' +
    '.ai-bot .yla-ai-bubble { background:var(--yla-bg-hover,#f8f9fa);color:var(--yla-text-primary,#333);border-bottom-left-radius:4px }' +
    '.ai-user .yla-ai-bubble { background:#485fc7;color:#fff;border-bottom-right-radius:4px }' +
    '@keyframes aiFade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }' +
    '.yla-ai-bubble b { color:#485fc7 } .ai-user .yla-ai-bubble b { color:#fff }' +
    '.ai-stat-val { font-size:1.8rem;font-weight:700;color:#485fc7;display:block;margin-top:4px }' +
    '.ai-gen-label { display:inline-block;font-size:.6rem;color:var(--yla-text-muted,#999);border:1px solid var(--yla-border,#ddd);padding:1px 5px;border-radius:3px;margin-left:6px;vertical-align:middle;opacity:.7 }' +
    // 输入区
    '.yla-ai-input-row { display:flex;align-items:center;gap:8px;padding:8px 14px;border-top:1px solid var(--yla-border,#eee);flex-shrink:0 }' +
    '#yla-ai-input { flex:1;border:none;outline:none;font-size:.85rem;padding:8px 0;background:transparent;color:var(--yla-text-primary) }' +
    '#yla-ai-input::placeholder { color:var(--yla-text-muted,#aaa) }' +
    '#yla-ai-send { border:none;background:#485fc7;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:.8rem;flex-shrink:0;transition:opacity .15s;display:flex;align-items:center;justify-content:center }' +
    '#yla-ai-send:hover { opacity:.85 }' +
    // 图表
    '.yla-ai-chart-inline { width:100%;height:200px;margin-top:6px }' +
    // 打字动画
    '.yla-ai-typing { padding:8px 14px;display:flex;align-items:center;gap:5px }' +
    '.yla-ai-typing span { width:6px;height:6px;border-radius:50%;background:#bbb;animation:aiBounce 1.4s infinite;display:inline-block }' +
    '.yla-ai-typing span:nth-child(2) { animation-delay:.2s } .yla-ai-typing span:nth-child(3) { animation-delay:.4s }' +
    '@keyframes aiBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }' +
    // 设置面板
    '.yla-ai-settings-body { padding:16px;overflow-y:auto;max-height:400px }' +
    '.yla-ai-field { margin-bottom:12px }' +
    '.yla-ai-field label { display:block;margin-bottom:3px;font-size:.75rem;font-weight:600;color:var(--yla-text-secondary,#555) }' +
    '.yla-ai-field input,.yla-ai-field select { width:100%;padding:8px 10px;font-size:.8rem;border:1px solid var(--yla-border,#ddd);border-radius:6px;box-sizing:border-box;background:var(--yla-bg-input,#fafafa);color:var(--yla-text-primary,#333);transition:border-color .15s }' +
    '.yla-ai-field input:focus,.yla-ai-field select:focus { outline:none;border-color:#485fc7;box-shadow:0 0 0 2px rgba(72,95,199,.1) }' +
    '#yla-ai-save-cfg { width:100%;padding:9px;border:none;border-radius:8px;background:#485fc7;color:#fff;font-size:.82rem;font-weight:600;cursor:pointer;transition:opacity .15s }' +
    '#yla-ai-save-cfg:hover { opacity:.9 }' +
    // 暗黑模式
    '.theme-dark .yla-ai-panel { background:#1e1e2e;border-color:#333 }' +
    '.theme-dark .ai-bot .yla-ai-bubble { background:#2a2a3a;color:#ddd }' +
    '.theme-dark .ai-bot .yla-ai-bubble b { color:#8ea4ff }' +
    '.theme-dark #yla-ai-input { color:#ddd }' +
    '.theme-dark .yla-ai-input-row { border-color:#333 }' +
    '.theme-dark .yla-ai-field input,.theme-dark .yla-ai-field select { background:#2a2a3a;border-color:#444;color:#ddd }' +
    '.theme-dark .ai-stat-val { color:#8ea4ff }';

    $('body').append(html);
    $('<style>').text(css).appendTo('head');

    // ── 逻辑 ──
    var $float = $('#yla-ai-float');
    var $panel = $('#yla-ai-panel');
    var $settings = $('#yla-ai-settings');
    var $body = $('#yla-ai-body');
    var $input = $('#yla-ai-input');

    function openPanel() { $panel.show(); $settings.hide(); $input.focus(); }
    function closePanel() { $panel.hide(); $settings.hide(); }

    $float.on('click', function() {
        if ($panel.is(':visible')) { closePanel(); return; }
        $panel.show(); $settings.hide();
        // 始终尝试恢复历史（仅当只有欢迎消息时替换）
        var msgs = $body.find('.yla-ai-msg');
        if (msgs.length <= 1) loadHistory();
        $input.focus();
    });
    $('#yla-ai-min').on('click', closePanel);
    $('#yla-ai-config').on('click', function() { $panel.hide(); $settings.show(); loadCfgForm(); });
    $('#yla-ai-settings-back').on('click', function() { $settings.hide(); $panel.show(); $input.focus(); });
    // 新窗口展开
    $('#yla-ai-expand').on('click', function() {
        window.open('/api/ai/full/', '_blank');
    });

    $('#yla-ai-clear-chat').on('click', function() {
        $body.find('.yla-ai-msg').remove();
        $body.append('<div class="yla-ai-msg ai-bot"><div class="yla-ai-bubble">对话已清空。<br><br>你可以继续问我数据问题，比如：<br>• "最近 7 天新增了多少用户？"<br>• "每个组有多少用户？"<br>• "活跃用户占比是多少？"</div></div>');
        $body.scrollTop($body[0].scrollHeight);
    });

    function loadCfgForm() {
        var c = loadCfg();
        $('#yla-ai-cfg-key').val(c.api_key || '');
        $('#yla-ai-cfg-url').val(c.api_base || '');
        var known = ['deepseek-chat','deepseek-reasoner','gpt-4o','gpt-4o-mini','qwen-plus'];
        if (c.model && known.indexOf(c.model) === -1) {
            $('#yla-ai-cfg-model').val('__custom__');
            $('#yla-ai-cfg-model-custom').val(c.model).show();
        } else {
            $('#yla-ai-cfg-model').val(c.model || 'deepseek-chat');
            $('#yla-ai-cfg-model-custom').hide();
        }
    }
    $('#yla-ai-cfg-model').on('change', function() {
        $('#yla-ai-cfg-model-custom').toggle($(this).val() === '__custom__');
    });
    $('#yla-ai-save-cfg').on('click', function() {
        var m = $('#yla-ai-cfg-model').val();
        if (m === '__custom__') m = $('#yla-ai-cfg-model-custom').val().trim() || 'deepseek-chat';
        saveCfg({ api_key: $('#yla-ai-cfg-key').val().trim(), api_base: $('#yla-ai-cfg-url').val().trim().replace(/\/+$/, ''), model: m });
        $settings.hide(); $panel.show(); $input.focus();
        addMsg('bot', '配置已保存！现在可以问我数据问题了。');
    });

    function addMsg(type, html) {
        var cls = type === 'user' ? 'ai-user' : 'ai-bot';
        var label = type === 'bot' ? '<span class="ai-gen-label">AI 生成</span>' : '';
        $body.append('<div class="yla-ai-msg ' + cls + '"><div class="yla-ai-bubble">' + html + label + '</div></div>');
        $body.scrollTop($body[0].scrollHeight);
        saveHistory();
    }
    function addTyping() {
        var $t = $('<div class="yla-ai-msg ai-bot"><div class="yla-ai-typing"><span></span><span></span><span></span></div></div>');
        $body.append($t); $body.scrollTop($body[0].scrollHeight);
        return $t;
    }
    function send() {
        var q = $input.val().trim();
        if (!q) return;
        var cfg = loadCfg();
        addMsg('user', q); $input.val('');
        var $t = addTyping();
        $.ajax({
            url: '/api/ai/query/', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ question: q, api_key: cfg.api_key || '', api_base: cfg.api_base || '', model: cfg.model || '' }),
            headers: { 'X-CSRFToken': window.YLA.csrfToken || '' },
            success: function(d) { $t.remove(); d.error ? addMsg('bot', '❌ ' + d.error) : showResult(d); },
            error: function(x) { $t.remove(); var m = '请求失败'; try { m = JSON.parse(x.responseText).error || m; } catch(e) {} addMsg('bot', '❌ ' + m); }
        });
    }
    $('#yla-ai-send').on('click', send);
    $input.on('keydown', function(e) { if (e.key === 'Enter') send(); });

    function showResult(d) {
        var h = '<b>' + (d.title || '查询结果') + '</b><br/>';
        if (d.chart === 'stat') {
            addMsg('bot', h + '<span class="ai-stat-val">' + (typeof d.result === 'number' ? d.result.toLocaleString() : d.result) + '</span>');
        } else if (d.chartData && d.chartData.length) {
            var cid = 'aic-' + Date.now();
            addMsg('bot', h + '<div class="yla-ai-chart-inline" id="' + cid + '"></div>');
            setTimeout(function() {
                var el = document.getElementById(cid); if (!el) return;
                var c = echarts.init(el);
                var dark = document.documentElement.classList.contains('theme-dark');
                var opt = { tooltip: { trigger: d.chart === 'pie' ? 'item' : 'axis' } };
                if (d.chart === 'pie') {
                    opt.series = [{ type: 'pie', radius: ['35%','65%'], data: d.chartData.map(function(x) { return { name: x.label, value: x.value }; }), label: { fontSize: 10, color: dark ? '#aaa' : '#555' } }];
                } else {
                    opt.xAxis = { type: 'category', data: d.chartData.map(function(x) { return x.label; }), axisLabel: { fontSize: 9, color: dark ? '#aaa' : '#555' } };
                    opt.yAxis = { type: 'value', axisLabel: { fontSize: 9, color: dark ? '#aaa' : '#555' } };
                    opt.series = [{ type: d.chart === 'bar' ? 'bar' : 'line', smooth: d.chart !== 'bar', data: d.chartData.map(function(x) { return x.value; }) }];
                    if (d.chart === 'trend') { opt.series[0].areaStyle = { opacity: .08 }; opt.series[0].lineStyle = { width: 2, color: '#485fc7' }; opt.series[0].itemStyle = { color: '#485fc7' }; }
                }
                c.setOption(opt);
            }, 200);
        } else {
            addMsg('bot', h + '<span style="font-size:.78rem">' + JSON.stringify(d.result).substring(0, 200) + '</span>');
        }
    }

    function saveHistory() {
        var msgs = [];
        $('#yla-ai-body .yla-ai-msg').each(function() {
            var type = $(this).hasClass('ai-user') ? 'user' : 'bot';
            var html = $(this).find('.yla-ai-bubble').html();
            msgs.push({ type: type, html: html });
        });
        // Keep only last 50 messages
        if (msgs.length > 50) msgs = msgs.slice(-50);
        try { localStorage.setItem('yla_ai_history', JSON.stringify(msgs)); } catch(e) {}
    }

    function loadHistory() {
        try {
            var msgs = JSON.parse(localStorage.getItem('yla_ai_history') || '[]');
            if (msgs.length) {
                $('#yla-ai-body').empty();
                msgs.forEach(function(m) { addMsgSilent(m.type, m.html); });
                $body.scrollTop($body[0].scrollHeight);
            }
        } catch(e) {}
    }

    function addMsgSilent(type, html) {
        var cls = type === 'user' ? 'ai-user' : 'ai-bot';
        $body.append('<div class="yla-ai-msg ' + cls + '"><div class="yla-ai-bubble">' + html + '</div></div>');
    }
})(jQuery);
