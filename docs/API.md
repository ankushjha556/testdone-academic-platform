# TestDone API Documentation

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.testdone.in/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Endpoints

#### POST /auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "Rahul",
  "lastName": "Sharma"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "..." },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  }
}
```

#### POST /auth/login
Authenticate user.

#### POST /auth/logout
Invalidate tokens.

#### POST /auth/refresh
Refresh access token.

#### GET /auth/me
Get current user profile.

---

## Exams

#### GET /exams
List all exams.

**Query Parameters:**
- `category` - Filter by category slug
- `featured` - Boolean, featured exams only
- `search` - Search by name
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

#### GET /exams/categories
List all exam categories.

#### GET /exams/:slug
Get exam details.

#### GET /exams/:slug/tests
Get tests for an exam.

---

## Mock Tests

#### GET /tests
List all tests.

**Query Parameters:**
- `exam` - Filter by exam slug
- `type` - FULL_LENGTH, SECTIONAL, TOPIC, PREVIOUS_YEAR
- `access` - FREE, PREMIUM

#### GET /tests/:slug
Get test details (requires auth).

#### POST /tests/:testId/start
Start a test attempt. Returns questions.

#### POST /tests/attempts/:attemptId/answer
Save an answer.

**Request Body:**
```json
{
  "questionId": "uuid",
  "selectedOption": "B",
  "isMarkedReview": false
}
```

#### POST /tests/attempts/:attemptId/submit
Submit test and get results.

#### GET /tests/results/:attemptId
Get detailed results.

---

## Questions

#### GET /questions
Get questions (requires auth).

**Query Parameters:**
- `subject` - Filter by subject slug
- `topic` - Filter by topic slug
- `difficulty` - EASY, MEDIUM, HARD
- `exam` - Filter by exam slug

#### GET /questions/:id/solution
Get solution for a question.

#### POST /questions/:id/bookmark
Toggle bookmark.

---

## Analytics

#### GET /analytics
Get user analytics.

#### GET /analytics/leaderboard
Get leaderboard.

---

## Admin Endpoints

All require admin role.

#### GET /admin/dashboard
Get admin dashboard stats.

#### GET/POST /admin/exams
Manage exams.

#### GET/POST /admin/questions
Manage questions.

#### GET/POST /admin/tests
Manage tests.

#### GET /admin/users
List users.

---

## Error Responses

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": []
  }
}
```

### Status Codes
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 429 - Too Many Requests
- 500 - Internal Server Error
