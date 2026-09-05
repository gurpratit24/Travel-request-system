# Travel Request Management System

A full-stack web application for managing employee travel requests.  
The system allows employees to submit and manage travel requests, while managers can review, approve, or reject requests from their team.

## Features

- Role-based login and dashboards
- Create travel requests
- View personal travel requests
- Edit pending requests
- Delete travel requests
- View requests received by managers
- Approve or reject requests
- Track request status
- View requester and travel details
- REST API integration
- MySQL database integration

## Tech Stack

**Frontend:** React, JavaScript, CSS, Vite  
**Backend:** Node.js, Express.js  
**Database:** MySQL

## Application Flow

The application follows a simple full-stack architecture:

**React Frontend → Express REST API → MySQL Database**

Users interact with the React interface.  
The frontend communicates with the Express backend through REST APIs, and the backend handles the application logic and database operations.

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
└── README.md
