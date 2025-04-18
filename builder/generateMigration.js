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

export function generateMigration({ tableName, columns, indexes, foreignKeys = [], outputDir = 'migrations' }) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const fileName = `${timestamp}_create_${tableName}_table.js`;
  const outputPath = path.join(outputDir, fileName);

  fs.mkdirSync(outputDir, { recursive: true });

  const uniqueColumnsFromIndexes = new Set();
  indexes?.forEach((idx) => {
    if (idx.isUnique) {
      idx.columns.forEach(col => uniqueColumnsFromIndexes.add(col));
    }
  });

  const foreignKeyMap = {};
  foreignKeys?.forEach(fk => {
    foreignKeyMap[fk.column] = fk;
  });

  const columnDefinitions = columns.map(({ name, type, length, attributes = '', enumValues }) => {
    if (!name || !type) return '';

    const fk = foreignKeyMap[name];
    const isFK = !!fk;

    let line;
    if (/auto_increment/i.test(attributes)) {
      line = `table.increments('${name}')`;
    } else if (type === 'enum' && enumValues) {
      line = `table.enu('${name}', ${JSON.stringify(enumValues)})`;
    } else {
      const knexType = knexTypes[type];
      if (!knexType) return `// ⚠️ Unhandled type: ${type} → ${name}\ntable.specificType('${name}', '${type}')`;
      line = `table.${knexType}('${name}'${length ? `, ${length}` : ''})`;
    }

    if (/unsigned/i.test(attributes)) {
      line += `.unsigned()`;
    }

    if (/not null/i.test(attributes)) {
      line += `.notNullable()`;
    } else if (!/default\s+/i.test(attributes)) {
      line += `.nullable()`;
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

    if (/unique/i.test(attributes) || uniqueColumnsFromIndexes.has(name)) {
      line += `.unique()`;
    }

    if (isFK) {
      line += `.references('${fk.references.column}').inTable('${fk.references.table}')`;
      if (fk.onDelete) line += `.onDelete('${fk.onDelete}')`;
      if (fk.onUpdate) line += `.onUpdate('${fk.onUpdate}')`;
    }

    return line + ';';
  });

  const indexDefinitions = (indexes || []).map(({ indexName, columns, isUnique }) => {
    if (isUnique) return '';
    return `table.index([${columns.map((col) => `'${col}'`).join(', ')}], '${indexName}');`;
  }).filter(Boolean);

  const migrationContent = `// Auto-generated by sqlToKnex
exports.up = async function(knex) {
  await knex.schema.createTable('${tableName}', table => {
    ${[...columnDefinitions, ...indexDefinitions].join('\n    ')}
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('${tableName}');
};
`;

  fs.writeFileSync(outputPath, migrationContent);
  console.log(`✅ Migration file saved at: ${outputPath}`);
}
