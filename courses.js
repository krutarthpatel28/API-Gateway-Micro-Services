require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

let courses = [];
let courseId = 1;

// Authentication middleware with fallback
function authenticate(req, res, next) {
    const headerReq = req.headers["authorization"];
    if (!headerReq) return res.status(401).json({ error: "No token provided" });
    
    const token = headerReq.split(" ")[1];
    
    // Add debugging
    console.log('Token received:', token);
    console.log('Using secret:', process.env.ACCESS_TOKEN || "fallback_secret");
    
    jwt.verify(token, process.env.ACCESS_TOKEN || "fallback_secret", (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ 
                error: "Invalid Token",
                details: err.message 
            });
        }
        console.log('JWT verified successfully for user:', user);
        req.user = user;
        next();
    });
}

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Course Service is running', courses: courses.length });
});

// Create course
app.post("/courses", authenticate, (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Course name is required" });
        
        const newCourse = {
            id: courseId++,
            name,
            createdBy: req.user.userId,
            studentsEnrolled: [],
            createdAt: new Date().toISOString()
        };
        
        courses.push(newCourse);
        console.log(`Course created: ${name} by user ${req.user.userId}`);
        
        res.status(201).json({ 
            message: "Course created successfully", 
            course: newCourse 
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Get all courses
app.get("/courses", authenticate, (req, res) => {
    try {
        // Filter courses by user or return all courses (depending on your business logic)
        // For now, returning all courses but you might want to filter by user
        res.json(courses);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Enroll student in course
app.post("/courses/:id/enroll", authenticate, (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const { studentId } = req.body;
        
        // Log the incoming request for debugging
        console.log(`Enroll request - Course ID: ${courseId}, Student ID: ${studentId}`);
        
        if (!studentId) {
            return res.status(400).json({ error: "Student ID is required" });
        }
        
        // Validate that studentId is a number
        const studentIdNum = parseInt(studentId);
        if (isNaN(studentIdNum)) {
            return res.status(400).json({ error: "Student ID must be a valid number" });
        }
        
        const course = courses.find(c => c.id === courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        
        // Prevent duplicate enrollment (check both number and string versions)
        if (course.studentsEnrolled.includes(studentIdNum) || course.studentsEnrolled.includes(studentId.toString())) {
            return res.status(400).json({ error: "Student already enrolled in this course" });
        }
        
        course.studentsEnrolled.push(studentIdNum);
        console.log(`Student ${studentIdNum} enrolled in course ${courseId}`);
        
        res.status(200).json({ 
            message: "Student enrolled successfully", 
            course 
        });
    } catch (error) {
        console.error('Enroll student error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Get all students enrolled in a course
app.get("/courses/:id/students", authenticate, (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        
        res.json({
            courseId: course.id,
            name: course.name,
            studentsEnrolled: course.studentsEnrolled
        });
    } catch (error) {
        console.error('Get course students error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

// Delete course (only by creator)
app.delete("/courses/:id", authenticate, (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const index = courses.findIndex(c => c.id === courseId && c.createdBy === req.user.userId);
        
        if (index === -1) {
            return res.status(404).json({ 
                error: "Course not found or not owned by this user" 
            });
        }
        
        courses.splice(index, 1);
        console.log(`Course ${courseId} deleted by user ${req.user.userId}`);
        
        res.status(200).json({ 
            message: `Course with id ${courseId} deleted successfully.` 
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Course server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access token configured: ${!!process.env.ACCESS_TOKEN}`);
});