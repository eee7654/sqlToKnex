# sqlToKnex

🧠 A simple CLI tool to convert SQL CREATE TABLE statements into [Knex.js](https://knexjs.org/) migration files.

## 📦 Installation (for local dev)

```bash
git clone https://github.com/your-username/sqlToKnex.git
cd sqlToKnex
npm install
```

## 🚀 Usage

```bash
npx sqltoknex path/to/your.sql
```

Or after global install:

```bash
npm install -g .
sqltoknex input.sql
```

## 📂 Output

- Migration file will be saved to `/migrations/` folder
- Auto-named like `20250405_create_users_table.js`

## 💡 Features

- Detects types: INT, VARCHAR(n), TEXT, BOOLEAN, TIMESTAMP
- Supports: `UNSIGNED`, `NOT NULL`, `DEFAULT`, `AUTO_INCREMENT`
- Smart handling of `CURRENT_TIMESTAMP ON UPDATE`

## 📜 License

MIT