export function parseSQL(sql) {
  const cleanedSQL = sql.replace(/`/g, '');
  const tableMatch = cleanedSQL.match(/CREATE TABLE (\w+)\s*\((.*)\)\s*(ENGINE|CHARSET|COLLATE|AUTO_INCREMENT|;|$)/is);
  if (!tableMatch) {
    console.error("❌ Command: CREATE TABLE Not Found in sql");
    process.exit(1);
  }

  const tableName = tableMatch[1];
  const body = tableMatch[2];

  const lines = body.split(/,(?![^()]*\))/).map(line => line.trim());

  const columns = [];
  const indexes = [];

  lines.forEach(line => {
    if (/^PRIMARY KEY/i.test(line)) return;
    const lineRegex = /^(UNIQUE\s+)?(INDEX|KEY)\s+(\w+)\s*\(([^)]+)\)/i;
    const indexMatch = line.match(lineRegex);
    if (indexMatch) {
      // isUnique = true اگر قسمت اول (UNIQUE ) پر شده باشه
      const isUnique = !!indexMatch[1];
      // indexMatch[2] = "INDEX" یا "KEY"
      // indexMatch[3] = نام ایندکس
      // indexMatch[4] = لیست ستون‌های داخل پرانتز
      const indexName = indexMatch[3];
      const columnsRaw = indexMatch[4];

      const columnList = columnsRaw
        .split(',')
        .map((c) => c.replace(/\s+(ASC|DESC)/i, '').trim());

      indexes.push({
        indexName,
        columns: columnList,
        isUnique,
      });
      return;
    }

    const colMatch = line.match(/^(\w+)\s+([a-zA-Z]+(?:\([^)]+\))?)\s*(.*)$/i);
    if (!colMatch) return;

    const [_, name, typeRaw, rest] = colMatch;
    const typeLower = typeRaw.toLowerCase();
    const type = typeLower.replace(/\(.*\)/, '');

    const lengthMatch = typeRaw.match(/\((\d+)\)/);
    const length = lengthMatch ? Number(lengthMatch[1]) : null;

    let enumValues = null;
    if (type === 'enum') {
      const enumMatch = typeRaw.match(/\(([^)]+)\)/);
      if (enumMatch) {
        enumValues = enumMatch[1]
          .split(',')
          .map(v => v.trim().replace(/^'(.*)'$/, '$1'));
      }
    }

    columns.push({
      name,
      type,
      length,
      enumValues,
      attributes: rest.trim(),
    });
  });
  return { tableName, columns, indexes };
}