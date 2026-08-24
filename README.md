# My Personal Goals

A full-stack goal-tracking web application that allows users to create, manage, and track their personal goals.

The application provides user authentication, personalized goal management, goal priorities, deadlines, completion tracking, and progress statistics through a responsive and user-friendly interface.

## Features

User Authentication

User registration

Secure password hashing with bcrypt

User login

JWT-based authentication

Protected goal routes

User-specific goals

Goal Management

Add personal goals

Set goal duration

Leave duration empty for goals with an unknown deadline

Automatically calculate expected finish dates

Edit existing goals

Delete goals

Mark goals as completed

Record completion dates

View completed goals

View overdue goals

Filter goals by priority

Goal Priorities

Goals can be categorized into:

Low,Medium,High

Each priority has its own visual styling to make goals easier to identify.

## Technologies

-Frontend: HTML5, CSS3, JavaScript, Vue.js 3

-Backend: Node.js, Express.js, REST API, JWT, bcrypt, CORS

## Database
PostgreSQL

## API

The backend provides REST API endpoints for authentication and goal management.

## Authentication
POST /api/register — Create a new user account

POST /api/login — Log in and receive a JWT

## Goals
GET /api/goals — Retrieve the logged-in user's goals

POST /api/goals — Create a new goal

PUT /api/goals/:id — Update a goal

DELETE /api/goals/:id — Delete a goal

## Database
GET /api/test-db — Test the database connection

## Security

The application uses:

bcrypt for password hashing,

JSON Web Tokens (JWT) for authentication,

Protected API routes,

User-specific database queries

Users can only access and manage their own goals.

## Current version

The application is currently running as a full-stack local web application with:

Vue.js frontend, 
Node.js and Express backend, 
PostgreSQL database, 
REST API, 
JWT authentication, 
User-specific goal storage

## Future plans

Possible future improvements include:

Cloud deployment,

Online database hosting,

Improved dashboard and analytics,

Goal progress tracking,

Recurring goals,

Notifications and reminders,

Improved accessibility,

Additional personalization options

## Author

Developed as a personal full-stack web development project.

## Screenshots:

