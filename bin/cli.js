#!/usr/bin/env node
import { parseSQL } from '../parser/parseSQL.js';
import { generateMigration } from '../builder/generateMigration.js';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

const inputPath = args.find(arg => !arg.startsWith('--'));
const outputArg = args.find(arg => arg.startsWith('--output='));
const outputDir = outputArg ? outputArg.split('=')[1] : 'migrations';

if (!inputPath) {
  console.error('❌ Please specify input SQL path');
  console.error('📘 Sample usage: node cli.js schema.sql --output=db/migrations');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(inputPath, 'utf8');
const tableData = parseSQL(sql);
generateMigration({ ...tableData, outputDir });
