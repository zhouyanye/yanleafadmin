import sqlparse
from dataclasses import dataclass
from typing import List, Optional
import re


@dataclass
class Column:
    name: str
    data_type: str
    comment: str = ""
    is_primary: bool = False
    is_foreign: bool = False
    nullable: bool = True
    default_value: Optional[str] = None
    reference_table: Optional[str] = None
    reference_column: Optional[str] = None

    def to_dict(self):
        return {
            "name": self.name,
            "data_type": self.data_type,
            "comment": self.comment,
            "is_primary": self.is_primary,
            "is_foreign": self.is_foreign,
            "nullable": self.nullable,
            "default_value": self.default_value,
            "reference_table": self.reference_table,
            "reference_column": self.reference_column,
        }


@dataclass
class Table:
    name: str
    columns: List[Column]
    comment: str = ""

    def to_dict(self):
        return {
            "name": self.name,
            "comment": self.comment,
            "columns": [col.to_dict() for col in self.columns]
        }


class SQLParser:
    def parse(self, sql_text: str) -> List[Table]:
        tables = []
        sql_text = self._clean_sql(sql_text)

        for statement in sqlparse.parse(sql_text):
            if statement.get_type() != 'CREATE':
                continue

            table = self.parse_create_table(str(statement))
            if table:
                tables.append(table)

        self._resolve_foreign_keys(tables)
        return tables

    def parse_create_table(self, create_stmt: str) -> Optional[Table]:
        create_stmt = self._clean_sql(create_stmt)
        table_name = self._extract_table_name(create_stmt)
        start, end = self._find_bracket_range(create_stmt)
        if start == -1 or end == -1:
            return None

        columns_section = create_stmt[start+1:end].strip()
        if not columns_section:
            return None

        table_options = create_stmt[end+1:]

        table_comment = self._extract_table_comment(table_options)

        column_defs, constraints = self._split_definitions(columns_section)
        columns = [self._parse_column(defs) for defs in column_defs if defs]
        columns = [c for c in columns if c is not None]

        table = Table(name=table_name, columns=columns, comment=table_comment)
        self._process_table_constraints(constraints, table)
        return table

    def _find_bracket_range(self, sql: str) -> tuple:
        start_index = sql.find('(')
        if start_index == -1:
            return -1, -1

        balance = 1
        end_index = -1
        for i in range(start_index + 1, len(sql)):
            char = sql[i]
            if char == '(':
                balance += 1
            elif char == ')':
                balance -= 1

            if balance == 0:
                end_index = i
                break

        return start_index, end_index

    def _clean_sql(self, sql: str) -> str:
        sql = re.sub(r'--.*?$', '', sql, flags=re.MULTILINE)
        lines = [line.strip() for line in sql.splitlines() if line.strip()]
        return '\n'.join(lines)

    def _extract_table_name(self, sql: str) -> str:
        # 匹配 schema.table 或者 "schema"."table" 或者 `schema`.`table`
        # 仅提取表名部分
        match = re.search(
            r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"\[]?([^`"\[\s.]+)[`"\]]?\.)?[`"\[]?([^`"\[\s(]+)[`"\]]?',
            sql,
            re.IGNORECASE
        )
        if match:
            # group(2) 是表名，group(1) 是可选的 schema
            table_name = match.group(2)
            return self._sanitize_identifier(table_name)
        return "unknown_table"

    def _extract_table_comment(self, sql: str) -> str:
        """
        提取表注释，处理多种引号。
        """
        match = re.search(r'COMMENT\s*=?\s*([\'"`])(.*?)\1', sql, re.IGNORECASE | re.DOTALL)
        return match.group(2).strip() if match else ""

    def _extract_columns_section(self, sql: str) -> str:
        """
        保留此方法以兼容旧代码，或直接移除。
        """
        start, end = self._find_bracket_range(sql)
        if start != -1 and end != -1:
             return sql[start+1:end].strip()
        return ""

    def _split_definitions(self, section: str) -> tuple:
        section = section.strip()
        if not section:
            return [], []

        columns = []
        constraints = []
        buffer = ""
        depth = 0
        in_quote = False
        quote_char = None
        i = 0

        while i < len(section):
            char = section[i]

            # Handle quotes
            if char in ("'", '"', "`"):
                if not in_quote:
                    in_quote = True
                    quote_char = char
                elif char == quote_char:
                    # Check for escaped quote (e.g. 'don\'t' or 'don''t')
                    # Simple check: if prev char is backslash, it's escaped (for MySQL)
                    # OR if next char is also quote (SQL standard escaping), but let's keep it simple first
                    is_escaped = (i > 0 and section[i-1] == '\\')
                    if not is_escaped:
                        in_quote = False
                        quote_char = None

            if not in_quote:
                if char in '([':
                    depth += 1
                elif char in '])':
                    depth -= 1

                if char == ',' and depth == 0:
                    item = buffer.strip()
                    if item:
                        if re.match(r'^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|KEY|INDEX|FULLTEXT|SPATIAL)\b', item, re.I):
                            constraints.append(item)
                        else:
                            columns.append(item)
                    buffer = ""
                    i += 1
                    continue

            buffer += char
            i += 1

        # Last item
        if buffer.strip():
            item = buffer.strip()
            if re.match(r'^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|KEY|INDEX|FULLTEXT|SPATIAL)\b', item, re.I):
                constraints.append(item)
            else:
                columns.append(item)

        return columns, constraints

    def _parse_column(self, col_def: str) -> Optional[Column]:
        col_def = col_def.strip()

        if re.match(r'^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|KEY|INDEX|FULLTEXT|SPATIAL)\b', col_def, re.I):
            return None

        # 分别匹配单引号、双引号和反引号的情况，并支持转义字符
        # 模式解释:
        # 1. COMMENT\s*=?\s* : 匹配 COMMENT 关键字及可选的等号
        # 2. (?: ... ) : 非捕获组，用于匹配三种引号情况
        # 3. '((?:[^'\\]|\\.)*)' : 匹配单引号包裹的内容，支持转义 (例如 \')
        # 4. "((?:[^"\\]|\\.)*)" : 匹配双引号包裹的内容
        # 5. `((?:[^`\\]|\\.)*)` : 匹配反引号包裹的内容
        comment_pattern = r"COMMENT\s*=?\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|`((?:[^`\\]|\\.)*)`)"
        comment_match = re.search(comment_pattern, col_def, re.IGNORECASE)

        comment = ""
        if comment_match:
            # group(1) 是单引号内容, group(2) 是双引号内容, group(3) 是反引号内容
            if comment_match.group(1) is not None:
                comment = comment_match.group(1)
            elif comment_match.group(2) is not None:
                comment = comment_match.group(2)
            elif comment_match.group(3) is not None:
                comment = comment_match.group(3)

            # 处理转义字符，例如把 \' 还原为 '
            # 修复：unicode_escape 会导致中文乱码（如 \uXXXX 没问题，但 utf-8 字节被误转）
            # 对于 SQL 中的中文注释，通常不需要 unicode_escape，除非它真的是 \u 开头的
            # 简单处理：仅替换常见的 SQL 转义符 \' \" \\
            comment = comment.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\")


        # 移除 COMMENT 部分以便后续解析
        clean_def = re.sub(comment_pattern, "", col_def, flags=re.IGNORECASE).strip()

        # 提取第一个标识符作为列名
        name_match = re.search(r'^[^,\s]+', clean_def)
        if not name_match:
            return None
        name_raw = name_match.group(0)
        name = self._sanitize_identifier(name_raw)

        # 跳过列名
        rest = clean_def[len(name_raw):].strip()

        # 提取数据类型
        # 修复：更通用的类型匹配，支持 UNSIGNED 等修饰符
        # 匹配: 单词 + 可选括号内容 + 可选空白 + 可选UNSIGNED/ZEROFILL
        type_match = re.search(
            r'^([a-zA-Z0-9_]+(?:\s*\([^)]+\))?(?:\s+(?:UNSIGNED|ZEROFILL|BINARY))?)',
            rest, re.IGNORECASE
        )
        data_type = type_match.group(1).strip().upper() if type_match else 'UNKNOWN'

        # 解析约束
        is_primary = bool(re.search(r'\bPRIMARY\s+KEY\b|\bAUTO_INCREMENT\b', col_def, re.IGNORECASE))
        is_foreign = bool(re.search(r'\bREFERENCES\b', col_def, re.IGNORECASE))

        # Nullable check (默认 True，除非有 NOT NULL)
        is_not_null = bool(re.search(r'\bNOT\s+NULL\b', col_def, re.IGNORECASE))
        nullable = not is_not_null

        # Default value
        default_match = re.search(r'\bDEFAULT\s+([^\s,]+|"[^"]*"|\'[^\']*\')', col_def, re.IGNORECASE)
        default_value = default_match.group(1) if default_match else None
        if default_value:
            default_value = default_value.strip("'\"")

        reference_table = None
        reference_column = None
        if is_foreign:
            fk_match = re.search(r'REFERENCES\s+[`"]?(\w+)[`"]?\s*\(\s*[`"]?(\w+)[`"]?\s*\)', col_def, re.IGNORECASE)
            if fk_match:
                reference_table = fk_match.group(1)
                reference_column = fk_match.group(2)

        return Column(
            name=name,
            data_type=data_type,
            comment=comment,
            is_primary=is_primary,
            is_foreign=is_foreign,
            nullable=nullable,
            default_value=default_value,
            reference_table=reference_table,
            reference_column=reference_column
        )

    def _process_table_constraints(self, constraints: List[str], table: Table):
        col_map = {col.name: col for col in table.columns}
        for constraint in constraints:
            if constraint.upper().startswith('PRIMARY KEY'):
                pk_match = re.search(r'\(([^)]+)\)', constraint)
                if pk_match:
                    for col_name in re.findall(r'[`"\[]?(\w+)[`"\]]?', pk_match.group(1)):
                        if col_name in col_map:
                            col_map[col_name].is_primary = True

            elif constraint.upper().startswith('FOREIGN KEY'):
                fk_match = re.search(
                    r'FOREIGN\s+KEY\s*\([`"\[]?(\w+)[`"\]]?\)\s*REFERENCES\s+[`"\[]?(\w+)[`"\]]?\s*\(\s*[`"\[]?(\w+)[`"\]]?\)',
                    constraint, re.I
                )
                if fk_match:
                    col_name, ref_table, ref_col = fk_match.groups()
                    if col_name in col_map:
                        col_map[col_name].is_foreign = True
                        col_map[col_name].reference_table = ref_table
                        col_map[col_name].reference_column = ref_col

    def _resolve_foreign_keys(self, tables: List[Table]):
        """
        最终修复：通过命名约定猜测外键关系，并正确设置引用的列名。
        1. 排除主键引用自身的问题。
        2. 增加通过去除 _id 猜测目标表的兜底逻辑。
        """
        table_map = {table.name.lower(): table for table in tables}

        # 建立 ID 名称到表名的反向映射: {'student_id': 't_student', 'class_id': 't_class_info'}
        id_to_table = {}
        pk_map = {}

        for table in tables:
            pks = [col.name.lower() for col in table.columns if col.is_primary]
            pk_map[table.name.lower()] = pks
            if pks:
                # 假设第一个主键是最常用的引用名
                id_to_table[pks[0]] = table.name.lower()

        for table in tables:
            table_name_lower = table.name.lower()
            for col in table.columns:
                # 1. 如果已经通过显式 FOREIGN KEY 解析出来，则跳过。
                if col.is_foreign:
                    continue

                col_name_lower = col.name.lower()

                # 排除非 ID 格式
                if not col_name_lower.endswith(('_id', '_uuid', '_pk')):
                    continue

                # *** 🎯 关键修复点：排除当前表的主键自身 ***
                # 如果这个列是当前表的主键，则它不是外键。
                if col_name_lower in pk_map[table_name_lower]:
                    continue
                # *****************************************

                # 2. 尝试精确匹配 ID 到主键 (例如 student_id 引用 t_student.student_id)
                if col_name_lower in id_to_table:
                    ref_table_name_lower = id_to_table[col_name_lower]

                    # 再次确认引用的不是自己所在的表 (防止外键名和主键名相同时，误判为自引用外键)
                    if ref_table_name_lower == table_name_lower:
                        continue

                    col.is_foreign = True
                    col.reference_table = table_map[ref_table_name_lower].name
                    col.reference_column = col_name_lower  # 引用列名就是它自己
                    continue

                # 3. 兜底逻辑：尝试通过去除 _id 后匹配表名 (例如 class_id 引用 t_class_info)
                if col_name_lower.endswith(('_id', '_uuid')):
                    # 去除 '_id' 后缀
                    base = re.sub(r'_(id|uuid|pk)$', '', col_name_lower)

                    # 尝试匹配 't_class_info', 't_class', 'class'
                    candidates = [f"t_{base}_info", f"t_{base}", base, base.rstrip('s')]

                    for candidate in candidates:
                        if candidate in table_map:
                            ref_table = table_map[candidate]

                            # 确定引用的列名：优先使用目标表的主键名，否则使用外键列名本身
                            ref_col_name = (
                                pk_map[candidate][0] if pk_map[candidate] else col_name_lower
                            )

                            col.is_foreign = True
                            col.reference_table = ref_table.name
                            col.reference_column = ref_col_name
                            break

    def _sanitize_identifier(self, identifier: str) -> str:
        return identifier.strip('`"')
