/**
 * @file inspect_schema.js
 */
const { executeSql } = require("./services/dremioService");

async function inspect() {
  const sql = 'SELECT * FROM INFORMATION_SCHEMA."TABLES" LIMIT 5';
  try {
    const res = await executeSql(sql);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
inspect();
