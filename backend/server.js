const express = require('express');
const pool = require('./db');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(express.json());



// GET all goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
    `SELECT * FROM goals
    WHERE user_id = $1
    ORDER BY created_at DESC`,
    [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch goals'
    });
  }
});

// POST a new goal
app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      duration,
      finishDate,
      priority
    } = req.body;
        if (!title || title.trim() === '') {
      return res.status(400).json({
        message: 'Goal title is required'
      });
    }

    if (
      duration !== null &&
      duration !== undefined &&
      Number(duration) < 1
    ) {
      return res.status(400).json({
        message: 'Duration must be at least 1 day'
      });
    }

    const validPriorities = ['low', 'medium', 'high'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        message: 'Invalid priority'
      });
    }

    const result = await pool.query(
      `INSERT INTO goals
    (title, duration, finish_date, priority, user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [title, duration, finishDate, priority, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to create goal'
    });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {  try {
    const goalId = Number(req.params.id);

    const {
      title,
      duration,
      finishDate,
      priority,
      completed,
      completedDate
    } = req.body;

    if (!title || title.trim() === '') {
  return res.status(400).json({
    message: 'Goal title is required'
  });
}

if (
  duration !== null &&
  duration !== undefined &&
  Number(duration) < 1
) {
  return res.status(400).json({
    message: 'Duration must be at least 1 day'
  });
}

const validPriorities = ['low', 'medium', 'high'];

if (!validPriorities.includes(priority)) {
  return res.status(400).json({
    message: 'Invalid priority'
  });
}

    const result = await pool.query(
      `UPDATE goals
       SET title = $1,
           duration = $2,
           finish_date = $3,
           priority = $4,
           completed = $5,
           completed_date = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        title,
        duration,
        finishDate,
        priority,
        completed,
        completedDate,
        goalId,
        req.user.userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to update goal'
    });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {  try {
    const goalId = Number(req.params.id);

    if (!Number.isInteger(goalId) || goalId <= 0) {
        return res.status(400).json({
            message: 'Invalid goal ID'
        });
    }

    const result = await pool.query(
      `DELETE FROM goals
        WHERE id = $1 AND user_id = $2
       RETURNING *`,
        [goalId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    res.json({
      message: 'Goal deleted successfully',
      goal: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to delete goal'
    });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      message: 'Database connected!',
      time: result.rows[0].now
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Database connection failed'
    });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one uppercase letter'
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one lowercase letter'
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one number'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one special character'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, hashedPassword]
    );

    res.status(201).json({
      message: 'Account created successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to create account'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Password is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    res.json({
      message: 'Login successful',
      token
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to login'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});