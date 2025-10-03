require('dotenv').config();

let express = require('express');
let session = require('express-session');
let mongoose = require('mongoose');
let swaggerUi = require('swagger-ui-express');
let cookieParser = require('cookie-parser');
let swaggerSpec = require('./utils/swaggerConfig');
let cors = require("cors");
let http = require("http");
let helmet = require('helmet');
let rateLimit = require('express-rate-limit');

// Models
const { Users } = require("./models/users");
const Community = require("./models/community");
const Message = require("./models/messages");
const { Server } = require('socket.io'); // Import Socket.IO
// let xss = require('xss-clean');

let morgan = require('morgan');


const app = express();
const server = http.createServer(app);

const io = new Server(server); // Initialize io

const PORT = process.env.PORT || 5000;
console.log('Server running on port:', PORT);

// Rate limiting configuration
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
});

// Authentication rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Job creation rate limiting
const jobCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 job posts per hour
    message: {
        success: false,
        message: 'Too many jobs created from this IP, please try again later.',
        retryAfter: '1 hour'
    },
});

// Application rate limiting
const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 job applications per hour
    message: {
        success: false,
        message: 'Too many job applications from this IP, please try again later.',
        retryAfter: '1 hour'
    },
});

// Middleware to parse JSON
console.log(process.env.SECRET_KEY);
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));
app.use(helmet());
// app.use(xss());
app.use(morgan('dev'));

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Hnadle cors
const corsOptions = {
    origin: [
        process.env.WEB_BASE_URL,
        process.env.SERVER_URL,
        `http://localhost:${PORT}`,
        `http://localhost:5173`,
        `https://elentis.app`,
        'https://www.elentis.app',
        'https://preview--elentis-api-forge.lovable.app',
        'https://www.preview--elentis-api-forge.lovable.app'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

// Sample route
const waitlistRoute = require('./routes/waitlistRoute');
const authRoute = require('./routes/authRoutes');
const userRoute = require('./routes/userRoutes');
const courseRoute = require('./routes/courseRoutes');
const jobRoute = require('./routes/jobRoutes');
const jobApplicationRoute = require('./routes/jobApplicationRoutes');
const skillSwapRoute = require('./routes/skillSwapRoutes');
const communityRoute = require('./routes/communityRoutes');
const messageRoute = require('./routes/messageRoutes');
const paymentRoute = require('./routes/paymentRoutes');
const cloudinaryRoute = require('./routes/cloudinaryRoutes');

app.get("/", (req, res) => {
  res.send("Hello, Express.js!");
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/waitlist', waitlistRoute);
app.use('/api/auth', authLimiter, authRoute);
app.use('/api/user', userRoute);
app.use('/api/courses', courseRoute);
app.use('/api/jobs', jobRoute);
app.use('/api/job-applications', jobApplicationRoute);
app.use('/api/skill-swap', skillSwapRoute);
app.use('/api/community', communityRoute);
app.use('/api/messages', messageRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/uploads', cloudinaryRoute);


// Apply specific rate limiters to sensitive endpoints
app.use('/api/jobs', (req, res, next) => {
    if (req.method === 'POST') {
        return jobCreationLimiter(req, res, next);
    }
    next();
});

app.use('/api/job-applications/apply', applicationLimiter);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));


// ✅ WebSocket logic
io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // --- Join user’s private room ---
  socket.on("joinChat", async (userId) => {
    if (!userId) return console.log("❌ No userId provided for joinChat");

    const user = await Users.findById(userId);
    if (!user) return console.log("❌ Invalid userId for joinChat");

    socket.userId = userId;
    socket.join(userId.toString());
    console.log(`✅ User ${userId} joined their private room`);
  });

  // --- Direct message ---
  socket.on("sendDirectMessage", async ({ senderId, receiverId, message }) => {
    try {
      if (!senderId || !receiverId || !message) {
        return console.log("❌ Invalid direct message payload");
      }

      // Validate sender & receiver
      const sender = await Users.findById(senderId);
      const receiver = await Users.findById(receiverId);

      if (!sender || !receiver) {
        return console.log("❌ Invalid sender or receiver ID");
      }

      // Check if receiver blocked sender
      if (receiver.blockedUsers.includes(senderId)) {
        return console.log(`🚫 User ${receiverId} has blocked ${senderId}`);
      }

      // Construct roomId (sorted user IDs for uniqueness)
      const roomId = [senderId, receiverId].sort().join("_");

      // Save to DB
      const newMessage = await Message.create({
        roomId,
        sender: senderId,
        receiver: receiverId,
        message,
        messageType: "direct"
      });

      // Emit to both sender & receiver
      const payload = {
        _id: newMessage._id,
        senderId,
        receiverId,
        message,
        createdAt: newMessage.createdAt
      };

      io.to(receiverId.toString()).emit("receiveDirectMessage", payload);
      io.to(senderId.toString()).emit("receiveDirectMessage", payload);

      console.log(`💌 DM from ${senderId} to ${receiverId}: ${message}`);
    } catch (err) {
      console.error("❌ Error sending direct message:", err);
    }
  });

  // --- Join community room ---
  socket.on("joinCommunity", async ({ userId, communityId }) => {
    try {
      const user = await Users.findById(userId);
      const community = await Community.findById(communityId);

      if (!user || !community) {
        return console.log("❌ Invalid userId or communityId");
      }

      // Check if user is a member
      const isMember = community.members.some(
        (m) => m.user.toString() === userId && m.approved
      );
      if (!isMember) {
        return console.log(`🚫 User ${userId} is not a member of ${communityId}`);
      }

      socket.join(`community_${communityId}`);
      console.log(`✅ User ${userId} joined community ${communityId}`);
    } catch (err) {
      console.error("❌ Error joining community:", err);
    }
  });

  // --- Community message ---
  socket.on("sendCommunityMessage", async ({ senderId, communityId, message }) => {
    try {
      if (!senderId || !communityId || !message) {
        return console.log("❌ Invalid community message payload");
      }

      const sender = await Users.findById(senderId);
      const community = await Community.findById(communityId);

      if (!sender || !community) {
        return console.log("❌ Invalid sender or community ID");
      }

      // Check if user is a member
      const isMember = community.members.some(
        (m) => m.user.toString() === senderId && m.approved
      );
      if (!isMember) {
        return console.log(`🚫 User ${senderId} not allowed to message ${communityId}`);
      }

      // Save to DB
      const newMessage = await Message.create({
        roomId: `community_${communityId}`,
        communityId,
        sender: senderId,
        message,
        messageType: "community"
      });

      const payload = {
        _id: newMessage._id,
        senderId,
        communityId,
        message,
        createdAt: newMessage.createdAt
      };

      io.to(`community_${communityId}`).emit("receiveCommunityMessage", payload);

      console.log(`👥 Community ${communityId} msg from ${senderId}: ${message}`);
    } catch (err) {
      console.error("❌ Error sending community message:", err);
    }
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log(`❌ User ${socket.userId || socket.id} disconnected`);
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
