/**
 * YanLeafAdmin — ER 图渲染 (GoJS)
 * 黑白经典风格：矩形表名+椭圆字段+菱形关系
 */
(function($) {
    'use strict';

    var myDiagram = null;
    var currentData = null;

    /* ---- 初始化 (完全照搬 sql_to_er.html 已验证逻辑) ---- */
    function initDiagram() {
        var go = window.GoJS || window.go;
        if (!go) return;

        if (myDiagram) {
            myDiagram.div = null;
            myDiagram = null;
        }

        var $ = go.GraphObject.make;

        // 不设 layout，避免空数据时布局报错
        myDiagram = $(go.Diagram, 'gojsContainer', {
            initialContentAlignment: go.Spot.Center,
            'undoManager.isEnabled': true,
            'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
            padding: 10
        });

        myDiagram.nodeTemplateMap.add('Entity',
            $(go.Node, 'Auto', {
                locationSpot: go.Spot.Center,
                selectionAdorned: false,
                isShadowed: true,
                shadowOffset: new go.Point(2, 2),
                shadowColor: '#ddd'
            },
                $(go.Shape, 'Rectangle', { fill: 'white', stroke: 'black', strokeWidth: 2 }),
                $(go.TextBlock, {
                    margin: 10, font: 'bold 14px sans-serif', stroke: 'black', editable: true
                }, new go.Binding('text', 'label').makeTwoWay()),
                {
                    toolTip: $('ToolTip',
                        $(go.TextBlock, { margin: 4 }, new go.Binding('text', 'comment'))
                    )
                }
            )
        );

        myDiagram.nodeTemplateMap.add('Attribute',
            $(go.Node, 'Auto', {
                locationSpot: go.Spot.Center, selectionAdorned: false
            },
                $(go.Shape, 'Ellipse', { fill: 'white', stroke: 'black', strokeWidth: 1 }),
                $(go.TextBlock, {
                    margin: 6, font: '12px sans-serif', stroke: 'black', editable: true
                },
                    new go.Binding('text', 'label').makeTwoWay(),
                    new go.Binding('isUnderline', 'is_primary')
                ),
                {
                    toolTip: $('ToolTip',
                        $(go.TextBlock, { margin: 4 },
                            new go.Binding('text', '',
                                function(d) { return 'Type: ' + (d.data_type || '') + (d.comment ? '\nComment: ' + d.comment : ''); })
                        )
                    )
                }
            )
        );

        myDiagram.nodeTemplateMap.add('RelationshipNode',
            $(go.Node, 'Auto', {
                locationSpot: go.Spot.Center, selectionAdorned: false
            },
                $(go.Shape, 'Diamond', { fill: 'white', stroke: 'black', strokeWidth: 1.5, width: 80, height: 40 }),
                $(go.TextBlock, {
                    font: '11px sans-serif', stroke: 'black', margin: 4, editable: true
                }, new go.Binding('text', 'text').makeTwoWay())
            )
        );

        myDiagram.linkTemplateMap.add('ERLink',
            $(go.Link, { routing: go.Link.Normal, curve: go.Link.None },
                $(go.Shape, { stroke: 'black', strokeWidth: 1 }),
                $(go.Shape, { toArrow: '' }),
                $(go.TextBlock, {
                    segmentOffset: new go.Point(0, -10), font: 'bold 12px sans-serif', background: 'white'
                }, new go.Binding('text', 'text'))
            )
        );

        myDiagram.linkTemplate =
            $(go.Link, { routing: go.Link.Normal, curve: go.Link.None },
                $(go.Shape, { stroke: 'black', strokeWidth: 1 }),
                $(go.Shape, { toArrow: '', scale: 1 })
            );

        myDiagram.linkTemplateMap.add('Relationship',
            $(go.Link, { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, corner: 5 },
                $(go.Shape, { stroke: 'black', strokeWidth: 2, strokeDashArray: [4, 2] }),
                $(go.Shape, { toArrow: 'Standard', stroke: 'black', fill: 'black' }),
                $(go.TextBlock, {
                    segmentOffset: new go.Point(0, -10), font: '11px sans-serif', background: 'white', stroke: 'black'
                }, new go.Binding('text', 'text'))
            )
        );

    }

    /* ---- 渲染数据 ---- */
    function renderData(tables) {
        var go = window.GoJS || window.go;
        if (!myDiagram) { initDiagram(); }
        if (!myDiagram) return;
        if (!go || !go.GraphLinksModel) return;

        var nodeData = [];
        var linkData = [];
        var availableTables = new Set(tables.map(function(t) { return t.name; }));

        tables.forEach(function(t) {
            var tableKey = 'TABLE_' + t.name;
            var tableLabel = _isEnglishMode ? t.name : (t.comment || t.name);
            nodeData.push({
                key: tableKey, category: 'Entity',
                name: t.name, comment: t.comment || '', label: tableLabel
            });

            t.columns.forEach(function(c) {
                var colKey = 'COL_' + t.name + '_' + c.name;
                var colLabel = _isEnglishMode ? c.name : (c.comment || c.name);
                nodeData.push({
                    key: colKey, category: 'Attribute',
                    name: c.name, data_type: c.type || c.data_type || 'varchar',
                    is_primary: c.pk || c.is_primary || false,
                    comment: c.comment || c.verbose || '',
                    label: colLabel
                });
                linkData.push({ from: tableKey, to: colKey, text: '' });
            });

            t.columns.filter(function(c) { return (c.fk || c.is_foreign) && c.ref_table; }).forEach(function(c) {
                var refTable = c.ref_table || c.reference_table;
                if (!availableTables.has(refTable)) return;
                var relKey = 'REL_' + t.name + '_' + refTable + '_' + c.name;
                nodeData.push({ key: relKey, category: 'RelationshipNode', text: '关联' });
                linkData.push({ from: tableKey, to: relKey, category: 'ERLink', text: 'N' });
                linkData.push({ from: relKey, to: 'TABLE_' + refTable, category: 'ERLink', text: '1' });
            });
        });

        // 设 layout（有数据时才设）
        myDiagram.layout = new go.ForceDirectedLayout({
            defaultSpringLength: 30,
            defaultElectricalCharge: 80,
            maxIterations: 300,
            arrangementSpacing: 20
        });
        var model = new go.GraphLinksModel();
        model.nodeDataArray = nodeData;
        model.linkDataArray = linkData;
        myDiagram.model = model;
        myDiagram.zoomToFit();
    }

    /* ---- Django 模型 JSON → GoJS tables ---- */
    var _isEnglishMode = false;

    function buildGojsData(nodes, edges) {
        var tables = [];
        var tableMap = {};

        nodes.forEach(function(n) {
            var t = {
                name: n.table_name,
                comment: n.comment || n.name || '',
                columns: []
            };
            n.columns.forEach(function(c) {
                // 兼容 Django 模型和 SQL DDL 两种数据格式
                var col = {
                    name: c.name,
                    type: (c.data_type || c.type || '').toLowerCase(),
                    pk: c.pk || c.is_primary || false,
                    fk: c.fk || c.is_foreign || false,
                    comment: c.comment || c.verbose || '',
                    ref_table: c.ref_table || c.reference_table || ''
                };
                t.columns.push(col);
            });
            tableMap[n.id] = t;
            tables.push(t);
        });

        edges.forEach(function(e) {
            var srcT = tableMap[e.source];
            var dstT = tableMap[e.target];
            if (!srcT || !dstT) return;
            srcT.columns.forEach(function(c) {
                if (c.name === e.label || c.name.indexOf(e.label) !== -1) {
                    c.fk = true;
                    c.ref_table = dstT.name;
                }
            });
        });

        return tables;
    }

    /* ---- Draw.io XML 生成 (标准 ER 表样式) ---- */
    function buildDrawioXML(tables) {
        var x = 40, y = 40, gapX = 260, gapY = 220;
        var cols = 3;
        var tableKeys = {};

        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<mxfile host="YanLeafAdmin" version="1.0">\n';
        xml += '  <diagram name="ER Diagram" id="er">\n';
        xml += '    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200">\n';
        xml += '      <root>\n';
        xml += '        <mxCell id="0"/>\n';
        xml += '        <mxCell id="1" parent="0"/>\n';

        // Table entity style (Draw.io standard ER)
        var tblStyle = 'shape=table;html=1;whiteSpace=wrap;startSize=30;container=1;collapsible=0;childLayout=tableLayout;fontStyle=1;align=center;fillColor=#ffffff;strokeColor=#000000;strokeWidth=2;';
        var rowStyle = 'shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=0;';
        var sepStyle = 'shape=partialRectangle;html=1;whiteSpace=wrap;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;pointerEvents=1;';

        tables.forEach(function(t, idx) {
            var tx = x + (idx % cols) * gapX;
            var ty = y + Math.floor(idx / cols) * gapY;
            var tableId = 't' + idx;
            tableKeys[t.name] = tableId;

            // Table entity
            xml += '    <mxCell id="' + tableId + '" value="' + escXml(t.comment || t.name) + '" style="' + tblStyle + '" vertex="1" parent="1">\n';
            xml += '      <mxGeometry x="' + tx + '" y="' + ty + '" width="220" height="' + (30 + t.columns.length * 24) + '" as="geometry"/>\n';
            xml += '    </mxCell>\n';

            // Header separator
            xml += '    <mxCell id="' + tableId + '-sep" value="" style="' + sepStyle + '" vertex="1" parent="' + tableId + '">\n';
            xml += '      <mxGeometry width="220" height="30" as="geometry"/>\n';
            xml += '    </mxCell>\n';

            // Column rows
            t.columns.forEach(function(c, ci) {
                var rowId = tableId + '-r' + ci;
                var label = (c.pk ? '🔑 ' : (c.fk ? '🔗 ' : '')) + c.name + ' <i>(' + (c.type || c.data_type || '') + ')</i>';
                xml += '    <mxCell id="' + rowId + '" value="' + escXml(label) + '" style="' + rowStyle + ';align=left;spacingLeft=6;" vertex="1" parent="' + tableId + '">\n';
                xml += '      <mxGeometry y="' + (30 + ci * 24) + '" width="220" height="24" as="geometry"/>\n';
                xml += '    </mxCell>\n';
            });
        });

        // FK edges
        var edgeIdx = 0;
        tables.forEach(function(t) {
            var srcId = tableKeys[t.name];
            t.columns.filter(function(c) { return c.fk && c.ref_table; }).forEach(function(c) {
                var dstId = tableKeys[c.ref_table];
                if (dstId && srcId !== dstId) {
                    xml += '    <mxCell id="e' + edgeIdx + '" value="' + escXml(c.name) + '" style="edgeStyle=entityRelationEdgeStyle;fontSize=10;html=1;endArrow=ERoneToMany;strokeColor=#000000;strokeWidth=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="' + srcId + '" target="' + dstId + '">\n';
                    xml += '      <mxGeometry width="100" height="100" relative="1" as="geometry"/>\n';
                    xml += '    </mxCell>\n';
                    edgeIdx++;
                }
            });
        });

        xml += '      </root>\n';
        xml += '    </mxGraphModel>\n';
        xml += '  </diagram>\n';
        xml += '</mxfile>';
        return xml;
    }

    function escXml(s) {
        return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ---- Word 三线表 HTML 生成 ---- */
    function buildWordTableHTML(tables) {
        var html = '<html><head><meta charset="UTF-8"><title>数据库表结构 — 三线表</title>';
        html += '<style>';
        html += 'body { font-family: "Times New Roman", SimSun, serif; font-size: 12pt; }';
        html += 'h2 { font-size: 14pt; text-align: center; margin: 20px 0 10px; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }';
        html += '/* 三线表：顶线粗 + 表头底线细 + 底线粗 */';
        html += 'table tr.top-line td, table tr.top-line th { border-top: 1.5pt solid #000; }';
        html += 'table thead th { border-bottom: 0.75pt solid #000; font-size: 11pt; padding: 4px 8px; text-align: left; }';
        html += 'table tbody td { padding: 3px 8px; font-size: 10.5pt; border: none; }';
        html += 'table tbody tr.bottom-line td { border-bottom: 1.5pt solid #000; }';
        html += 'td.pk { font-weight: bold; }';
        html += 'td.fk { font-style: italic; }';
        html += '</style></head><body>';

        tables.forEach(function(t) {
            html += '<h2>' + escXml(t.comment ? t.comment + ' (' + t.name + ')' : t.name) + '</h2>';
            html += '<table>';
            html += '<thead><tr><th>字段名</th><th>类型</th><th>约束</th><th>说明</th></tr></thead>';
            html += '<tbody>';
            t.columns.forEach(function(c, i) {
                var cls = c.pk ? 'pk' : (c.fk ? 'fk' : '');
                var constraints = [];
                if (c.pk) constraints.push('主键');
                if (c.fk) constraints.push('外键 → ' + (c.ref_table || ''));
                if (c.is_primary && !constraints.length) constraints.push('主键');
                html += '<tr class="' + (i === t.columns.length - 1 ? 'bottom-line' : '') + '">';
                html += '<td class="' + cls + '">' + escXml(c.name) + '</td>';
                html += '<td>' + (c.type || c.data_type || '') + '</td>';
                html += '<td>' + constraints.join(', ') + '</td>';
                html += '<td>' + (c.comment || c.verbose || '') + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
        });

        html += '</body></html>';
        return html;
    }

    /* ---- 加载 Django 模型 ---- */
    var allNodes = [];
    function loadModels(selectedIds) {
        if (!myDiagram) initDiagram();
        $.getJSON('/admin/erd/api/models/', function(data) {
            allNodes = data.nodes;
            buildSelector(data.nodes, selectedIds);

            var nodes, edges;
            if (selectedIds && selectedIds.length) {
                var idSet = new Set(selectedIds);
                nodes = data.nodes.filter(function(n) { return idSet.has(n.id); });
                edges = data.edges.filter(function(e) { return idSet.has(e.source) && idSet.has(e.target); });
            } else {
                nodes = data.nodes;
                edges = data.edges;
            }
            var tables = buildGojsData(nodes, edges);
            currentData = tables;
            renderData(tables);
        }).fail(function() {
            $('#gojsContainer').html('<div class="has-text-centered has-text-grey py-6">加载失败</div>');
        });
    }

    function buildSelector(nodes, selectedIds) {
        var $c = $('#tableChecks').empty();
        var idSet = selectedIds ? new Set(selectedIds) : null;
        nodes.forEach(function(n) {
            var checked = (!idSet || idSet.has(n.id)) ? ' checked' : '';
            $c.append('<label><input type="checkbox" value="' + n.id + '"' + checked + '>' +
                n.name + ' (' + n.columns.length + ')</label>');
        });
        // Use event delegation on the container — never lost on rebuild
        _erUpdateToggle();
    }

    function _erUpdateToggle() {
        var total = $('#tableChecks input').length;
        var checked = $('#tableChecks input:checked').length;
        $('#selToggle').text(checked === total ? '取消全选' : '全选');
    }

    function refreshFromSelection(forceAll) {
        var ids = [];
        if (forceAll) {
            $('#tableChecks input').each(function() { ids.push($(this).val()); });
        } else {
            $('#tableChecks input:checked').each(function() { ids.push($(this).val()); });
        }
        if (!ids.length) {
            if (myDiagram) {
                myDiagram.model = new go.GraphLinksModel();
            }
            // 先清除旧占位再添加
            $('#gojsContainer .erd-placeholder').remove();
            $('#gojsContainer').append('<div class="has-text-centered has-text-grey py-6 erd-placeholder">请至少选择一个表</div>');
            return;
        }
        $('#gojsContainer .erd-placeholder').remove();
        loadModels(ids);
    }

    /* ---- SQL DDL ---- */
    function parseSQL(sql) {
        $.ajax({
            url: '/admin/erd/api/sql/', method: 'POST',
            data: { sql: sql },
            headers: { 'X-CSRFToken': window.YLA.csrfToken || '' },
            success: function(data) {
                if (data.error) { $('#sqlError').addClass('visible').text(data.error); return; }
                var tables = buildGojsData(data.nodes, data.edges);
                currentData = tables;  // 更新导出数据源为 SQL 解析结果
                $('#sqlGojsContainer').empty();
                renderSQLDiagram(tables);
            },
            error: function() { $('#sqlError').addClass('visible').text('请求失败'); }
        });
    }

    var sqlDiagram = null;
    function renderSQLDiagram(tables) {
        var go = window.GoJS || window.go;
        if (!go) return;
        var $c = $('#sqlGojsContainer');
        var $G = go.GraphObject.make;

        if (sqlDiagram) { sqlDiagram.div = null; sqlDiagram = null; }
        $c.empty();
        sqlDiagram = $G(go.Diagram, $c[0], {
            initialContentAlignment: go.Spot.Center,
            'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
            padding: 10
        });

        // Copy templates from main
        sqlDiagram.nodeTemplateMap = myDiagram ? myDiagram.nodeTemplateMap : new go.Map();
        sqlDiagram.linkTemplateMap = myDiagram ? myDiagram.linkTemplateMap : new go.Map();
        sqlDiagram.linkTemplate = myDiagram ? myDiagram.linkTemplate : null;

        var nodeData = [];
        var linkData = [];
        var avail = new Set(tables.map(function(t) { return t.name; }));

        tables.forEach(function(t) {
            var tk = 'TABLE_' + t.name;
            var tlbl = _isEnglishMode ? t.name : (t.comment || t.name);
            nodeData.push({ key: tk, category: 'Entity', name: t.name, comment: t.comment || '', label: tlbl });
            t.columns.forEach(function(c) {
                var ck = 'COL_' + t.name + '_' + c.name;
                var clbl = _isEnglishMode ? c.name : (c.comment || c.name);
                nodeData.push({
                    key: ck, category: 'Attribute', name: c.name,
                    data_type: c.type || c.data_type || 'varchar',
                    is_primary: c.pk || false, comment: c.comment || '',
                    label: clbl
                });
                linkData.push({ from: tk, to: ck, text: '' });
            });
            t.columns.filter(function(c) { return c.fk && c.ref_table; }).forEach(function(c) {
                if (!avail.has(c.ref_table)) return;
                var rk = 'REL_' + t.name + '_' + c.ref_table + '_' + c.name;
                nodeData.push({ key: rk, category: 'RelationshipNode', text: '关联' });
                linkData.push({ from: tk, to: rk, category: 'ERLink', text: 'N' });
                linkData.push({ from: rk, to: 'TABLE_' + c.ref_table, category: 'ERLink', text: '1' });
            });
        });

        sqlDiagram.layout = new go.ForceDirectedLayout({
            defaultSpringLength: 30, defaultElectricalCharge: 80, maxIterations: 300
        });
        var model = new go.GraphLinksModel();
        model.nodeDataArray = nodeData;
        model.linkDataArray = linkData;
        sqlDiagram.model = model;
        sqlDiagram.zoomToFit();
    }

    /* ---- Init ---- */
    $(function() {
        initDiagram();
        loadModels();

        // Tab switch
        $('.erd-tab').on('click', function() {
            var tab = $(this).data('tab');
            $('.erd-tab').removeClass('active');
            $(this).addClass('active');
            $('.erd-panel').removeClass('active');
            $('#panel-' + tab).addClass('active');
        });

        // 事件委托：checkbox change — 不受 rebuild 影响
        $('#tableChecks').on('change', 'input[type=checkbox]', function() {
            _erUpdateToggle();
            YLA._erdRefresh();
        });

        // 全选/取消切换
        $('#selToggle').on('click', function(e) {
            e.preventDefault();
            var allChecked = $('#tableChecks input:checked').length === $('#tableChecks input').length;
            $('#tableChecks input').prop('checked', !allChecked).trigger('change');
        });

        // 搜索过滤
        $('#tableSearch').on('input', function() {
            var q = $(this).val().toLowerCase();
            $('#tableChecks label').each(function() {
                $(this).toggleClass('hidden-by-search', q && $(this).text().toLowerCase().indexOf(q) === -1);
            });
        });

        // 刷新
        $('#erdRefresh').on('click', function() { refreshFromSelection(true); });

        // SQL
        $('#sqlParseBtn').on('click', function() {
            var sql = $('#sqlInput').val().trim();
            if (!sql) { $('#sqlError').addClass('visible').text('请粘贴 SQL DDL 语句'); return; }
            parseSQL(sql);
        });

        // 导出 PNG（2x 高清）
        $('#erdExportPNG').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#erdExportDropdown').removeClass('is-active');
            if (!myDiagram) return;
            var imgData = myDiagram.makeImageData({ scale: 2, background: 'white' });
            var a = document.createElement('a');
            a.href = imgData;
            a.download = 'er-diagram.png';
            a.click();
        });

        // 导出 Draw.io XML
        $('#erdExportDrawio').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#erdExportDropdown').removeClass('is-active');
            if (!currentData || !currentData.length) return;
            var xml = buildDrawioXML(currentData);
            var blob = new Blob([xml], { type: 'application/xml' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'er-diagram.drawio';
            a.click();
            URL.revokeObjectURL(a.href);
        });

        // 导出 Word .docx
        $('#erdExportWord').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#erdExportDropdown').removeClass('is-active');
            if (!currentData || !currentData.length) return;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/admin/erd/api/word/', true);
            xhr.setRequestHeader('X-CSRFToken', window.YLA.csrfToken || '');
            xhr.responseType = 'blob';
            var fd = new FormData();
            fd.append('tables', JSON.stringify(currentData));
            xhr.onload = function() {
                if (xhr.status === 200) {
                    var url = URL.createObjectURL(xhr.response);
                    var a = document.createElement('a');
                    a.href = url; a.download = 'er-tables.docx';
                    a.click(); URL.revokeObjectURL(url);
                }
            };
            xhr.send(fd);
        });

        // 中/英文切换
        $('#erdLangToggle').on('click', function(e) {
            e.preventDefault();
            _isEnglishMode = !_isEnglishMode;
            $('#erdLangText').text(_isEnglishMode ? 'En' : '中');
            if (currentData && currentData.length) {
                if ($('#panel-models').hasClass('active')) {
                    renderData(currentData);
                }
                // Also re-render SQL diagram if it exists
                var $sqlContainer = $('#sqlGojsContainer');
                if ($sqlContainer.children().length && $sqlContainer.find('canvas').length) {
                    renderSQLDiagram(currentData);
                }
            }
        });

        // 全屏切换（当前活跃面板）
        $('#erdFullscreen').on('click', function(e) {
            e.preventDefault();
            var elId = $('#panel-models').hasClass('active') ? 'gojsContainer' : 'sqlGojsContainer';
            var el = document.getElementById(elId);
            if (!el) return;
            if (!document.fullscreenElement) {
                if (el.requestFullscreen) el.requestFullscreen();
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                else if (el.msRequestFullscreen) el.msRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
            setTimeout(function() {
                if (myDiagram && myDiagram.requestUpdate) myDiagram.requestUpdate();
            }, 300);
        });

        window.YLA = window.YLA || {};
        window.YLA._erdRefresh = function() { refreshFromSelection(false); };
    });

})(jQuery);
