/**
 * @file list_tables.js
 * @description Helper script to fetch all tables in the EcommerceDB schema.
 */

const { executeSql } = require("./services/dremioService");

async function listTables() {
  const sql =
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.\"TABLES\" WHERE TABLE_SCHEMA = 'EcommerceDB.dpcommerce'";
  console.log(`\n🔍 Fetching tables from Dremio...`);

  try {
    const response = await executeSql(sql);
    console.log("\n✅ Tables found:");
    console.table(response.rows);
  } catch (error) {
    console.error("\n❌ Error fetching tables:", error.message);
  }
}

listTables();
