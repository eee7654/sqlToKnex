export function parseSQL(sql) {
  const cleanedSQL = sql.replace(/`/g, '');
  const tableMatch = cleanedSQL.match(/CREATE TABLE (\w+)\s*\((.*)\)\s*(ENGINE|CHARSET|COLLATE|AUTO_INCREMENT|;|$)/is);
  if (!tableMatch) {
    console.error("❌ Command: CREATE TABLE Not Found in SQL");
    process.exit(1);
  }

  const tableName = tableMatch[1];
  const body = tableMatch[2];

  const lines = body.split(/,(?![^()]*\))/).map(line => line.trim());

  const columns = [];
  const indexes = [];
  const foreignKeys = [];

  lines.forEach(line => {
    if (/^PRIMARY KEY/i.test(line)) return;

    // ✅ Detect INDEX/UNIQUE
    const indexMatch = line.match(/^(UNIQUE\s+)?(INDEX|KEY)\s+(\w+)\s*\(([^)]+)\)/i);
    if (indexMatch) {
      const isUnique = !!indexMatch[1];
      const indexName = indexMatch[3];
      const columnList = indexMatch[4]
        .split(',')
        .map(c => c.replace(/\s+(ASC|DESC)/i, '').trim());
      indexes.push({ indexName, columns: columnList, isUnique });
      return;
    }

    // ✅ Detect FOREIGN KEY
    const fkMatch = line.match(
      /FOREIGN KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)(?:\s+ON DELETE\s+([A-Z\s]+))?(?:\s+ON UPDATE\s+([A-Z\s]+))?/i
    );
    if (fkMatch) {
      const [, column, refTable, refColumn, onDelete, onUpdate] = fkMatch;
      foreignKeys.push({
        column,
        references: {
          table: refTable,
          column: refColumn,
        },
        ...(onDelete && { onDelete: onDelete.toUpperCase() }),
        ...(onUpdate && { onUpdate: onUpdate.toUpperCase() }),
      });
      return;
    }

    // ✅ Detect Column
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

  return { tableName, columns, indexes, foreignKeys };
}
