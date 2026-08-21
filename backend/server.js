const express = require('express');
const pool = require('./db');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(express.json());



// GET all goals
app.get('/api/goals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM goals ORDER BY created_at DESC'
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
app.post('/api/goals', async (req, res) => {
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
       (title, duration, finish_date, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, duration, finishDate, priority]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to create goal'
    });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
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
       WHERE id = $7
       RETURNING *`,
      [
        title,
        duration,
        finishDate,
        priority,
        completed,
        completedDate,
        goalId
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

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const goalId = Number(req.params.id);

    if (!Number.isInteger(goalId) || goalId <= 0) {
        return res.status(400).json({
            message: 'Invalid goal ID'
        });
    }

    const result = await pool.query(
      `DELETE FROM goals
       WHERE id = $1
       RETURNING *`,
      [goalId]
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});