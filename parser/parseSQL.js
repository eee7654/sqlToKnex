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
    if (/^PRIMARY KEY/i.test(line)) {
      return; // ازش رد شو چون توی ستون‌ها هندل شده
    }
    
    if (/^KEY/i.test(line)) {
      const keyMatch = line.match(/^KEY\s+(\w+)\s*\(([^)]+)\)/i);
      if (keyMatch) {
        const indexName = keyMatch[1];
        const columns = keyMatch[2].split(',').map(c => c.trim());
        indexes.push({ indexName, columns });
      }
    } else if (/^(\w+)\s+([\w()]+)(.*)$/i.test(line)) {
      const colMatch = line.match(/^(\w+)\s+([\w()]+)(.*)$/i);
      if (!colMatch) return;

      const [_, name, typeRaw, rest] = colMatch;
      const type = typeRaw.toLowerCase().replace(/\(.*\)/, '');
      const lengthMatch = typeRaw.match(/\((\d+)\)/);
      const length = lengthMatch ? Number(lengthMatch[1]) : null;

      columns.push({ name, type, length, attributes: rest });
    }
  });

  return { tableName, columns, indexes };
}