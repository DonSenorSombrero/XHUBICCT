import express from 'express';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import Post from './models/post.js';  // Verify this path is correct
import postRoutes from './routes/posts.js';
import authRoutes from './routes/auth.js';
import Message from './models/message.js';
import fs from 'fs';
import messageRoutes from './routes/messages.js';
import concernRoutes from './routes/concerns.js';
import multer from 'multer';
import auth from './middleware/auth.js'; // Add this import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create absolute path to uploads directory two levels up
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Set storage engine for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Use the uploadsDir defined earlier
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Serve uploads directory - make it absolute path
app.use('/uploads', express.static(uploadsDir));

// Update CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // Update this to match your frontend URL exactly
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

app.use(bodyParser.json());

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

mongoose.connect('mongodb://localhost:27017/iccthub', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Save message to database
            const newMessage = new Message({
                sender: data.sender,
                receiver: data.receiver,
                content: data.content,
                timestamp: data.timestamp
            });
            await newMessage.save();
            
            // Broadcast to all clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocketServer.OPEN) {
                    client.send(JSON.stringify(newMessage));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

app.post('/api/posts', auth, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const image = req.file ? `/${req.file.filename}` : null;

        const post = new Post({
            content,
            image,
            author: req.user._id // Use req.user._id instead of req.userId
        });

        const savedPost = await post.save();
        
        // Populate author details before sending response
        const populatedPost = await Post.findById(savedPost._id)
            .populate('author', 'username profilePic');
            
        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post' });
    }
});

app.put('/api/posts/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const image = req.file ? `/${req.file.filename}` : undefined;

        const updateData = { content };
        if (image) {
            updateData.image = image;
        }
        if (req.body.removeImage === 'true') {
            updateData.image = null;
        }

        const post = await Post.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(post);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Error updating post' });
    }
});

// Add route to get all posts
app.get('/api/posts', auth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username profilePic')
            .populate('comments.user', 'username profilePic') // Populate comment user details
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// Add route to delete a post
app.delete('/api/posts/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await post.remove();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post' });
    }
});

// Add comment to a post
app.post('/api/posts/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = {
            content: req.body.content,
            user: req.user._id,
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();

        // Populate the new comment's user details
        const populatedPost = await Post.findById(post._id)
            .populate('comments.user', 'username profilePic');

        const newComment = populatedPost.comments[populatedPost.comments.length - 1];
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

// Update your post routes to use auth middleware
app.use('/api/posts', postRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/concerns', concernRoutes);

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirect to login page by default
app.get('/', (req, res) => {
    res.redirect('/IHUBLogin.html');
});

// Fallback to index.html for single-page applications
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'IHUBHome.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});