# sqlToKnex

🧠 A simple CLI tool to convert SQL `CREATE TABLE` statements into [Knex.js](https://knexjs.org/) migration files.

## 📦 Installation (for local dev)

```bash
git clone https://github.com/your-username/sqlToKnex.git
cd sqlToKnex
npm install
```

## 🚀 Usage

Convert a `.sql` file into a Knex migration file:

```bash
npx sqltoknex path/to/input.sql --output=./migrations
```

Or after global install:

```bash
npm install -g .
sqltoknex input.sql --output=./db/migrations
```

If `--output` is omitted, the output folder defaults to `./migrations`.

## 📂 Output

- The migration file will be saved in the specified output directory
- File name format: `YYYYMMDDHHMMSS_create_<table>_table.js`
- Format: **async migration** with `await knex.schema.createTable(...)`

## 💡 Features

### ✅ Column Definitions

- Supports types like `INT`, `BIGINT`, `VARCHAR(n)`, `TEXT`, `BOOLEAN`, `TIMESTAMP`, `DATE`, `ENUM(...)`
- Recognizes `UNSIGNED`, `NOT NULL`, `DEFAULT`, `AUTO_INCREMENT`
- Smart handling of `CURRENT_TIMESTAMP ON UPDATE`
- Columns are defined in one-liner format for clarity

### ✅ Indexes

- Detects `INDEX`, `UNIQUE INDEX`, `KEY`
- Generates `.index([...], 'index_name')` statements

### ✅ Foreign Keys

- Parses full `FOREIGN KEY (...) REFERENCES ... (...)` syntax
- Adds `.references(...).inTable(...).onDelete(...).onUpdate(...)` lines

### ✅ Output Options

- Use `--output=./your/dir` to save migrations elsewhere
- Creates the directory if it does not exist

## 🧪 Example

Given this SQL:

```sql
CREATE TABLE blog_posts (
  id int unsigned NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  body text,
  author_id bigint unsigned,
  status enum('draft','published') DEFAULT 'draft',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY author_idx (author_id),
  CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);
```

It will generate:

```js
exports.up = async function(knex) {
  await knex.schema.createTable('blog_posts', table => {
    table.increments('id').unsigned().notNullable().primary();
    table.string('title', 255).notNullable();
    table.text('body').nullable();
    table.bigInteger('author_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.enum('status', ['draft', 'published']).defaultTo('draft');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

    table.index(['author_id'], 'author_idx');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('blog_posts');
};
```

## 🛡 License

MIT
