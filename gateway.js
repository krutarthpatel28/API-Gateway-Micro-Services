require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    next();
});

// Authentication middleware
function authenticationHandler(req, res, next) {
    const headerReq = req.headers["authorization"];
    if (!headerReq) return res.status(401).send("No authorization token was sent");

    const token = headerReq.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN || "fallback_secret", (err, user) => {
        if (err) return res.status(403).send("Forbidden: Invalid token");
        req.user = user;
        next();
    });
}

// ------------------ HEALTH CHECK ------------------
app.get('/', (req, res) => {
    res.json({ message: 'Gateway Service is running', status: 'healthy' });
});

// ------------------ AUTH SERVICE ------------------

// Protected route
app.get("/user", authenticationHandler, async (req, res) => {
    try {
        const response = await axios.get("http://localhost:3000/");
        res.status(200).json({
            message: "Fetched from auth service",
            data: response.data,
            user: req.user
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Failed to fetch from auth service",
            message: error.response?.data || error.message
        });
    }
});

// Create user
app.post("/create/user", async (req, res) => {
    try {
        const response = await axios.post("http://localhost:3000/auth/create", req.body);
        res.status(201).json({
            message: "User created successfully (via gateway)",
            data: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error creating user",
            message: error.response?.data || error.message
        });
    }
});

// Login
app.post("/auth/login", async (req, res) => {
    try {
        const response = await axios.post("http://localhost:3000/auth/login", req.body);
        res.status(200).json({
            message: "Login successful (via gateway)",
            data: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Login failed",
            message: error.response?.data || error.message
        });
    }
});

// Create user (alternative route for consistency)
app.post("/auth/create", async (req, res) => {
    try {
        const response = await axios.post("http://localhost:3000/auth/create", req.body);
        res.status(201).json({
            message: "User created successfully (via gateway)",
            data: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error creating user",
            message: error.response?.data || error.message
        });
    }
});

// ------------------ STUDENT SERVICE ------------------

app.post("/students", authenticationHandler, async (req, res) => {
    try {
        const response = await axios.post("http://localhost:4000/students", req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(200).json({
            message: "Student added successfully.",
            data: response.data,
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error adding student",
            message: error.response?.data || error.message
        });
    }
});

app.get("/students", authenticationHandler, async (req, res) => {
    try {
        const response = await axios.get("http://localhost:4000/students", {
            headers: { Authorization: req.headers["authorization"] }
        });
        res.status(200).json({
            message: "Students list ready",
            data: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error getting students",
            message: error.response?.data || error.message
        });
    }
});

app.delete("/students/:id", authenticationHandler, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const response = await axios.delete(`http://localhost:4000/students/${id}`, {
            headers: { Authorization: req.headers["authorization"] }
        });
        res.status(200).json({
            message: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error deleting student",
            message: error.response?.data || error.message,
        });
    }
});

app.put("/students/:id", authenticationHandler, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const response = await axios.put(
            `http://localhost:4000/students/${id}`,
            req.body,
            { headers: { Authorization: req.headers['authorization'] } }
        );
        res.status(200).json({
            message: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error updating student",
            message: error.response?.data || error.message,
        });
    }
});

app.patch("/students/:id", authenticationHandler, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const response = await axios.patch(
            `http://localhost:4000/students/${id}`,
            req.body,
            { headers: { Authorization: req.headers["authorization"] } }
        );
        res.status(200).json({
            message: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error patching student",
            message: error.response?.data || error.message,
        });
    }
});

// ------------------ COURSE SERVICE ------------------

app.post("/courses", authenticationHandler, async (req, res) => {
    try {
        const response = await axios.post("http://localhost:5000/courses", req.body, {
            headers: { Authorization: req.headers["authorization"] }
        });
        res.status(200).json({
            message: response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error creating course",
            message: error.response?.data || error.message
        });
    }
});

app.get("/courses", authenticationHandler, async (req, res) => {
    try {
        const response = await axios.get("http://localhost:5000/courses", {
            headers: { Authorization: req.headers["authorization"] },
        });
        if (response.data.length === 0)
            return res.status(200).json({ message: "Courses empty" });

        res.status(200).json({ message: response.data });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error fetching courses",
            message: error.response?.data || error.message
        });
    }
});

app.post("/courses/enroll/:id", authenticationHandler, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const response = await axios.post(
            `http://localhost:5000/courses/${id}/enroll`,
            req.body,
            { headers: { Authorization: req.headers["authorization"] } }
        );
        res.status(200).json({ message: response.data });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error enrolling student in course",
            message: error.response?.data || error.message
        });
    }
});

app.get("/courses/students/:id", authenticationHandler, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const response = await axios.get(
            `http://localhost:5000/courses/${id}/students`,
            { headers: { Authorization: req.headers["authorization"] } }
        );
        res.status(200).json({ message: response.data });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error fetching students of course",
            message: error.response?.data || error.message
        });
    }
});

app.delete("/courses/:id", authenticationHandler, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const response = await axios.delete(
            `http://localhost:5000/courses/${id}`,
            { headers: { Authorization: req.headers["authorization"] } }
        );
        res.status(200).json({ message: response.data });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Error deleting course",
            message: error.response?.data || error.message
        });
    }
});

// ------------------ START GATEWAY ------------------
app.listen(2000, () => {
    console.log("🚀 Gateway running on port 2000");
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access token configured: ${!!process.env.ACCESS_TOKEN}`);
});