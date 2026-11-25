const express = require('express');
const { closePool, executeQuery } = require('./db');

const app = express();
const PORT = 3000;

// リクエスト本文のJSONを解析し、各ルートから利用できるようにする。
app.use(express.json());

// サーバー側で発生したエラーを記録し、500と指定されたメッセージで返す。
function handleServerError(res, err, errorMessage) {
  console.error(err);
  return res.status(500).json({ message: errorMessage });
}

// ToDoを新規作成し、作成したデータを返す。
app.post('/todos', async (req, res) => {
  const { title, priority } = req.body;

  try {
    // 新しいToDoの初期ステータスを「未着手」にしてDBへ登録する。
    const result = await executeQuery(
      'INSERT INTO todos (title, priority, status) VALUES (?, ?, ?)',
      [title, priority, '未着手']
    );

    return res.status(201).json({
      id: result.insertId,
      title,
      priority,
      status: '未着手'
    });
  } catch (err) {
    return handleServerError(res, err, 'ToDoの作成に失敗しました。');
  }
});

// DBに登録されているすべてのToDoを返す。
app.get('/todos', async (req, res) => {
  try {
    const todos = await executeQuery(
      'SELECT id, title, priority, status FROM todos'
    );
    return res.status(200).json(todos);
  } catch (err) {
    return handleServerError(res, err, 'ToDoの取得に失敗しました。');
  }
});

// 指定されたIDのToDoを更新し、更新後のデータを返す。
app.put('/todos/:id', async (req, res) => {
  const { title, priority, status } = req.body;
  try {
    const result = await executeQuery(
      'UPDATE todos SET title = ?, priority = ?, status = ? WHERE id = ?;',
      [title, priority, status, req.params.id]
    );

    // 値に変更がなく更新件数が0の場合もあるため、DBでIDの存在を確認する。
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '指定されたToDoが見つかりません。' });
    }

    return res.status(200).json({ id: req.params.id, title, priority, status });
  } catch (err) {
    return handleServerError(res, err, 'ToDoの更新に失敗しました。');
  }
});

// 指定されたIDのToDoを削除し、削除結果を返す。
app.delete('/todos/:id', async (req, res) => {
  try {
    const result = await executeQuery('DELETE FROM todos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '指定されたToDoが見つかりません。' });
    }

    return res.status(200).json({ message: 'ToDoを削除しました。' });
  } catch (err) {
    return handleServerError(res, err, 'ToDoの削除に失敗しました。');
  }
});

// アプリ終了時にDB接続プールを安全に破棄する
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n${signal}を受信。アプリケーションの終了処理中．．．`);
    await closePool();
    process.exit();
  });
});

// Webサーバーを起動
app.listen(PORT, () => {
  console.log(`${PORT}番ポートでWebサーバーが起動しました。`);
});
