#!/usr/bin/env node
import { parseSQL } from '../parser/parseSQL.js';
import { generateMigration } from '../builder/generateMigration.js';
import fs from 'fs';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ لطفاً مسیر فایل SQL ورودی را مشخص کنید.');
  process.exit(1);
}

const sql = fs.readFileSync(inputPath, 'utf8');
const tableData = parseSQL(sql);
generateMigration(tableData);