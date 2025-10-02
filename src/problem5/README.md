# CRUD API with Express.js, TypeScript, and SQLite

A RESTful API built with Express.js, TypeScript, and SQLite that provides full CRUD (Create, Read, Update, Delete) operations for managing resources.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ RESTful API design
- ✅ SQLite database for data persistence
- ✅ TypeScript for type safety
- ✅ Basic filtering support (name, category, status)
- ✅ Error handling and validation
- ✅ CORS enabled
- ✅ Environment variable configuration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository and navigate to the project directory:
```bash
cd src/problem5
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
cp .env.example .env
```

You can modify the PORT in the `.env` file (default is 3000).

## Running the Application

### Development Mode

Run with hot reload:
```bash
npm run dev
```

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Project Structure

```
src/problem5/
├── src/
│   ├── controllers/
│   │   └── resourceController.ts    # Business logic for CRUD operations
│   ├── database/
│   │   └── connection.ts            # SQLite database connection and schema
│   ├── models/
│   │   └── resource.ts              # TypeScript interfaces
│   ├── routes/
│   │   └── resourceRoutes.ts        # API route definitions
│   └── index.ts                     # Application entry point
├── .env.example                     # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### 1. Create a Resource
**POST** `/api/resources`

**Request Body:**
```json
{
  "name": "My Resource",
  "description": "Resource description",
  "category": "electronics",
  "status": "active"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "My Resource",
  "description": "Resource description",
  "category": "electronics",
  "status": "active",
  "message": "Resource created successfully"
}
```

### 2. List Resources (with Filters)
**GET** `/api/resources`

**Query Parameters:**
- `name` (optional): Filter by name (partial match)
- `category` (optional): Filter by category (exact match)
- `status` (optional): Filter by status (exact match)

**Examples:**
```bash
# Get all resources
GET /api/resources

# Filter by name
GET /api/resources?name=laptop

# Filter by category
GET /api/resources?category=electronics

# Filter by status
GET /api/resources?status=active

# Combine filters
GET /api/resources?category=electronics&status=active
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "My Resource",
      "description": "Resource description",
      "category": "electronics",
      "status": "active",
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    }
  ],
  "count": 1
}
```

### 3. Get a Single Resource
**GET** `/api/resources/:id`

**Response:**
```json
{
  "id": 1,
  "name": "My Resource",
  "description": "Resource description",
  "category": "electronics",
  "status": "active",
  "created_at": "2024-01-01 12:00:00",
  "updated_at": "2024-01-01 12:00:00"
}
```

### 4. Update a Resource
**PUT** `/api/resources/:id`

**Request Body:** (all fields are optional)
```json
{
  "name": "Updated Resource",
  "description": "Updated description",
  "category": "books",
  "status": "inactive"
}
```

**Response:**
```json
{
  "message": "Resource updated successfully",
  "changes": 1
}
```

### 5. Delete a Resource
**DELETE** `/api/resources/:id`

**Response:**
```json
{
  "message": "Resource deleted successfully"
}
```

## Testing the API

### Using cURL

```bash
# Create a resource
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"Dell XPS 15","category":"electronics","status":"active"}'

# List all resources
curl http://localhost:3000/api/resources

# Get a specific resource
curl http://localhost:3000/api/resources/1

# Update a resource
curl -X PUT http://localhost:3000/api/resources/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Laptop","status":"inactive"}'

# Delete a resource
curl -X DELETE http://localhost:3000/api/resources/1

# Filter resources
curl "http://localhost:3000/api/resources?category=electronics&status=active"
```

### Using Postman or Thunder Client

1. Import the following endpoints:
   - POST `http://localhost:3000/api/resources`
   - GET `http://localhost:3000/api/resources`
   - GET `http://localhost:3000/api/resources/:id`
   - PUT `http://localhost:3000/api/resources/:id`
   - DELETE `http://localhost:3000/api/resources/:id`

2. Set headers:
   - `Content-Type: application/json`

## Database Schema

The SQLite database contains a `resources` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| name | TEXT | Resource name (required) |
| description | TEXT | Resource description (optional) |
| category | TEXT | Resource category (optional) |
| status | TEXT | Resource status (default: 'active') |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

The database file (`database.sqlite`) is automatically created in the project root on first run.

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Missing required fields or invalid data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Database or server errors

Example error response:
```json
{
  "error": "Resource not found"
}
```

## Technologies Used

- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **SQLite3**: Lightweight database
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **ts-node**: TypeScript execution
- **nodemon**: Development auto-reload
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library

## Testing

The project includes comprehensive tests for all CRUD operations using Jest and Supertest.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The test suite includes:

- ✅ **21 test cases** covering all CRUD operations
- ✅ Resource creation with validation
- ✅ Listing resources with multiple filter combinations
- ✅ Getting single resources
- ✅ Updating resources (full and partial updates)
- ✅ Deleting resources
- ✅ Error handling (404, 400 errors)
- ✅ Health check and API info endpoints

Example test output:

```text
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
```

### Test Structure

Tests use an in-memory SQLite database to ensure:

- Fast test execution
- No side effects on production data
- Isolated test environment
- Clean state for each test

## Development

### Build

```bash
npm run build
```

This compiles TypeScript files to JavaScript in the `dist/` directory.

### Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Run production server
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report

## License

ISC
