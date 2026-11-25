const mysql = require('mysql2/promise');

// DB接続設定
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'nodejs_db_kadai'
};

// DB接続プール作成
const pool = mysql.createPool(dbConfig);

// DB接続プール破棄
async function closePool() {
  await pool.end();
}

// SQL実行
async function executeQuery(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// エクスポート
module.exports = {
  closePool,
  executeQuery
};