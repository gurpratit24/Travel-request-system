const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const cache = new Map();
const CACHE_TIME = 30 * 1000; // 30 seconds

function getCache(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.time > CACHE_TIME) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    time: Date.now()
  });
}

function clearCache() {
  cache.clear();
}


// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    `SELECT id, Name AS name, email, role, manager_id
     FROM users
     WHERE email = ? AND password = ?`,
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      res.json({
        message: "Login successful",
        user: result[0]
      });
    }
  );
});


// CREATE REQUEST
app.post("/api/travel-requests", (req, res) => {
  const {
    employee_id,
    mode,
    start_date,
    end_date,
    destination
  } = req.body;

  if (!employee_id || !mode || !start_date || !end_date || !destination) {
    return res.status(400).json({
      message: "Please fill all fields"
    });
  }

  const sql = `
    INSERT INTO travel_requests
    (employee_id, Mode, Start_date, End_date, Destination, Status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `;

  db.query(
    sql,
    [employee_id, mode, start_date, end_date, destination],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      clearCache();

      res.json({
        message: "Travel request created successfully"
      });
    }
  );
});


// MY REQUESTS
app.get("/api/my-travel-requests/:employeeId", (req, res) => {
  const employeeId = req.params.employeeId;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 5, 1),
    100
  );

  const offset = (page - 1) * limit;
  const status = req.query.status || "";

  const cacheKey =
    `my-${employeeId}-${page}-${limit}-${status}`;

  const cached = getCache(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  let where = "WHERE employee_id = ?";
  const countParams = [employeeId];
  const dataParams = [employeeId];

  if (status) {
    where += " AND Status = ?";
    countParams.push(status);
    dataParams.push(status);
  }

  const countSql = `
    SELECT COUNT(*) AS total
    FROM travel_requests
    ${where}
  `;

  const dataSql = `
    SELECT *
    FROM travel_requests
    ${where}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({
        message: err.message
      });
    }

    const total = countResult[0].total;

    db.query(
      dataSql,
      [...dataParams, limit, offset],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: err.message
          });
        }

        const response = {
          requests: result,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };

        setCache(cacheKey, response);

        res.json(response);
      }
    );
  });
});


// REQUESTS RECEIVED
// Only pending requests from people reporting to this manager
app.get("/api/manager-requests/:managerId", (req, res) => {
  const managerId = req.params.managerId;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 5, 1),
    100
  );

  const offset = (page - 1) * limit;

  const cacheKey =
    `received-${managerId}-${page}-${limit}`;

  const cached = getCache(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const countSql = `
    SELECT COUNT(*) AS total
    FROM travel_requests tr
    JOIN users u ON tr.employee_id = u.id
    WHERE u.manager_id = ?
      AND tr.Status = 'PENDING'
  `;

  const dataSql = `
    SELECT
      tr.*,
      u.Name AS employee_name
    FROM travel_requests tr
    JOIN users u ON tr.employee_id = u.id
    WHERE u.manager_id = ?
      AND tr.Status = 'PENDING'
    ORDER BY tr.id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(
    countSql,
    [managerId],
    (err, countResult) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      const total = countResult[0].total;

      db.query(
        dataSql,
        [managerId, limit, offset],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: err.message
            });
          }

          const response = {
            requests: result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          };

          setCache(cacheKey, response);

          res.json(response);
        }
      );
    }
  );
});


// EDIT / APPROVE / REJECT
app.put("/api/travel-requests/:id", (req, res) => {
  const id = req.params.id;

  const {
    employee_id,
    manager_id,
    mode,
    start_date,
    end_date,
    destination,
    status
  } = req.body;


  // APPROVE / REJECT
  if (status) {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const sql = `
      UPDATE travel_requests tr
      JOIN users u ON tr.employee_id = u.id
      SET tr.Status = ?
      WHERE tr.id = ?
        AND tr.Status = 'PENDING'
        AND u.manager_id = ?
    `;

    db.query(
      sql,
      [status, id, manager_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: err.message
          });
        }

        if (result.affectedRows === 0) {
          return res.status(403).json({
            message: "You cannot approve or reject this request"
          });
        }

        clearCache();

        res.json({
          message: `Request ${status.toLowerCase()} successfully`
        });
      }
    );

    return;
  }


  // EDIT
  const sql = `
    UPDATE travel_requests
    SET Mode = ?,
        Start_date = ?,
        End_date = ?,
        Destination = ?
    WHERE id = ?
      AND employee_id = ?
      AND Status = 'PENDING'
  `;

  db.query(
    sql,
    [
      mode,
      start_date,
      end_date,
      destination,
      id,
      employee_id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "You cannot edit this request"
        });
      }

      clearCache();

      res.json({
        message: "Travel request updated successfully"
      });
    }
  );
});


// DELETE
app.delete("/api/travel-requests/:id", (req, res) => {
  const { employee_id } = req.body;

  db.query(
    `DELETE FROM travel_requests
     WHERE id = ?
       AND employee_id = ?`,
    [req.params.id, employee_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "You cannot delete this request"
        });
      }

      clearCache();

      res.json({
        message: "Travel request deleted successfully"
      });
    }
  );
});


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});