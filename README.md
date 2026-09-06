
# Travel Request Management System

A full-stack web application for managing employee travel requests from submission to approval.

The system provides role-based access for employees, managers, and senior managers. Employees can create and manage their travel requests, while managers can review, approve, or reject requests submitted by their team members.

---

## Features

### Authentication & Role-Based Access

- User login with role-based access
- Employee, Manager, and Senior Manager roles
- Manager access to requests submitted by their team
- Reporting structure based on manager relationships

### Travel Request Management

- Create new travel requests
- View personal travel requests
- Edit pending requests
- Delete personal requests
- Track request status
- View travel mode, dates, and destination
- Requester name displayed for manager review

### Manager Operations

- View pending requests from team members
- Review requester and travel details
- Approve or reject requests
- Approved/rejected requests are removed from the manager's pending list
- Employees can still see the updated status of their submitted requests

### Pagination & Filtering

- Server-side pagination for travel requests
- Configurable page size
- Status-based filtering for personal requests
- Total request count and total page count returned by the API
- SQL `LIMIT` and `OFFSET` used for efficient data retrieval

### Server-Side Caching

- In-memory caching using JavaScript `Map`
- Cached responses are reused for up to 30 seconds
- Separate cache keys are generated based on request parameters
- Cache keys include user/manager ID, page, page size, and status where applicable
- Cache is cleared whenever request data is created, updated, approved, rejected, or deleted

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React** | Frontend user interface |
| **JavaScript** | Application logic |
| **CSS** | Styling and UI |
| **Vite** | Frontend development and build tool |
| **Node.js** | Backend runtime |
| **Express.js** | REST API and server-side logic |
| **MySQL** | Database and data storage |
| **Git & GitHub** | Version control and repository hosting |

---

## Application Architecture

```text
React Frontend
React + Vite + CSS
       │
       │ HTTP / REST API
       ▼
Express Backend
Node.js + Express.js
       │
       │ SQL Queries
       ▼
MySQL Database
````

### Application Flow

1. A user logs in through the React frontend.
2. The frontend sends the login details to the Express backend.
3. The backend validates the user against the MySQL database.
4. Based on the user's role, the appropriate functionality is displayed.
5. Employees can create, edit, delete, and view their travel requests.
6. Managers can view pending requests submitted by their team members.
7. Managers can approve or reject pending requests.
8. The request status is updated in MySQL and reflected on the employee's dashboard.
9. Pagination, filtering, and server-side caching are handled by the backend.

---

## Project Structure

```text
Travel-request-system/
│
├── Frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── backend/
│   ├── server.js
│   ├── db.js
│   └── package.json
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## REST API

The Express backend provides RESTful endpoints for authentication and travel request management.

| Method   | Endpoint                              | Purpose                            |
| -------- | ------------------------------------- | ---------------------------------- |
| `POST`   | `/api/login`                          | Authenticate a user                |
| `POST`   | `/api/travel-requests`                | Create a travel request            |
| `GET`    | `/api/my-travel-requests/:employeeId` | Retrieve personal requests         |
| `GET`    | `/api/manager-requests/:managerId`    | Retrieve pending team requests     |
| `PUT`    | `/api/travel-requests/:id`            | Edit, approve, or reject a request |
| `DELETE` | `/api/travel-requests/:id`            | Delete a personal request          |

### Pagination

The request APIs support server-side pagination using `page` and `limit` query parameters.

Example:

```text
/api/my-travel-requests/1?page=1&limit=5
```

If there are 6 requests and the page size is 5:

```text
Page 1 → 5 requests
Page 2 → 1 request
```

The API returns:

* Requests for the selected page
* Total number of requests
* Current page
* Page size
* Total number of pages

### Filtering

Personal requests can be filtered by status.

Example:

```text
/api/my-travel-requests/1?page=1&limit=5&status=PENDING
```

Supported statuses include:

```text
PENDING
APPROVED
REJECTED
```

---

## User Roles

### Employee

Employees can:

* Log in
* Create travel requests
* View their own requests
* Edit pending requests
* Delete their requests
* Filter requests by status
* Navigate through paginated results
* Track approval or rejection status

### Manager

Managers can:

* Log in
* Manage their own travel requests
* View pending requests from their team
* View requester and travel information
* Approve or reject requests

Once a manager approves or rejects a request, it is no longer shown in their pending requests list. The employee who submitted it can still see the updated status.

### Senior Manager

Senior managers are supported through the role and reporting structure stored in the database.

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MySQL
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/gurpratit24/Travel-request-system.git
cd Travel-request-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure MySQL

Make sure MySQL is running and the required database and tables are available.

Update the database connection details in:

```text
backend/db.js
```

### 4. Start the Backend

From the `backend` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:3000
```

### 5. Start the Frontend

Open a new terminal:

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs on the Vite development server, usually:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

---

## Demo Credentials

The following accounts can be used to test the different roles:

| Role           | Name    | Email                                         | Password |
| -------------- | ------- | --------------------------------------------- | -------- |
| Employee       | Sarah   | [sarah@gmail.com](mailto:sarah@gmail.com)     | 1234     |
| Employee       | Mike    | [mike@gmail.com](mailto:mike@gmail.com)       | 1234     |
| Manager        | John    | [john2@gmail.com](mailto:john2@gmail.com)     | 1234     |
| Senior Manager | Jessica | [jessica@gmail.com](mailto:jessica@gmail.com) | 1234     |


---

## Author

**Gurpratit Kaur Saluja**

GitHub Repository:
[https://github.com/gurpratit24/Travel-request-system](https://github.com/gurpratit24/Travel-request-system)

