import { useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  const [mode, setMode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destination, setDestination] = useState("");

  const [myRequests, setMyRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [page, setPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);

  const [limit, setLimit] = useState(5);
  const [receivedLimit, setReceivedLimit] = useState(5);

  const [totalPages, setTotalPages] = useState(1);
  const [receivedTotalPages, setReceivedTotalPages] = useState(1);

  const [currentPage, setCurrentPage] = useState("home");


  const canCreate =
    user &&
    (user.role === "employee" || user.role === "manager");


  const isManager =
    user &&
    (
      user.role === "manager" ||
      user.role === "Senior_manager" ||
      user.role === "senior_manager"
    );


  // LOGIN
  function login() {
    fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          setMessage(data.message);
          return;
        }

        setUser(data.user);
        setMessage("");

        setCurrentPage(
          data.user.role === "Senior_manager" ||
          data.user.role === "senior_manager"
            ? "received"
            : "home"
        );

        loadMyRequests(data.user, 1, limit);

        if (
          data.user.role === "manager" ||
          data.user.role === "Senior_manager" ||
          data.user.role === "senior_manager"
        ) {
          loadReceivedRequests(data.user, 1, receivedLimit);
        }
      })
      .catch(() => setMessage("Server error"));
  }


  // MY REQUESTS
  function loadMyRequests(
    currentUser = user,
    selectedPage = page,
    selectedLimit = limit,
    status = ""
  ) {
    if (!currentUser) return;

    fetch(
      `${API}/my-travel-requests/${currentUser.id}?page=${selectedPage}&limit=${selectedLimit}&status=${status}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMyRequests(data.requests || []);
        setPage(data.page || 1);
        setLimit(data.limit || selectedLimit);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setMessage("Server error"));
  }


  // RECEIVED REQUESTS
  function loadReceivedRequests(
    currentUser = user,
    selectedPage = receivedPage,
    selectedLimit = receivedLimit
  ) {
    if (!currentUser) return;

    fetch(
      `${API}/manager-requests/${currentUser.id}?page=${selectedPage}&limit=${selectedLimit}`
    )
      .then((res) => res.json())
      .then((data) => {
        setReceivedRequests(data.requests || []);
        setReceivedPage(data.page || 1);
        setReceivedLimit(data.limit || selectedLimit);
        setReceivedTotalPages(data.totalPages || 1);
      })
      .catch(() => setMessage("Server error"));
  }


  // DATE
  function validDate(date) {
    return /^\d{2}-\d{2}-\d{4}$/.test(date);
  }


  function toMysqlDate(date) {
    const [day, month, year] = date.split("-");
    return `${year}-${month}-${day}`;
  }


  function displayDate(date) {
    if (!date) return "";

    const value = String(date).split("T")[0];

    if (value.includes("-")) {
      const parts = value.split("-");

      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    return value;
  }


  // SAVE / EDIT
  function saveRequest() {
    if (!mode || !startDate || !endDate || !destination) {
      setMessage("Please fill all fields");
      return;
    }

    if (!validDate(startDate) || !validDate(endDate)) {
      setMessage("Use DD-MM-YYYY format");
      return;
    }

    const data = {
      employee_id: user.id,
      mode,
      start_date: toMysqlDate(startDate),
      end_date: toMysqlDate(endDate),
      destination
    };

    const url = editingId
      ? `${API}/travel-requests/${editingId}`
      : `${API}/travel-requests`;

    fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((res) => res.json())
      .then((result) => {
        setMessage(result.message);

        if (
          result.message === "Travel request created successfully" ||
          result.message === "Travel request updated successfully"
        ) {
          clearForm();
          loadMyRequests(user, 1, limit);
          setCurrentPage("my");
        }
      })
      .catch(() => setMessage("Server error"));
  }


  // EDIT
  function editRequest(request) {
    setEditingId(request.id);
    setMode(request.Mode);
    setStartDate(displayDate(request.Start_date));
    setEndDate(displayDate(request.End_date));
    setDestination(request.Destination);
    setMessage("");
    setCurrentPage("submit");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  // DELETE
  function deleteRequest(id) {
    if (!window.confirm("Delete this travel request?")) return;

    fetch(`${API}/travel-requests/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employee_id: user.id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        loadMyRequests(user, page, limit);
      })
      .catch(() => setMessage("Server error"));
  }


  // APPROVE / REJECT
  function updateRequest(id, status) {
    fetch(`${API}/travel-requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status,
        manager_id: user.id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        loadReceivedRequests(user, receivedPage, receivedLimit);
      })
      .catch(() => setMessage("Server error"));
  }


  function clearForm() {
    setEditingId(null);
    setMode("");
    setStartDate("");
    setEndDate("");
    setDestination("");
  }


  function logout() {
    setUser(null);
    setEmail("");
    setPassword("");
    setMyRequests([]);
    setReceivedRequests([]);
    clearForm();
    setMessage("");
  }


  // PAGINATION
  function changeLimit(value) {
    const newLimit = Number(value);

    setLimit(newLimit);
    setPage(1);
    loadMyRequests(user, 1, newLimit);
  }


  function changeReceivedLimit(value) {
    const newLimit = Number(value);

    setReceivedLimit(newLimit);
    setReceivedPage(1);
    loadReceivedRequests(user, 1, newLimit);
  }


  // LOGIN
  if (!user) {
    return (
      <div className="app">
        <div className="login-box">

          <h1>Travel Request System</h1>

          <h2>Login</h2>

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="main-button login-button"
            onClick={login}
          >
            Login
          </button>

          {message && (
            <p className="message">{message}</p>
          )}

        </div>
      </div>
    );
  }


  // DASHBOARD
  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>Travel Request System</h1>
          <p>
            Welcome, <b>{user.name}</b>
          </p>
          <p>
            Role: <b>{user.role}</b>
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </header>


      {/* NAVIGATION */}
      <nav className="navbar">

        {canCreate && (
          <button
            className={currentPage === "submit" ? "nav-active" : ""}
            onClick={() => {
              setCurrentPage("submit");
              setMessage("");
            }}
          >
            Submit Request
          </button>
        )}

        {canCreate && (
          <button
            className={currentPage === "my" ? "nav-active" : ""}
            onClick={() => {
              setCurrentPage("my");
              loadMyRequests(user, 1, limit);
              setMessage("");
            }}
          >
            My Requests
          </button>
        )}

        {canCreate && (
          <button
            className={currentPage === "approved" ? "nav-active" : ""}
            onClick={() => {
              setCurrentPage("approved");
              loadMyRequests(user, 1, limit, "APPROVED");
              setMessage("");
            }}
          >
            Approved Requests
          </button>
        )}

        {isManager && (
          <button
            className={currentPage === "received" ? "nav-active" : ""}
            onClick={() => {
              setCurrentPage("received");
              loadReceivedRequests(user, 1, receivedLimit);
              setMessage("");
            }}
          >
            Requests Received
          </button>
        )}

      </nav>


      <main className="dashboard">

        {message && (
          <p className="message">{message}</p>
        )}


        {/* SUBMIT */}
        {currentPage === "submit" && canCreate && (
          <div className="section">

            <h2>
              {editingId
                ? "Edit Travel Request"
                : "Create Travel Request"}
            </h2>

            <label>Mode of Transport</label>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="" disabled>
                Select transport
              </option>
              <option value="Flight">Flight</option>
              <option value="Train">Train</option>
              <option value="Bus">Bus</option>
              <option value="Car">Car</option>
            </select>


            <label>Departure Date</label>

            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />


            <label>Arrival Date</label>

            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />


            <label>Destination</label>

            <input
              type="text"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />


            <div className="form-buttons">

              <button
                className="main-button"
                onClick={saveRequest}
              >
                {editingId
                  ? "Update Request"
                  : "Submit Request"}
              </button>

              {editingId && (
                <button
                  className="cancel-button"
                  onClick={() => {
                    clearForm();
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
              )}

            </div>

          </div>
        )}


        {/* MY REQUESTS */}
        {currentPage === "my" && canCreate && (
          <RequestList
            title="My Travel Requests"
            requests={myRequests}
            page={page}
            totalPages={totalPages}
            limit={limit}
            onLimitChange={changeLimit}
            onPageChange={(p) => {
              setPage(p);
              loadMyRequests(user, p, limit);
            }}
            onEdit={editRequest}
            onDelete={deleteRequest}
          />
        )}


        {/* APPROVED */}
        {currentPage === "approved" && canCreate && (
          <RequestList
            title="My Approved Requests"
            requests={myRequests}
            page={page}
            totalPages={totalPages}
            limit={limit}
            onLimitChange={(value) => {
              const newLimit = Number(value);
              setLimit(newLimit);
              setPage(1);
              loadMyRequests(user, 1, newLimit, "APPROVED");
            }}
            onPageChange={(p) => {
              setPage(p);
              loadMyRequests(user, p, limit, "APPROVED");
            }}
            approvedOnly
          />
        )}


        {/* RECEIVED */}
        {currentPage === "received" && isManager && (
          <div className="section">

            <h2>Requests Received</h2>

            <div className="pagination-top">
              <label>
                Requests per page:
                <select
                  value={receivedLimit}
                  onChange={(e) =>
                    changeReceivedLimit(e.target.value)
                  }
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </label>
            </div>


            {receivedRequests.length === 0 ? (
              <p>No pending requests received.</p>
            ) : (
              receivedRequests.map((request) => (
                <div
                  className="request-card"
                  key={request.id}
                >

                  <p>
                    <b>Sent By:</b>{" "}
                    {request.employee_name}
                  </p>

                  <p>
                    <b>Destination:</b>{" "}
                    {request.Destination}
                  </p>

                  <p>
                    <b>Transport:</b>{" "}
                    {request.Mode}
                  </p>

                  <p>
                    <b>Departure:</b>{" "}
                    {displayDate(request.Start_date)}
                  </p>

                  <p>
                    <b>Arrival:</b>{" "}
                    {displayDate(request.End_date)}
                  </p>

                  <p>
                    <b>Status:</b>{" "}
                    {request.Status}
                  </p>

                  <div className="action-buttons">

                    <button
                      className="approve-button"
                      onClick={() =>
                        updateRequest(
                          request.id,
                          "APPROVED"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="reject-button"
                      onClick={() =>
                        updateRequest(
                          request.id,
                          "REJECTED"
                        )
                      }
                    >
                      Reject
                    </button>

                  </div>

                </div>
              ))
            )}


            <Pagination
              page={receivedPage}
              totalPages={receivedTotalPages}
              onPageChange={(p) => {
                setReceivedPage(p);
                loadReceivedRequests(
                  user,
                  p,
                  receivedLimit
                );
              }}
            />

          </div>
        )}

      </main>

    </div>
  );
}


// REQUEST LIST
function RequestList({
  title,
  requests,
  page,
  totalPages,
  limit,
  onLimitChange,
  onPageChange,
  onEdit,
  onDelete,
  approvedOnly = false
}) {
  return (
    <div className="section">

      <h2>{title}</h2>

      <div className="pagination-top">

        <label>
          Requests per page:
          <select
            value={limit}
            onChange={(e) =>
              onLimitChange(e.target.value)
            }
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </label>

      </div>


      {requests.length === 0 ? (
        <p>
          {approvedOnly
            ? "No approved requests yet."
            : "No travel requests yet."}
        </p>
      ) : (
        requests.map((request) => (
          <div
            className="request-card"
            key={request.id}
          >

            <p>
              <b>Name:</b>{" "}
              {request.employee_name || "You"}
            </p>

            <p>
              <b>Destination:</b>{" "}
              {request.Destination}
            </p>

            <p>
              <b>Transport:</b>{" "}
              {request.Mode}
            </p>

            <p>
              <b>Departure:</b>{" "}
              {displayDate(request.Start_date)}
            </p>

            <p>
              <b>Arrival:</b>{" "}
              {displayDate(request.End_date)}
            </p>

            <p>
              <b>Status:</b>{" "}
              <span className="status">
                {request.Status}
              </span>
            </p>


            {!approvedOnly &&
              request.Status === "PENDING" &&
              onEdit && (
                <button
                  className="edit-button"
                  onClick={() => onEdit(request)}
                >
                  Edit
                </button>
              )}


            {!approvedOnly && onDelete && (
              <button
                className="delete-button"
                onClick={() => onDelete(request.id)}
              >
                Delete
              </button>
            )}

          </div>
        ))
      )}


      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

    </div>
  );
}


// PAGINATION
function Pagination({
  page,
  totalPages,
  onPageChange
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">

      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>

    </div>
  );
}


// DATE DISPLAY
function displayDate(date) {
  if (!date) return "";

  const value = String(date).split("T")[0];

  if (value.includes("-")) {
    const parts = value.split("-");

    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return value;
}


export default App;