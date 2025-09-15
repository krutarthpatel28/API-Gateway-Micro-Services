require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    next();
});

let students = [];
let id = 1;

// Authentication middleware with fallback
function authenticate(req, res, next) {
    const headerReq = req.headers["authorization"];
    if (!headerReq) return res.status(401).json({ error: "No token provided" });
    
    const token = headerReq.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN || "fallback_secret", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user; // { userId, name }
        next();
    });
}

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Student Service is running', students: students.length });
});

// Create student
app.post("/students", authenticate, (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Student name is required" });
        }
        
        const newStudent = {
            id: id++,
            name,
            userId: req.user.userId,
            createdAt: new Date().toISOString()
        };
        
        students.push(newStudent);
        console.log(`Student created: ${name} by user ${req.user.userId}`);
        
        res.status(201).json({
            message: "Student profile successfully created.",
            student: newStudent
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Get students (only user's students)
app.get("/students", authenticate, (req, res) => {
    try {
        const userStudents = students.filter(s => s.userId === req.user.userId);
        res.json(userStudents);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Delete student (only own students)
app.delete("/students/:id", authenticate, (req, res) => {
    try {
        const studentId = parseInt(req.params.id);
        const index = students.findIndex(s => s.id === studentId && s.userId === req.user.userId);
        
        if (index === -1) {
            return res.status(404).json({ 
                error: "Student not found or not owned by this user" 
            });
        }
        
        students.splice(index, 1);
        console.log(`Student ${studentId} deleted by user ${req.user.userId}`);
        
        res.status(200).json({ 
            message: `Student with id ${studentId} deleted successfully.` 
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Update student - full replace (PUT)
app.put("/students/:id", authenticate, (req, res) => {
    try {
        const studentId = parseInt(req.params.id);
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Student name is required" });
        }
        
        const student = students.find(s => s.id === studentId && s.userId === req.user.userId);
        if (!student) {
            return res.status(404).json({ 
                error: "Student not found or not owned by this user" 
            });
        }
        
        student.name = name;
        student.updatedAt = new Date().toISOString();
        
        console.log(`Student ${studentId} updated by user ${req.user.userId}`);
        
        res.status(200).json({ 
            message: "Student updated successfully", 
            student 
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Partially update student (PATCH)
app.patch("/students/:id", authenticate, (req, res) => {
    try {
        const studentId = parseInt(req.params.id);
        const { name } = req.body;
        
        const student = students.find(s => s.id === studentId && s.userId === req.user.userId);
        if (!student) {
            return res.status(404).json({ 
                error: "Student not found or not owned by this user" 
            });
        }
        
        if (name !== undefined) {
            student.name = name;
        }
        student.updatedAt = new Date().toISOString();
        
        console.log(`Student ${studentId} partially updated by user ${req.user.userId}`);
        
        res.status(200).json({ 
            message: "Student partially updated successfully", 
            student 
        });
    } catch (error) {
        console.error('Patch student error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Student server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access token configured: ${!!process.env.ACCESS_TOKEN}`);
});