export function parseSQL(sql) {
  // پاک‌سازی backtick ها
  const cleanedSQL = sql.replace(/`/g, '');
  const tableMatch = cleanedSQL.match(/CREATE TABLE (\w+)\s*\((.*)\)\s*(ENGINE|CHARSET|COLLATE|AUTO_INCREMENT|;|$)/is);
  if (!tableMatch) {
    console.error("❌ دستور CREATE TABLE در SQL یافت نشد.");
    process.exit(1);
  }

  const tableName = tableMatch[1];
  const body = tableMatch[2];

  const lines = body.split(/,(?![^()]*\))/).map(line => line.trim());

  const columns = [];
  const indexes = [];

  lines.forEach(line => {
    // PRIMARY KEY → نادیده بگیر چون توی attributes هندل می‌کنیم
    if (/^PRIMARY KEY/i.test(line)) return;

    // UNIQUE INDEX یا KEY
    const uniqueIndexMatch = line.match(/^(UNIQUE\s+)?KEY\s+(\w+)\s*\(([^)]+)\)/i);
    if (uniqueIndexMatch) {
      const isUnique = !!uniqueIndexMatch[1];
      const indexName = uniqueIndexMatch[2];
      const columnList = uniqueIndexMatch[3].split(',').map(c => c.trim());
      indexes.push({
        indexName: isUnique ? `unique_${indexName}` : indexName,
        columns: columnList,
      });
      return;
    }

    // تعریف ستون
    const colMatch = line.match(/^(\w+)\s+([a-zA-Z]+(?:\([^)]+\))?)\s*(.*)$/i);
    if (!colMatch) return;

    const [_, name, typeRaw, rest] = colMatch;
    const typeLower = typeRaw.toLowerCase();
    const type = typeLower.replace(/\(.*\)/, '');

    // طول در صورتی که مثلا VARCHAR(255)
    const lengthMatch = typeRaw.match(/\((\d+)\)/);
    const length = lengthMatch ? Number(lengthMatch[1]) : null;

    // ENUM values → enum('a', 'b', 'c')
    let enumValues = null;
    if (type === 'enum') {
      const enumMatch = typeRaw.match(/\(([^)]+)\)/);
      if (enumMatch) {
        enumValues = enumMatch[1]
          .split(',')
          .map(v => v.trim().replace(/^'(.*)'$/, '$1')); // پاک‌کردن کوتیشن
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
