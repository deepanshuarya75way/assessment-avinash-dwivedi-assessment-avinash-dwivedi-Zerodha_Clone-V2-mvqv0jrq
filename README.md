# Zerodha Clone

A full-stack stock trading application inspired by Zerodha, built with a React frontend, React dashboard, and Node.js/Express backend connected to MongoDB.

This project includes:

- A marketing landing page for Zerodha-style onboarding
- Signup, login, and forgot-password flows
- A user dashboard for holdings, positions, orders, funds, and apps
- MongoDB-backed persistence for account and order data

## Project Overview

The application is split into three separate apps:

1. `frontend/` — public-facing Zerodha landing page and signup experience
2. `dashboard/` — trading dashboard UI for holdings, positions, funds, and orders
3. `backend/` — Express API and MongoDB integration

This structure allows the landing page and trading dashboard to work independently while sharing the same backend services.

## Tech Stack

### Frontend
- React
- React Router
- CSS Modules / custom CSS

### Dashboard
- React
- React Router
- Material UI components
- Chart.js and react-chartjs-2

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS and dotenv

## Folder Structure

```bash
Zerodha Clone/
├── backend/
│   ├── model/
│   │   ├── HoldingsModel.js
│   │   ├── OrdersModel.js
│   │   ├── PositionsModel.js
│   │   └── UserModel.js
│   ├── schema/
│   │   ├── HoldingsSchema.js
│   │   ├── OrdersSchema.js
│   │   ├── PositionsSchema.js
│   │   └── UserSchema.js
│   ├── .env
│   ├── index.js
│   └── package.json
├── dashboard/
│   ├── public/
│   ├── src/
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── README.md
└── .gitignore
```

## Features

### Landing page
- Hero section and marketing layout
- Product and pricing pages
- About, support, and signup screens
- Registration UI styled like a Zerodha onboarding flow

### Authentication
- Sign up with user details
- Login with email and password
- Forgot-password flow
- Account state persistence using localStorage
- Redirect to dashboard after successful login/signup

### Dashboard
- Overview page
- Holdings
- Positions
- Orders
- Funds
- Apps and other sections

### Backend APIs
- Add sample holdings and positions
- Fetch holdings and positions
- Create orders
- Sign up user
- Login user
- Forgot-password flow

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- npm or yarn installed
- MongoDB Atlas connection string or a local MongoDB instance

## Environment Setup

### 1. Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../dashboard
npm install
```

### 2. Configure MongoDB

Create a `.env` file in the `backend` folder if it does not already exist:

```env
PORT=3002
MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

Example:

```env
PORT=3002
MONGO_URL=mongodb+srv://myuser:myPassword@cluster0.mongodb.net/zerodha-clone?retryWrites=true&w=majority
```

## Running the Project

### Start the backend

```bash
cd backend
npm start
```

The backend runs on:

```text
http://localhost:3002
```

### Start the frontend

```bash
cd frontend
npm start
```

The front-end landing app runs on:

```text
http://localhost:3000
```

### Start the dashboard

```bash
cd dashboard
PORT=3001 npm start
```

The dashboard runs on:

```text
http://localhost:3001
```

> The dashboard is intentionally run on port 3001 to avoid conflicts with the frontend React app on port 3000.

## API Endpoints

### Backend endpoints

#### GET
- `/addHoldings` — inserts sample holdings data
- `/addPositions` — inserts sample positions data
- `/allHoldings` — fetches holdings data
- `/allPositions` — fetches all positions

#### POST
- `/newOrder` — creates a new order
- `/signup` — creates a new user
- `/login` — logs in an existing user
- `/forgot-password` — validates a reset request for an email

Example signup request:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "password123",
  "pan": "ABCDE1234F",
  "city": "Mumbai"
}
```

## Authentication Flow

The signup flow is implemented as a Zerodha-inspired onboarding experience. After a successful signup or login, the app stores the logged-in user in `localStorage` and redirects the user to the dashboard.

The user can also log out, which returns them to the signup page.

## Notes

- The frontend and dashboard are separate CRA apps and must run on different ports.
- The backend is the main data source and should be started before testing login/signup or order flows.
- MongoDB connectivity is essential; if the backend shows a connection error, verify that the `MONGO_URL` is valid and the database user has the proper access.

## Contributing

1. Create a feature branch
2. Make changes
3. Test locally
4. Commit with a clear message
5. Push and open a pull request

## License

This project is for educational and demo purposes.
