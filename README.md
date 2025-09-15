# API-Gateway-Micro-Services
# Student Management Microservices Architecture

## 🏗️ Architecture Overview

This project implements a **microservices architecture** with an **API Gateway pattern** for managing students, courses, and user authentication. The system is designed to be scalable, maintainable, and follows modern microservices best practices.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│              (Web App / Mobile App / API Client)           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Requests
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API GATEWAY                                │
│                 (Port 2000)                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              RESPONSIBILITIES                           ││
│  │ • Route Management & Load Balancing                     ││
│  │ • Authentication & Authorization                        ││
│  │ • Request/Response Transformation                       ││
│  │ • Cross-Cutting Concerns (CORS, Logging)              ││
│  │ • Service Discovery & Health Checks                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────┬───────────────┬───────────────┬───────────────┘
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  AUTH SERVICE   │ │STUDENT SERVICE  │ │ COURSE SERVICE  │
    │   (Port 3000)   │ │  (Port 4000)    │ │  (Port 5000)    │
    │                 │ │                 │ │                 │
    │ • User Registration│ • Student CRUD  │ • Course CRUD    │
    │ • User Login      │ • User Isolation│ • Enrollment     │
    │ • JWT Generation  │ • Data Validation│ • Access Control │
    │ • Password Hash   │ • Ownership Check│ • Student Lists  │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   USER DATA     │ │  STUDENT DATA   │ │  COURSE DATA    │
    │  (In Memory)    │ │  (In Memory)    │ │  (In Memory)    │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🎯 Design Patterns

### 1. **API Gateway Pattern**
- **Centralized Entry Point**: Single point of entry for all client requests
- **Service Aggregation**: Combines responses from multiple microservices
- **Cross-Cutting Concerns**: Handles authentication, CORS, logging centrally
- **Protocol Translation**: Manages different communication protocols

### 2. **Microservices Pattern**
- **Service Decomposition**: Business capabilities split into independent services
- **Database Per Service**: Each service manages its own data
- **Decentralized Governance**: Services can use different technologies

### 3. **JWT Authentication Pattern**
- **Stateless Authentication**: No server-side session storage
- **Token-Based Security**: JWT tokens for secure communication
- **Distributed Validation**: Services validate tokens independently

## 🛠️ Service Architecture

### API Gateway (Port 2000)
```javascript
// Core Responsibilities
├── Authentication Middleware
├── Request Routing
├── Service Discovery
├── Error Handling
├── CORS Management
└── Response Aggregation
```

**Key Features:**
- Routes requests to appropriate microservices
- Validates JWT tokens before forwarding requests
- Handles service failures gracefully
- Provides unified error responses
- Manages CORS for browser compatibility

### Authentication Service (Port 3000)
```javascript
// Domain: User Management
├── User Registration
├── Password Hashing (bcrypt)
├── User Login
├── JWT Token Generation
└── User Validation
```

**Endpoints:**
- `POST /auth/create` - Register new user
- `POST /auth/login` - User authentication
- `GET /` - Health check

**Data Model:**
```javascript
User {
  id: Number,
  name: String,
  password: String (hashed),
  createdAt: ISO String
}
```

### Student Service (Port 4000)
```javascript
// Domain: Student Management
├── Student CRUD Operations
├── User Isolation (students per user)
├── Data Validation
├── Ownership Verification
└── JWT Authentication
```

**Endpoints:**
- `POST /students` - Create student
- `GET /students` - Get user's students
- `PUT /students/:id` - Update student (full)
- `PATCH /students/:id` - Update student (partial)
- `DELETE /students/:id` - Delete student

**Data Model:**
```javascript
Student {
  id: Number,
  name: String,
  userId: Number,
  createdAt: ISO String,
  updatedAt: ISO String
}
```

### Course Service (Port 5000)
```javascript
// Domain: Course Management
├── Course CRUD Operations
├── Student Enrollment
├── Access Control
├── Enrollment Management
└── JWT Authentication
```

**Endpoints:**
- `POST /courses` - Create course
- `GET /courses` - Get all courses
- `POST /courses/:id/enroll` - Enroll student
- `GET /courses/:id/students` - Get enrolled students
- `DELETE /courses/:id` - Delete course

**Data Model:**
```javascript
Course {
  id: Number,
  name: String,
  createdBy: Number,
  studentsEnrolled: [Number],
  createdAt: ISO String
}
```

## 🔐 Security Architecture

### JWT Token Flow
```
1. User Login → Auth Service
2. Auth Service validates credentials
3. Auth Service generates JWT token
4. Client receives token
5. Client includes token in subsequent requests
6. Gateway validates token
7. Gateway forwards request to microservice
8. Microservice re-validates token (defense in depth)
```

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Expiration**: 1-hour token lifetime
- **Token Validation**: Multiple validation layers
- **User Isolation**: Users can only access their own data
- **CORS Protection**: Configured for cross-origin requests

## 🚀 Getting Started

### Prerequisites
```bash
node >= 14.x
npm >= 6.x
```

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd microservices-project
npm install
```

2. **Environment Configuration**
```bash
# Create .env file in root directory
echo "ACCESS_TOKEN=your_super_secret_key_here" > .env
echo "NODE_ENV=development" >> .env
echo "PORT=3000" >> .env
```

3. **Start Services**
```bash
# Terminal 1 - Auth Service
node auth.js

# Terminal 2 - Student Service  
node student.js

# Terminal 3 - Course Service
node course.js

# Terminal 4 - API Gateway
node gateway.js
```

### Service Health Checks
```bash
# Check all services are running
curl http://localhost:3000/  # Auth Service
curl http://localhost:4000/  # Student Service
curl http://localhost:5000/  # Course Service
curl http://localhost:2000/  # API Gateway
```

## 📚 API Documentation

### Authentication Flow

#### 1. Register User
```http
POST http://localhost:2000/auth/create
Content-Type: application/json

{
  "name": "john_doe",
  "password": "secure_password123"
}
```

#### 2. Login User
```http
POST http://localhost:2000/auth/login
Content-Type: application/json

{
  "name": "john_doe", 
  "password": "secure_password123"
}
```

**Response:**
```json
{
  "message": "Login successful (via gateway)",
  "data": {
    "message": "Login successful",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "john_doe"
    }
  }
}
```

### Student Management

#### Create Student
```http
POST http://localhost:2000/students
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Alice Johnson"
}
```

#### Get Students
```http
GET http://localhost:2000/students
Authorization: Bearer <JWT_TOKEN>
```

#### Update Student
```http
PUT http://localhost:2000/students/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Alice Smith"
}
```

### Course Management

#### Create Course
```http
POST http://localhost:2000/courses
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Advanced Mathematics"
}
```

#### Enroll Student
```http
POST http://localhost:2000/courses/enroll/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "studentId": 1
}
```

## 🔧 Configuration

### Environment Variables
```bash
# .env file
ACCESS_TOKEN=your_jwt_secret_key           # JWT signing key
NODE_ENV=development                       # Environment
PORT=3000                                  # Default port (can be overridden)
```

### Service Ports
- **API Gateway**: 2000
- **Auth Service**: 3000  
- **Student Service**: 4000
- **Course Service**: 5000

## 📊 Monitoring & Debugging

### Logging Strategy
- **Request Logging**: All requests logged with timestamps
- **Error Logging**: Detailed error traces
- **Operation Logging**: Key operations logged (create, update, delete)
- **Authentication Logging**: JWT validation logs

### Health Monitoring
```bash
# Monitor service health
curl http://localhost:2000/     # Gateway health
curl http://localhost:3000/     # Auth service health  
curl http://localhost:4000/     # Student service health
curl http://localhost:5000/     # Course service health
```

## ⚡ Performance Considerations

### Scalability Features
- **Stateless Services**: No server-side state, easy horizontal scaling
- **Independent Deployment**: Services can be deployed independently
- **Load Balancing Ready**: Gateway can distribute load across service instances

### Potential Optimizations
- **Database Integration**: Replace in-memory storage with persistent databases
- **Caching Layer**: Redis for frequently accessed data
- **Connection Pooling**: For database connections
- **Rate Limiting**: Prevent API abuse

## 🧪 Testing

### Manual Testing with HTTP Files
Use the provided `test.http` file with VS Code REST Client extension:

1. **Install REST Client Extension** in VS Code
2. **Open test.http file**
3. **Execute requests** by clicking "Send Request"

### Testing Workflow
```bash
1. Start all services
2. Register a user
3. Login to get JWT token
4. Replace JWT_TOKEN in subsequent requests
5. Test CRUD operations
6. Test error scenarios
```

## 🚨 Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing token)
- **403**: Forbidden (invalid token)
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "endpoint": "POST /students" // Optional
}
```

## 🔮 Future Enhancements

### Technical Improvements
- **Database Integration**: PostgreSQL/MongoDB for persistence
- **Message Queues**: RabbitMQ/Apache Kafka for async communication
- **Service Mesh**: Istio for advanced service-to-service communication
- **Container Orchestration**: Docker + Kubernetes deployment
- **API Documentation**: OpenAPI/Swagger documentation
- **Monitoring**: Prometheus + Grafana
- **Distributed Tracing**: Jaeger for request tracing

### Feature Enhancements
- **Role-Based Access Control**: Admin/Teacher/Student roles
- **File Upload**: Student photo upload
- **Real-time Notifications**: WebSocket integration
- **Email Integration**: Registration confirmations
- **Audit Logging**: Track all system changes
- **Data Export**: CSV/PDF report generation

### Infrastructure
- **CI/CD Pipeline**: Automated testing and deployment
- **Load Balancers**: NGINX/HAProxy
- **SSL/TLS**: HTTPS encryption
- **API Versioning**: v1, v2 API support
- **Rate Limiting**: Request throttling
- **Health Checks**: Advanced service monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- **ES6+ JavaScript**
- **Consistent naming conventions**
- **Error handling in all endpoints**
- **Input validation**
- **Proper HTTP status codes**

---

**Architecture Benefits:**
- ✅ **Scalability**: Independent service scaling
- ✅ **Maintainability**: Separated concerns
- ✅ **Flexibility**: Technology diversity per service
- ✅ **Resilience**: Fault isolation
- ✅ **Team Autonomy**: Independent development teams

**Built with ❤️ using Node.js, Express.js, and JWT**
