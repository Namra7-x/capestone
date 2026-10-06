import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import * as userModel from '../models/user.js';
import { signToken } from '../utils/jwt.js';
import { ConflictError, ValidationError } from '../utils/errors.js';
import config from '../config/index.js';

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email is too long'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

function formatErrors(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array({ onlyFirstError: true }));
  }
}

export const register = [
  ...registerRules,
  async (req, res, next) => {
    try {
      formatErrors(req);
      const { username, email, password } = req.body;

      const existingEmail = await userModel.findUserByEmail(email);
      if (existingEmail) throw new ConflictError('An account with this email already exists');

      const existingUsername = await userModel.findUserByUsername(username);
      if (existingUsername) throw new ConflictError('This username is already taken');

      const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);
      const userId = await userModel.createUser({ username, email, passwordHash });
      const user = await userModel.findUserById(userId);

      const token = signToken({ userId: user.id });
      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: userModel.toPublicUser(user),
      });
    } catch (err) {
      next(err);
    }
  },
];

export const login = [
  ...loginRules,
  async (req, res, next) => {
    try {
      formatErrors(req);
      const { email, password } = req.body;

      const user = await userModel.findUserByEmail(email);
      if (!user) {
        await bcrypt.hash(password, config.bcryptSaltRounds);
        throw new ValidationError('Invalid email or password');
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new ValidationError('Invalid email or password');

      const token = signToken({ userId: user.id });
      res.json({
        message: 'Logged in successfully',
        token,
        user: userModel.toPublicUser(user),
      });
    } catch (err) {
      next(err);
    }
  },
];

export const me = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.user.userId);
    if (!user) throw new ValidationError('User no longer exists', [], 401);
    res.json({ user: userModel.toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};
