require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        console.error(`Bad JSON on ${req.method} ${req.url}:`, error.message);
        console.error('Raw body length:', req.rawBody?.length || 'unknown');
        return res.status(400).json({ 
            error: 'Invalid JSON format',
            message: error.message,
            endpoint: `${req.method} ${req.url}`
        });
    }
    next(error);
});

// Data storage
let users = [];
let userId = 1;

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Auth Service is running', users: users.length });
});

app.post("/auth/create", async (req, res) => {
    try {
        console.log('Received body:', JSON.stringify(req.body, null, 2));
        
        const { name, password } = req.body;
        
       
        if (!name || !password) {
            return res.status(400).json({ 
                error: "Missing required fields",
                required: ["name", "password"] 
            });
        }
    
        const existingUser = users.find(u => u.name === name);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        
     
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { 
            id: userId++, 
            name, 
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        console.log(`User created: ${name} (ID: ${newUser.id})`);
        
        return res.status(201).json({
            message: "User created successfully",
            user: { 
                id: newUser.id, 
                name: newUser.name,
                createdAt: newUser.createdAt
            }
        });
        
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        console.log('Login attempt for:', req.body);
        
        const { name, password } = req.body;
        
  
        if (!name || !password) {
            return res.status(400).json({ 
                error: "Missing credentials",
                required: ["name", "password"] 
            });
        }
        
      
        const user = users.find(u => u.name === name);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
    
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }
        
   
        const payload = { userId: user.id, name: user.name };
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN || 'fallback_secret', { 
            expiresIn: "1h" 
        });
        
        console.log(`User logged in: ${name}`);
        
        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access token configured: ${!!process.env.ACCESS_TOKEN}`);
});