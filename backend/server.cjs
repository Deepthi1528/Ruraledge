require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Initialize Express + HTTP Server
const app = express();
const server = http.createServer(app);

// Setup Socket.IO for real-time complaint updates
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// -------------------------
// Database Connection
// -------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "rural360",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// -------------------------
// Ensure Upload Folders Exist
// -------------------------
const uploadsRoot = path.join(__dirname, "uploads");
const complaintsDir = path.join(uploadsRoot, "complaints");
const resolutionsDir = path.join(uploadsRoot, "resolutions");
const messagesDir = path.join(uploadsRoot, "messages");

[uploadsRoot, complaintsDir, resolutionsDir, messagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// -------------------------
// Multer Setup
// -------------------------
const storageComplaints = multer.diskStorage({
  destination: (req, file, cb) => cb(null, complaintsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const storageResolutions = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resolutionsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const storageMessages = multer.diskStorage({
  destination: (req, file, cb) => cb(null, messagesDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const uploadComplaint = multer({ storage: storageComplaints });
const uploadResolution = multer({ storage: storageResolutions });
const uploadMessageAttachment = multer({ storage: storageMessages });

app.use("/uploads", express.static(uploadsRoot));


// -------------------------
// Nodemailer Setup
// -------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendEmailSafe({ to, subject, text }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (err) {
    console.error("Email send failed:", err?.message || err);
  }
}

// -------------------------
// Helpers
// -------------------------
function sendServerError(res, err, status = 500) {
  const message = (err && (err.sqlMessage || err.message)) || "Internal server error";
  console.error("Server Error:", err);
  return res.status(status).json({ error: message });
}

function makePublicUrl(req, relativePath) {
  if (!relativePath) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${relativePath}`;
}

// -------------------------
// Authentication Middleware
// -------------------------
function authenticateToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
  if (err) return res.status(401).json({ error: "Invalid or expired token" });

  req.user = payload;

  // ✅ Normalize user_id → id for consistency
  if (payload.user_id && !payload.id) {
    req.user.id = payload.user_id;
  }

  next();
});

}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ error: "Access denied" });
    next();
  };
}

const authenticateAdmin = [authenticateToken, requireRole("admin")];
const authenticateStaff = [authenticateToken, requireRole("staff")];
const authenticateUser = [authenticateToken, requireRole("user")];

// -------------------------
// SOCKET.IO REAL-TIME EVENTS
// -------------------------
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("joinStaffRoom", (staffId) => {
    if (staffId) {
      socket.join(`staff_${staffId}`);
      console.log(`✅ Staff ${staffId} joined their room`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
// -------------------------
// Auth / verify endpoint
// -------------------------
app.get('/auth/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, role: req.user.role, id: req.user.id, name: req.user.name });
});
// Detect language function
function detectLanguage(text) {
  const kannadaRegex = /[\u0C80-\u0CFF]/;
  return kannadaRegex.test(text) ? "kn" : "en";
}
 
function getBotReply(message) {
  const lang = detectLanguage(message);
  const lower = message.toLowerCase();


  if (lang === "kn") {
    // Kannada replies
    if (lower.includes("ಹಲೋ") || lower.includes("ಹೈ") || lower.includes("ನಮಸ್ಕಾರ")) {
      return "ಹಲೋ! ನಾನು ನಿಮ್ಮ RuralEdge ಸಹಾಯಕ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    } else if (lower.includes("ಶುಭೋದಯ")) {
      return "ಶುಭೋದಯ! ನಿಮ್ಮ ದಿನ ಚೆನ್ನಾಗಿರಲಿ. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    } else if (lower.includes("ಶುಭ ಸಂಜೆ")) {
      return "ಶುಭ ಸಂಜೆ! ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    } else if (lower.includes("ಹೇಗಿದ್ದೀರಾ")) {
      return "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ! RuralEdge ಬಗ್ಗೆ ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    } else if (lower.includes("ಧನ್ಯವಾದ") || lower.includes("ಧನ್ಯವಾದಗಳು")) {
      return "ಸ್ವಾಗತ 🙏 ಇನ್ನೇನು ಸಹಾಯ ಬೇಕೇ?";
    } else if (lower.includes("ವಿದಾಯ") || lower.includes("ಬಾಯ್")) {
      return "ವಿದಾಯ! ನಿಮ್ಮ ದಿನ ಉತ್ತಮವಾಗಿರಲಿ.";
    } else if (lower.includes("ನೀರು")) {
      return "ನೀರಿನ ಸಮಸ್ಯೆಯನ್ನು Water ವಿಭಾಗದಲ್ಲಿ ದೂರು ನೀಡಬಹುದು.";
    } else if (lower.includes("ದೀಪ") || lower.includes("ರಸ್ತೆ")) {
      return "ಬೀದಿ ದೀಪದ ಸಮಸ್ಯೆಯನ್ನು Street Light ವಿಭಾಗದಲ್ಲಿ ದೂರು ನೀಡಬಹುದು.";
    } else if (lower.includes("ಕಸ") || lower.includes("ತ್ಯಾಜ್ಯ")) {
      return "ಕಸ ಸಂಬಂಧಿತ ದೂರುಗಳನ್ನು Waste Management ವಿಭಾಗದಲ್ಲಿ ಸಲ್ಲಿಸಬಹುದು.";
    } else if (lower.includes("ದೂರು") || lower.includes("ಹೇಗೆ ದೂರು ಕೊಡಬೇಕು")) {
      return "ದೂರು ನೀಡಲು, ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ, Dashboard → Report Issue ಟ್ಯಾಬ್‌ಗೆ ಹೋಗಿ, ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ ಸಲ್ಲಿಸಿ.";
    } else {
      return "ನಾನು RuralEdge ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ! ಉದಾಹರಣೆ: 'ನೀರಿನ ಸಮಸ್ಯೆ', 'ಬೀದಿ ದೀಪ', 'ಕಸ ಸಮಸ್ಯೆ'.";
    }
  } else {
    // English replies
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
      return "Hello! I’m your RuralEdge Assistant. How can I help you today?";
    } else if (lower.includes("good morning")) {
      return "Good morning! Hope you’re doing well. How can I help?";
    } else if (lower.includes("good evening")) {
      return "Good evening! How can I help you?";
    } else if (lower.includes("how are you")) {
      return "I’m doing great! How can I help you with RuralEdge?";
    } else if (lower.includes("thanks") || lower.includes("thank you")) {
      return "You’re welcome. Do you need any more help?";
    } else if (lower.includes("bye")) {
      return "Goodbye! Have a great day.";


    // 🔹 General Questions
    } else if (lower.includes("what is ruraledge") || lower.includes("what is this website") || lower.includes("about this website")) {
      return "RuralEdge is a platform that allows rural citizens to report issues like water supply, street lights, and waste management, so they can be resolved by the staff and admin.";
    } else if (lower.includes("who can use this website")) {
      return "Any registered user from the rural community can use this website to report issues and track complaints.";
    } else if (lower.includes("is it free")) {
      return "Yes, using RuralEdge is completely free for citizens.";
    } else if (lower.includes("languages supported")) {
      return "Currently, RuralEdge supports English and Kannada.";


    // 🔹 Account Related
    } else if (lower.includes("how do i register") || lower.includes("register") || lower.includes("signup")) {
      return "Click on the Register button on the landing page and fill out your details to create an account.";
    } else if (lower.includes("forgot password")) {
      return "If you forgot your password, click on 'Forgot Password' on the login page to reset it.";
    } else if (lower.includes("login")) {
      return "After registering successfully, click on the Login button on the landing page and enter your details to access the dashboard.";


    // 🔹 Complaint Process
    } else if (lower.includes("how to report") || lower.includes("report an issue") || lower.includes("complaint process")) {
      return "To report an issue, log in to your account → Go to the 'Report Issue' tab → Select the category (Water, Street Light, or Waste) → Fill the form → Submit. Staff assigned by the Admin will resolve it.";
    } else if (lower.includes("how do i track my complaint") || lower.includes("track complaint")) {
      return "You can track your complaints in the 'My Complaints' tab of your dashboard.";
    } else if (lower.includes("how long to solve") || lower.includes("time to solve")) {
      return "The time depends on the type of issue, but staff and admins try to resolve complaints as quickly as possible.";
    } else if (lower.includes("edit complaint")) {
      return "Currently, complaints cannot be edited after submission. However, you can submit a new complaint with correct details.";
    } else if (lower.includes("get updates")) {
      return "Yes, you will receive updates in your dashboard whenever the status of your complaint changes.";


    // 🔹 Alerts & Notifications
    } else if (lower.includes("who gives alerts") || lower.includes("alerts")) {
      return "Alerts are given by Panchayat staff or Admins. These may include updates about water supply, street light repairs, or waste collection schedules.";
    } else if (lower.includes("disable alerts")) {
      return "Currently, alerts are automatically shown to users for important updates and cannot be disabled.";
    } else if (lower.includes("sms") || lower.includes("email alerts")) {
      return "If you have provided your email or phone number during registration, you may receive important alerts through them.";


    // 🔹 Services Specific
    } else if (lower.includes("water")) {
      return "You can report water-related issues under the Water section. Staff assigned by Admin will look into the issue.";
    } else if (lower.includes("street") || lower.includes("light")) {
      return "Streetlight complaints can be submitted in the Street Light section. Assigned staff will handle the repair work.";
    } else if (lower.includes("waste") || lower.includes("garbage")) {
      return "Waste management issues can be reported in the Waste Management section. Collection and cleanup are handled by staff.";
   
    // 🔹 Technical Support
    } else if (lower.includes("cannot log in") || lower.includes("login issue")) {
      return "If you are facing login issues, ensure that you entered correct details. If the issue persists, contact support.";
    } else if (lower.includes("website not loading")) {
      return "Please check your internet connection. If the problem continues, try again later or contact support.";
    } else if (lower.includes("contact support")) {
      return "For support, please reach out to your Panchayat office or use the 'Contact Us' section on the landing page.";


    } else {
      return "I’m here to help with RuralEdge! Try asking: 'How to report an issue?', 'How do I register?', 'How do I track a complaint?', or 'Who gives alerts?'.";
    }
  }
}


app.post("/chat", async (req, res) => {
  try {
    const { userMessage } = req.body;

    // ✅ Use your existing chatbot logic
    const botReply = getBotReply(userMessage);

    // ✅ Save chat logs to DB
    const sql = "INSERT INTO chat_logs (user_message, bot_reply, language) VALUES (?, ?, ?)";
    await pool.query(sql, [userMessage, botReply, detectLanguage(userMessage)]);

    // ✅ Send dynamic reply back to chatbot.js
    res.json({ reply: botReply });
  } catch (err) {
    console.error("Error inserting into DB:", err);
    res.status(500).json({ error: "DB error" });
  }
});


// -------------------------
// USER ROUTES
// -------------------------
// Register
app.post('/register', async (req, res) => {
  const { name, email, password, contact_number } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const user_id = uuidv4();
  try {
    const hashed = await bcrypt.hash(password, 10);
    const conn = await pool.getConnection();
    try {
      const [exists] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
      if (exists.length > 0) return res.status(400).json({ error: 'Email already registered' });

      await conn.query(
        'INSERT INTO users (user_id, name, email, password_hash, contact_number) VALUES (?, ?, ?, ?, ?)',
        [user_id, name, email, hashed, contact_number || null]
      );

      sendEmailSafe({
        to: email,
        subject: 'Rural360 Registration',
        text: `Hello ${name}, your registration was successful.`,
      });

      res.json({ message: 'User registered successfully' });
    } finally {
      conn.release();
    }
  } catch (err) {
    return sendServerError(res, err);
  }
});
// -------------------------
// DEPARTMENTS ROUTE
// -------------------------
app.get("/departments", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT department_id, name FROM departments ORDER BY name ASC");
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Failed to fetch departments:", err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});


// -------------------------
// WARDS ROUTE
// -------------------------
app.get("/wards", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT ward_id, name FROM wards ORDER BY name ASC"
      );
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Failed to fetch wards:", err);
    res.status(500).json({ error: "Failed to fetch wards" });
  }
});

// Login
app.post('/register', async (req, res) => {
  const { name, email, password, contact_number } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Missing fields' });

  const user_id = uuidv4();

  try {
    const hashed = await bcrypt.hash(password, 10);
    const conn = await pool.getConnection();

    try {
      // ✅ Step 1: Check if the user exists
      const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);

      // ✅ Step 2: If user exists and NOT deleted → block registration
      if (users.length > 0 && users[0].is_deleted === 0) {
        conn.release();
        return res.status(400).json({ error: 'Email already registered' });
      }

      // ✅ Step 3: If user exists but soft deleted → reactivate
      if (users.length > 0 && users[0].is_deleted === 1) {
        await conn.query(
          'UPDATE users SET name=?, password_hash=?, contact_number=?, is_deleted=0 WHERE email=?',
          [name, hashed, contact_number || null, email]
        );

        conn.release();
        return res.json({ message: 'User account reactivated successfully' });
      }

      // ✅ Step 4: New user registration
      await conn.query(
        'INSERT INTO users (user_id, name, email, password_hash, contact_number) VALUES (?, ?, ?, ?, ?)',
        [user_id, name, email, hashed, contact_number || null]
      );

      sendEmailSafe({
        to: email,
        subject: 'Rural360 Registration',
        text: `Hello ${name}, your registration was successful.`,
      });

      conn.release();
      res.json({ message: 'User registered successfully' });
    } catch (err) {
      conn.release();
      console.error('Register query error:', err);
      return res.status(500).json({ error: 'Database error during registration' });
    }
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Missing email or password' });

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT * FROM users WHERE email = ? AND is_deleted = 0',
      [email]
    );
    conn.release();

    if (rows.length === 0)
      return res.status(400).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match)
      return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Send role and normalized user structure
    res.json({
      token,
      role: 'user',
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login Error:', err);
    return sendServerError(res, err);
  }
});


// Forgot Password
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT user_id, name FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    const token = uuidv4();
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    await conn.query('UPDATE users SET reset_token=?, reset_token_expiry=? WHERE user_id=?', [token, expiry, user.user_id]);
    conn.release();

    const resetLink = `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/reset-password/${token}`;

    sendEmailSafe({
      to: email,
      subject: 'Rural360 Password Reset',
      text: `Hello ${user.name}, click here to reset your password: ${resetLink}`,
    });

    res.json({ message: 'Password reset link sent' });
  } catch (err) {
    return sendServerError(res, err);
  }
});

// Reset Password
// ✅ Send Reset Link
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    // Create reset token valid for 15 minutes
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });

    // Send reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Reset Password</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset link sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset Password
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ error: "Password required" });

  try {
    const conn = await pool.getConnection();

    // Find user with valid token
    const [rows] = await conn.query(
      'SELECT user_id FROM users WHERE reset_token=? AND reset_token_expiry > NOW() AND is_deleted=0',
      [token]
    );

    if (!rows.length) {
      conn.release();
      return res.status(400).json({ error: "Invalid or expired link" });
    }

    const userId = rows[0].user_id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await conn.query(
      'UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL WHERE user_id=?',
      [hashedPassword, userId]
    );

    conn.release();

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit complaint (user)


app.post(
  '/user/report',
  authenticateUser,
  uploadComplaint.single('photo'),
  async (req, res) => {
    const {
      department_id,
      issue_type,
      description,
      location,
      occurred_on,
      email,
      phone_number,
      preferred_contact_method,
    } = req.body;

    const user_id = req.user.id;
    const complaint_id = uuidv4();

    let emailSent = false;

    try {
      const conn = await pool.getConnection();
      try {
        const filename = req.file ? req.file.filename : null;
        const photo_rel = filename ? `complaints/${filename}` : null;

        await conn.query(
          `INSERT INTO complaints
            (complaint_id, user_id, department_id, issue_type, description, location, occurred_on, email, phone_number, preferred_contact_method, photo_url, status, created_on)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
          [
            complaint_id,
            user_id,
            department_id,
            issue_type,
            description,
            location,
            occurred_on || null,
            email || null,
            phone_number || null,
            preferred_contact_method || null,
            photo_rel,
          ]
        );

        // ✅ Send confirmation email if email is provided
        if (email) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER, // your email
              pass: process.env.EMAIL_PASS, // app password if Gmail
            },
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Complaint Submitted Successfully',
            html: `<p>Dear User,</p>
                   <p>Your complaint has been submitted successfully. Complaint ID: <b>${complaint_id}</b></p>
                   <p>Thank you for reporting the issue.</p>`,
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
        }

        res.json({ message: 'Complaint submitted successfully', complaint_id, emailSent });
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Error during complaint submission:', err);
      res.status(500).json({
        error: 'Failed to submit complaint. Please try again later.',
      });
    }
  }
);

app.get("/user/:userId/complaints", authenticateUser, async (req, res) => {
  const { userId } = req.params;

  // ✅ Type-safe, normalized comparison
  if (String(req.user.id) !== String(userId))
    return res.status(403).json({ error: "Access denied" });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT c.*, s.name AS staff_name, d.name AS department_name
         FROM complaints c
         LEFT JOIN staff s ON c.assigned_staff_id = s.staff_id
         JOIN departments d ON c.department_id = d.department_id
         WHERE c.user_id = ? ORDER BY c.created_on DESC`,
        [userId]
      );

      const complaints = rows.map((r) => ({
        ...r,
        photo_full_url: r.photo_url ? makePublicUrl(req, r.photo_url) : null,
        resolution_full_url: r.resolution_image
          ? makePublicUrl(req, r.resolution_image)
          : null,
      }));

      res.json(complaints);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Server error fetching complaints" });
  }
});

// -------------------------
// STAFF ROUTES
// -------------------------
app.post('/staff-register', async (req, res) => {
  const { name, email, password, department_id, assigned_ward_id } = req.body;
  if (!name || !email || !password) 
    return res.status(400).json({ error: 'Missing fields' });

  const staff_id = uuidv4();

  try {
    const hashed = await bcrypt.hash(password, 10);
    const conn = await pool.getConnection();

    try {
      // ✅ Step 1: Check for existing active staff
      const [activeStaff] = await conn.query(
        'SELECT staff_id FROM staff WHERE email = ? AND (is_deleted IS NULL OR is_deleted = FALSE)',
        [email]
      );

      if (activeStaff.length > 0) {
        conn.release();
        return res.status(400).json({ error: 'Email already registered' });
      }

      // ✅ Step 2: Check for soft-deleted staff
      const [deletedStaff] = await conn.query(
        'SELECT staff_id FROM staff WHERE email = ? AND is_deleted = TRUE',
        [email]
      );

      if (deletedStaff.length > 0) {
        // Reactivate existing staff
        await conn.query(
          `UPDATE staff 
           SET name = ?, password_hash = ?, department_id = ?, assigned_ward_id = ?, 
               is_deleted = FALSE, status = 'pending' 
           WHERE email = ?`,
          [name, hashed, department_id || null, assigned_ward_id || null, email]
        );

        conn.release();
        return res.json({ message: '✅ Staff account reactivated and pending approval' });
      }

      // ✅ Step 3: Create new staff record
      await conn.query(
        `INSERT INTO staff (staff_id, name, email, password_hash, department_id, assigned_ward_id, status, is_deleted) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', FALSE)`,
        [staff_id, name, email, hashed, department_id || null, assigned_ward_id || null]
      );

      res.json({ message: '✅ Staff registered successfully, awaiting approval' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Staff Register Error:', err);
    return sendServerError(res, err);
  }
});

app.post('/staff-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT staff_id, name, email, password_hash, status FROM staff WHERE email=?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const staff = rows[0];
      if (staff.status !== 'approved') return res.status(403).json({ error: 'Staff not approved yet' });

      const ok = await bcrypt.compare(password, staff.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: staff.staff_id, role: 'staff', name: staff.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.json({
        token,
        role: 'staff',
        user: { id: staff.staff_id, name: staff.name, email: staff.email },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    return sendServerError(res, err);
  }
});

// Staff dashboard complaints
// STAFF: fetch all complaints assigned to logged-in staff
app.get("/staff/complaints", authenticateStaff, async (req, res) => {
  try {
    const staffId = req.user.id;

    const [rows] = await pool.query(
      `SELECT c.*, u.name AS user_name, d.name AS department_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id=u.user_id
       LEFT JOIN departments d ON c.department_id=d.department_id
       WHERE c.assigned_staff_id=?`,
      [staffId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assigned complaints" });
  }
});



// Staff accept complaint
app.post('/staff/accept/:complaintId', authenticateStaff, async (req, res) => {
  const staffId = req.user.id;
  const { complaintId } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE complaints SET status='in_progress' WHERE complaint_id=? AND assigned_staff_id=? AND status='assigned'",
      [complaintId, staffId]
    );

    if (result.affectedRows === 0) return res.status(400).json({ error: 'Cannot accept this complaint' });

    const history_id = uuidv4();
    await pool.query(
      "INSERT INTO complaint_status_history (history_id, complaint_id, status, updated_on, notes, updated_by) VALUES (?, ?, ?, NOW(), ?, ?)",
      [history_id, complaintId, 'in_progress', 'Accepted by staff', staffId]
    );

    res.json({ message: 'Complaint accepted' });
  } catch (err) {
    return sendServerError(res, err);
  }
});



// ✅ Staff resolve complaint with image + notes + email notification
app.post(
  "/staff/resolve/:complaint_id",
  authenticateStaff,
  uploadResolution.single("resolvedImage"),
  async (req, res) => {
    const complaint_id = req.params.complaint_id;
    const { resolution_notes } = req.body;
    const resolvedImage = req.file ? `resolutions/${req.file.filename}` : null;
    const staffId = req.user.id;

    let conn;
    try {
      console.log("Resolving complaint:", complaint_id, "by staff:", staffId);

      conn = await pool.getConnection();

      // 1️⃣ Update complaint
      const [result] = await conn.query(
        `UPDATE complaints 
         SET status = 'resolved', resolution_notes = ?, resolution_image = ?
         WHERE complaint_id = ? AND assigned_staff_id = ?`,
        [resolution_notes, resolvedImage, complaint_id, staffId]
      );

      console.log("Update Result:", result);

      if (result.affectedRows === 0) {
        conn.release();
        console.warn("No complaint updated - maybe wrong staff or complaint ID");
        return res.status(404).json({ error: "Complaint not found or not assigned to you" });
      }

      // 2️⃣ Get updated complaint + user info
      const [updatedRows] = await conn.query(
        `SELECT c.*, u.name AS user_name, u.email AS user_email, s.name AS staff_name, d.name AS department_name
         FROM complaints c
         LEFT JOIN users u ON c.user_id = u.user_id
         LEFT JOIN staff s ON c.assigned_staff_id = s.staff_id
         LEFT JOIN departments d ON c.department_id = d.department_id
         WHERE c.complaint_id = ?`,
        [complaint_id]
      );

      const complaint = updatedRows[0];
      console.log("Updated Complaint:", complaint);

      // 3️⃣ Send email (optional: comment out for debugging)
      try {
        if (complaint?.user_email) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const mailOptions = {
            from: `"RuralEdge Support" <${process.env.SMTP_USER}>`,
            to: complaint.user_email,
            subject: `Complaint #${complaint_id} Resolved`,
            html: `
              <p>Hi ${complaint.user_name},</p>
              <p>Your complaint (#${complaint_id}) regarding "<strong>${complaint.issue_type}</strong>" has been resolved by ${complaint.staff_name}.</p>
              <p><strong>Resolution Notes:</strong> ${resolution_notes || "—"}</p>
              ${
                resolvedImage
                  ? `<p><img src="${process.env.API_URL}/${resolvedImage}" style="max-width:300px;" /></p>`
                  : ""
              }
              <p>Thank you for using RuralEdge.</p>
            `,
          };

          const info = await transporter.sendMail(mailOptions);
          console.log("Email sent:", info.messageId);
        }
      } catch (mailErr) {
        console.error("Email error:", mailErr);
      }

      conn.release();

      io.emit("complaintResolved", complaint);

      res.status(200).json({
        message: "Complaint resolved successfully",
        complaint,
      });
    } catch (error) {
      if (conn) conn.release();
      console.error("Resolve Complaint Error:", error);
      res.status(500).json({ error: "Failed to resolve complaint", details: error.message });
    }
  }
);


// ✅ Approve staff

app.post("/approve-staff/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const conn = await pool.getConnection();

    try {
      // ✅ Update staff status
      await conn.query("UPDATE staff SET status = 'approved' WHERE staff_id = ?", [id]);

      // ✅ Fetch staff details for email
      const [staff] = await conn.query("SELECT name, email FROM staff WHERE staff_id = ?", [id]);

      if (staff && staff.length > 0 && staff[0].email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER, // your Gmail
            pass: process.env.EMAIL_PASS, // app password
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: staff[0].email,
          subject: "Staff Registration Approved",
          html: `<p>Dear ${staff[0].name},</p>
                 <p>Your registration has been approved by the admin. You can now log in using your credentials.</p>
                 <p>Login here: <a href="${process.env.FRONTEND_URL}/login">Login</a></p>`,
        };

        await transporter.sendMail(mailOptions);
      }

      res.status(200).json({ message: "Staff approved successfully and email sent!" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Approve Staff Error:", err);
    res.status(500).json({ error: "Failed to approve staff" });
  }
});


// ✅ Staff update complaint progress (in-progress, pending, etc.)
app.put("/staff/update/:complaint_id", authenticateStaff, async (req, res) => {
  const { complaint_id } = req.params;
  const { status, progress_notes } = req.body;
  const staffId = req.user.id;

  try {
    // Validate status values to avoid SQL errors
    const validStatuses = ["assigned", "in_progress", "resolved", "pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [result] = await pool.query(
      `UPDATE complaints 
       SET status = ?, progress_notes = ? 
       WHERE complaint_id = ? AND assigned_staff_id = ?`,
      [status, progress_notes || null, complaint_id, staffId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Cannot update complaint or not assigned to you" });
    }

    res.json({ message: "Complaint updated successfully" });
  } catch (err) {
    console.error("Update Complaint Error:", err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});


// -------------------------
// ADMIN ROUTES
// -------------------------
app.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT admin_id, name, email, password_hash FROM admins WHERE email=?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const admin = rows[0];
      const ok = await bcrypt.compare(password, admin.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: admin.admin_id, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.json({
        token,
        role: 'admin',
        user: { id: admin.admin_id, name: admin.name, email: admin.email },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    return sendServerError(res, err);
  }
});


// Update complaint when assigning to staff
// ✅ Assign Complaint to Staff
app.post("/admin/assign/:complaint_id", authenticateAdmin, async (req, res) => {
  const complaintId = req.params.complaint_id;
  const { assigned_staff_id, scheduled_visit } = req.body;

  if (!assigned_staff_id || !scheduled_visit) {
    return res.status(400).json({ error: "Please provide assigned_staff_id and scheduled_visit" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [complRows] = await conn.query(
      "SELECT complaint_id, issue_type, description FROM complaints WHERE complaint_id = ?",
      [complaintId]
    );
    if (!complRows.length) {
      conn.release();
      return res.status(404).json({ error: "Complaint not found" });
    }
    const complaint = complRows[0];

    const [staffRows] = await conn.query(
      "SELECT staff_id, name, email, status FROM staff WHERE staff_id = ?",
      [assigned_staff_id]
    );
    if (!staffRows.length || staffRows[0].status !== "approved") {
      conn.release();
      return res.status(400).json({ error: "Staff not found or not approved" });
    }
    const staff = staffRows[0];

    await conn.query(
      `UPDATE complaints 
       SET assigned_staff_id = ?, scheduled_visit = ?, status = 'assigned'
       WHERE complaint_id = ?`,
      [assigned_staff_id, scheduled_visit, complaintId]
    );

    const [updated] = await conn.query(
      `SELECT c.*, u.name AS user_name, s.name AS staff_name, d.name AS department_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.user_id
       LEFT JOIN staff s ON c.assigned_staff_id = s.staff_id
       LEFT JOIN departments d ON c.department_id = d.department_id
       WHERE c.complaint_id = ?`,
      [complaintId]
    );

    // ✅ Send email to assigned staff
    if (staff.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: staff.email,
        subject: `New Complaint Assigned: ${complaint.issue_type}`,
        html: `<p>Dear ${staff.name},</p>
               <p>A new complaint has been assigned to you. Details:</p>
               <ul>
                 <li><b>Issue:</b> ${complaint.issue_type}</li>
                 <li><b>Description:</b> ${complaint.description}</li>
                 <li><b>Scheduled Visit:</b> ${scheduled_visit}</li>
               </ul>
               <p>Please log in to your dashboard to view and take action.</p>
               <p>Login here: <a href="${process.env.FRONTEND_URL}/login">Login</a></p>`,
      };

      await transporter.sendMail(mailOptions);
    }

    conn.release();

    io.emit("assigned_complaint", updated[0]);

    return res.status(200).json({
      message: "Complaint assigned successfully and email sent to staff",
      complaint: updated[0],
    });
  } catch (err) {
    if (conn) conn.release();
    console.error("Assign Complaint Error:", err);
    return res.status(500).json({ error: "Failed to assign complaint" });
  }
});


// ✅ Delete Complaint
app.delete("/admin/complaints/:complaint_id", authenticateAdmin, async (req, res) => {
  const complaintId = req.params.complaint_id;

  try {
    const conn = await pool.getConnection();

    // Check if complaint exists
    const [checkComplaint] = await conn.query(
      "SELECT * FROM complaints WHERE complaint_id = ?",
      [complaintId]
    );

    if (checkComplaint.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Delete complaint
    await conn.query("DELETE FROM complaints WHERE complaint_id = ?", [complaintId]);

    conn.release();
    return res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Delete Complaint Error:", error);
    return res.status(500).json({ error: "Failed to delete complaint" });
  }
});

// ✅ Fetch all users (excluding deleted)
app.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query('SELECT * FROM users WHERE is_deleted = FALSE');
    conn.release();
    res.json(users);
  } catch (err) {
    console.error('Fetch Users Error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ✅ Fetch all staff (excluding deleted)
app.get('/admin/staff', authenticateAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [staff] = await conn.query('SELECT * FROM staff WHERE is_deleted = FALSE');
    conn.release();
    res.json(staff);
  } catch (err) {
    console.error('Fetch Staff Error:', err);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
});

// ✅ Fetch all complaints (excluding deleted)
app.get('/admin/complaints/all', authenticateAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [complaints] = await conn.query('SELECT * FROM complaints WHERE is_deleted = FALSE');
    conn.release();
    res.json(complaints);
  } catch (err) {
    console.error('Fetch Complaints Error:', err);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});


// Admin: approve staff
app.post('/admin/staff/approve/:staffId', authenticateAdmin, async (req, res) => {
  const { staffId } = req.params;
  try {
    const conn = await pool.getConnection();
    await conn.query('UPDATE staff SET status="approved" WHERE staff_id=?', [staffId]);
    const [staffRows] = await conn.query('SELECT email, name FROM staff WHERE staff_id=?', [staffId]);
    const staff = staffRows[0];
    sendEmailSafe({ to: staff.email, subject: 'Staff Approved', text: `Hello ${staff.name}, you are now approved.` });
    res.json({ message: 'Staff approved' });
    conn.release();
  } catch (err) {
    return sendServerError(res, err);
  }
});

// -------------------------
// ADMIN SOFT DELETE ROUTES (FIXED)
// -------------------------

// ✅ Soft delete User
app.delete('/admin/users/:userId', authenticateAdmin, async (req, res) => {
  const { userId } = req.params;
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query('UPDATE users SET is_deleted = TRUE WHERE user_id = ?', [userId]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: '✅ User marked as deleted successfully' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ message: '❌ Failed to soft delete user', error: err.message });
  }
});

// ✅ Soft delete Staff
app.delete('/admin/staff/:staffId', authenticateAdmin, async (req, res) => {
  const { staffId } = req.params;
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query('UPDATE staff SET is_deleted = TRUE WHERE staff_id = ?', [staffId]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ message: '✅ Staff marked as deleted successfully' });
  } catch (err) {
    console.error('Delete Staff Error:', err);
    res.status(500).json({ message: '❌ Failed to soft delete staff', error: err.message });
  }
});

// ✅ Soft delete Complaint
app.delete('/admin/complaints/:complaintId', authenticateAdmin, async (req, res) => {
  const { complaintId } = req.params;
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query('UPDATE complaints SET is_deleted = TRUE WHERE complaint_id = ?', [complaintId]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: '✅ Complaint marked as deleted successfully' });
  } catch (err) {
    console.error('Delete Complaint Error:', err);
    res.status(500).json({ message: '❌ Failed to soft delete complaint', error: err.message });
  }
});





// -------------------------
// FEEDBACK
// -------------------------
app.post('/feedback', authenticateUser, async (req, res) => {
  const { complaint_id, rating, comment } = req.body;
  if (!complaint_id || !rating) return res.status(400).json({ error: 'Missing fields' });

  try {
    const conn = await pool.getConnection();
    const feedback_id = uuidv4();

    // Get staff assigned to complaint
    const [complaintRows] = await conn.query('SELECT assigned_staff_id, user_id FROM complaints WHERE complaint_id=?', [complaint_id]);
    if (!complaintRows.length) return res.status(404).json({ error: 'Complaint not found' });
    const assigned_staff_id = complaintRows[0].assigned_staff_id;

    await conn.query(
      `INSERT INTO feedback (feedback_id, complaint_id, user_id, staff_id, rating, comment, submitted_on)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [feedback_id, complaint_id, req.user.id, assigned_staff_id, rating, comment || null]
    );

    res.json({ message: 'Feedback submitted' });
    conn.release();
  } catch (err) {
    return sendServerError(res, err);
  }
});

// -------------------------
// ALERTS
// -------------------------
app.post('/alerts', authenticateAdmin, async (req, res) => {
  const { title, message, type, target_audience, scheduled_time, expiry_date } = req.body;
  const alert_id = uuidv4();

  try {
    await pool.query(
      `INSERT INTO alerts (alert_id, title, message, type, target_audience, created_by_admin_id, scheduled_time, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [alert_id, title, message, type, target_audience, req.user.id, scheduled_time || null, expiry_date || null]
    );

    res.json({ message: 'Alert created' });
  } catch (err) {
    return sendServerError(res, err);
  }
});

// Admin: fetch alerts
app.get('/alerts', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM alerts ORDER BY scheduled_time DESC');
    res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
});

// -------------------------
// MESSAGES
// -------------------------
app.post('/messages', authenticateToken, uploadMessageAttachment.single('attachment'), async (req, res) => {
  const { sender_id, receiver_id, complaint_id, message } = req.body;
  const message_id = uuidv4();
  const attachment_url = req.file ? `messages/${req.file.filename}` : null;

  try {
    await pool.query(
      `INSERT INTO messages (message_id, sender_id, receiver_id, complaint_id, message, attachment_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, false, NOW())`,
      [message_id, sender_id, receiver_id, complaint_id || null, message || null, attachment_url]
    );
    res.json({ message: 'Message sent', message_id });
  } catch (err) {
    return sendServerError(res, err);
  }
});

app.get('/messages/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM messages WHERE sender_id=? OR receiver_id=? ORDER BY created_at ASC`,
      [userId, userId]
    );
    const augmented = rows.map((r) => ({ ...r, attachment_full_url: makePublicUrl(req, r.attachment_url) }));
    res.json(augmented);
  } catch (err) {
    return sendServerError(res, err);
  }
});

// -------------------------
// START SERVER
// -------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
