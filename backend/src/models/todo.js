import { pool } from '../config/database.js';

const SELECT_FIELDS = `
  id, user_id AS userId, title, description, priority, status,
  due_date AS dueDate, created_at AS createdAt, updated_at AS updatedAt,
  completed_at AS completedAt
`;

function buildWhere(filters, userId) {
  const where = ['user_id = ?'];
  const params = [userId];

  if (filters.status === 'active') {
    where.push("status = 'active'");
  } else if (filters.status === 'completed') {
    where.push("status = 'completed'");
  }

  if (filters.priority === 'high') {
    where.push("priority = 'high'");
  } else if (filters.priority) {
    where.push('priority = ?');
    params.push(filters.priority);
  }

  if (filters.due === 'today') {
    where.push('due_date = CURDATE()');
  } else if (filters.due === 'upcoming') {
    where.push('due_date IS NOT NULL AND due_date >= CURDATE()');
  } else if (filters.due === 'overdue') {
    where.push('due_date IS NOT NULL AND due_date < CURDATE() AND status = "active"');
  }

  if (filters.search) {
    where.push('(title LIKE ? OR description LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like);
  }

  return { clause: where.join(' AND '), params };
}

const SORT_COLUMNS = {
  created_desc: 'created_at DESC',
  created_asc: 'created_at ASC',
  updated_desc: 'updated_at DESC',
  due_asc: "due_date IS NULL, due_date ASC",
  due_desc: 'due_date DESC',
  priority_desc: "FIELD(priority, 'high', 'medium', 'low')",
  title_asc: 'title ASC',
};

export async function listTodos(userId, filters = {}) {
  const { clause, params } = buildWhere(filters, userId);
  const orderBy = SORT_COLUMNS[filters.sort] || SORT_COLUMNS.created_desc;
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM todos WHERE ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

export async function countTodos(userId, filters = {}) {
  const { clause, params } = buildWhere(filters, userId);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM todos WHERE ${clause}`,
    params
  );
  return rows[0].total;
}

export async function getTodoStats(userId) {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'active') AS active,
       SUM(status = 'completed') AS completed,
       SUM(priority = 'high' AND status = 'active') AS highPriority,
       SUM(due_date = CURDATE() AND status = 'active') AS dueToday,
       SUM(due_date IS NOT NULL AND due_date < CURDATE() AND status = 'active') AS overdue
     FROM todos WHERE user_id = ?`,
    [userId]
  );
  const s = rows[0];
  return {
    total: Number(s.total),
    active: Number(s.active),
    completed: Number(s.completed),
    highPriority: Number(s.highPriority),
    dueToday: Number(s.dueToday),
    overdue: Number(s.overdue),
  };
}

export async function findTodoById(id, userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM todos WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function createTodo(userId, { title, description, priority, dueDate }) {
  const [result] = await pool.query(
    'INSERT INTO todos (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
    [userId, title, description ?? null, priority || 'medium', dueDate ?? null]
  );
  return findTodoById(result.insertId, userId);
}

export async function updateTodo(id, userId, fields) {
  const allowed = ['title', 'description', 'priority', 'status', 'due_date', 'completed_at'];
  const updates = [];
  const params = [];
  for (const [key, value] of Object.entries(fields)) {
    const col = key === 'dueDate' ? 'due_date' : key === 'completedAt' ? 'completed_at' : key;
    if (!allowed.includes(col)) continue;
    updates.push(`${col} = ?`);
    params.push(value);
  }
  if (!updates.length) return findTodoById(id, userId);
  params.push(id, userId);
  await pool.query(`UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
  return findTodoById(id, userId);
}

export async function deleteTodo(id, userId) {
  const [result] = await pool.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
}
