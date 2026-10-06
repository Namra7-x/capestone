import { body, param, query, validationResult } from 'express-validator';
import * as todoModel from '../models/todo.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['active', 'completed'];
const SORTS = ['created_desc', 'created_asc', 'updated_desc', 'due_asc', 'due_desc', 'priority_desc', 'title_asc'];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array({ onlyFirstError: true }));
  }
}

const idRule = param('id').isInt({ gt: 0 }).withMessage('Todo id must be a positive integer');

const todoBodyRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer'),
  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage('Priority must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(STATUSES).withMessage('Status must be active or completed'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO date (YYYY-MM-DD)'),
];

const listQueryRules = [
  query('status').optional().isIn(STATUSES).withMessage('Status filter must be active or completed'),
  query('priority').optional().isIn(PRIORITIES).withMessage('Priority filter is invalid'),
  query('due').optional().isIn(['today', 'upcoming', 'overdue']).withMessage('Due filter is invalid'),
  query('sort').optional().isIn(SORTS).withMessage('Sort option is invalid'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query is too long'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be 1-500'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer'),
];

export const list = [
  ...listQueryRules,
  async (req, res, next) => {
    try {
      validate(req);
      const filters = { ...req.query };
      const [todos, total] = await Promise.all([
        todoModel.listTodos(req.user.userId, filters),
        todoModel.countTodos(req.user.userId, filters),
      ]);
      res.json({ todos, total });
    } catch (err) {
      next(err);
    }
  },
];

export const stats = async (req, res, next) => {
  try {
    const stats = await todoModel.getTodoStats(req.user.userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const show = [
  idRule,
  async (req, res, next) => {
    try {
      validate(req);
      const todo = await todoModel.findTodoById(Number(req.params.id), req.user.userId);
      if (!todo) throw new NotFoundError('Todo not found');
      res.json(todo);
    } catch (err) {
      next(err);
    }
  },
];

export const create = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  ...todoBodyRules.slice(1),
  async (req, res, next) => {
    try {
      validate(req);
      const { title, description, priority, dueDate } = req.body;
      const todo = await todoModel.createTodo(req.user.userId, {
        title,
        description: description || null,
        priority: priority || 'medium',
        dueDate: dueDate || null,
      });
      res.status(201).json(todo);
    } catch (err) {
      next(err);
    }
  },
];

export const update = [
  idRule,
  ...todoBodyRules,
  async (req, res, next) => {
    try {
      validate(req);
      const fields = {};
      const { title, description, priority, status, dueDate } = req.body;
      if (title !== undefined) fields.title = title;
      if (description !== undefined) fields.description = description;
      if (priority !== undefined) fields.priority = priority;
      if (status !== undefined) {
        fields.status = status;
        fields.completedAt = status === 'completed' ? new Date() : null;
      }
      if (dueDate !== undefined) fields.dueDate = dueDate;

      const todo = await todoModel.updateTodo(Number(req.params.id), req.user.userId, fields);
      if (!todo) throw new NotFoundError('Todo not found');
      res.json(todo);
    } catch (err) {
      next(err);
    }
  },
];

export const toggle = [
  idRule,
  async (req, res, next) => {
    try {
      validate(req);
      const todo = await todoModel.findTodoById(Number(req.params.id), req.user.userId);
      if (!todo) throw new NotFoundError('Todo not found');
      const nextStatus = todo.status === 'completed' ? 'active' : 'completed';
      const updated = await todoModel.updateTodo(todo.id, req.user.userId, {
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date() : null,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
];

export const remove = [
  idRule,
  async (req, res, next) => {
    try {
      validate(req);
      const deleted = await todoModel.deleteTodo(Number(req.params.id), req.user.userId);
      if (!deleted) throw new NotFoundError('Todo not found');
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
];
