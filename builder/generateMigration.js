import fs from 'fs';
import path from 'path';

const knexTypes = {
  int: 'integer',
  bigint: 'bigInteger',
  varchar: 'string',
  tinytext: 'text',
  text: 'text',
  boolean: 'boolean',
  timestamp: 'timestamp',
  datetime: 'dateTime',
  date: 'date',
};

export function generateMigration({ tableName, columns, indexes }) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const fileName = `${timestamp}_create_${tableName}_table.js`;
  const outputPath = path.join('migrations', fileName);

  // شناسایی ستون‌هایی که توی INDEX ها unique هستند
  const uniqueColumnsFromIndexes = new Set();
  (indexes || []).forEach((idx) => {
    if (/unique/i.test(idx.indexName) && idx.columns.length === 1) {
      uniqueColumnsFromIndexes.add(idx.columns[0]);
    }
  });

  const columnDefinitions = columns.map(({ name, type, length, attributes = '', enumValues }) => {
    let line;

    if (/auto_increment/i.test(attributes)) {
      line = `table.increments('${name}')`;
    } else if (type === 'enum' && enumValues) {
      line = `table.enu('${name}', ${JSON.stringify(enumValues)})`;
    } else {
      const knexType = knexTypes[type];
      if (!knexType) return `// ⚠️ نوع ناشناخته: ${type} → ${name}\ntable.specificType('${name}', '${type}')`;
      line = `table.${knexType}('${name}'${length ? `, ${length}` : ''})`;
    }

    if (!/not null/i.test(attributes) && !/default\s+/i.test(attributes)) {
      line += `.nullable()`;
    }

    if (/unsigned/i.test(attributes)) {
      line += `.unsigned()`;
    }

    if (/not null/i.test(attributes)) {
      line += `.notNullable()`;
    }

    if (/default\s+current_timestamp\s+on\s+update\s+current_timestamp/i.test(attributes)) {
      line += `.defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))`;
    } else if (/default\s+current_timestamp/i.test(attributes)) {
      line += `.defaultTo(knex.fn.now())`;
    } else if (/default\s+null/i.test(attributes)) {
      line += `.defaultTo(null)`;
    } else {
      const defMatch = attributes.match(/default\s+(['"][^'"]+['"]|\d+)/i);
      if (defMatch) {
        line += `.defaultTo(${defMatch[1]})`;
      }
    }

    if (/primary key/i.test(attributes) && !line.includes('.primary()')) {
      line += `.primary()`;
    }

    if (/unique/i.test(attributes) || uniqueColumnsFromIndexes.has(name)) {
      line += `.unique()`;
    }

    return line + ';';
  });

  const indexDefinitions = (indexes || []).map(({ indexName, columns }) => {
    if (/unique/i.test(indexName)) return ''; // چون بالاتر به `.unique()` اضافه کردیم
    return `table.index([${columns.map((col) => `'${col}'`).join(', ')}], '${indexName}');`;
  }).filter(Boolean);

  const migrationContent = `// Auto-generated by sqlToKnex
exports.up = function(knex) {
  return knex.schema.createTable('${tableName}', function(table) {
    ${[...columnDefinitions, ...indexDefinitions].join('\n    ')}
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('${tableName}');
};
`;

  fs.writeFileSync(outputPath, migrationContent);
  console.log(`✅ فایل Migration در مسیر: ${outputPath} ذخیره شد.`);
}
