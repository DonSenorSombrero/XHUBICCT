import express from 'express';
import multer from 'multer';
import Post from '../models/post.js';
import auth from '../middleware/auth.js';
import path from 'path';
import mongoose from 'mongoose';
import fs from 'fs';

const postSchema = new mongoose.Schema({
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: String,
    createdAt: { type: Date, default: Date.now }
});

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Add file extension to ensure proper mime type
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Get all posts
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username profilePic')
            .populate('likes')
            .sort({ createdAt: -1 });

        // Add isLiked field to each post
        const postsWithLikeStatus = posts.map(post => {
            const postObj = post.toObject();
            postObj.likes = post.likes;
            postObj.likeCount = post.likes.length;
            postObj.isLiked = post.likes.some(like => like.toString() === req.user._id.toString());
            return postObj;
        });

        res.json(postsWithLikeStatus);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// Route to create a new post with an image
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        // Add debug logging
        console.log('File received:', req.file);
        console.log('Upload path:', req.file ? req.file.path : 'No file');
        
        const newPost = new Post({
            content: req.body.content,
            author: req.user.userId,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });
        
        // Log the post data
        console.log('New post data:', newPost);
        
        const savedPost = await newPost.save();
        console.log('Saved post:', savedPost);
        
        const populatedPost = await Post.findById(savedPost._id)
            .populate('author', 'username profilePic');
            
        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(400).json({ error: error.message });
    }
});

// Like/unlike a post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Initialize likes array if it doesn't exist
        if (!post.likes) {
            post.likes = [];
        }

        const userLikeIndex = post.likes.findIndex(like => 
            like.toString() === req.user._id.toString()
        );
        
        const isNowLiked = userLikeIndex === -1;

        if (isNowLiked) {
            post.likes.push(req.user._id);
        } else {
            post.likes.splice(userLikeIndex, 1);
        }

        await post.save();
        
        res.json({ 
            likeCount: post.likes.length,
            isLiked: isNowLiked
        });
    } catch (error) {
        console.error('Like error:', error);
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Compare post author ID with authenticated user ID
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to edit this post' });
        }
        
        post.content = req.body.content;
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Compare post author ID with authenticated user ID
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }

        await post.remove();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add comment to a post
router.post('/:postId/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = {
            user: req.user.userId,
            content: req.body.content,
            timestamp: new Date(),
            likeCount: 0,
            likes: []
        };

        post.comments.push(comment);
        await post.save();

        // Fetch the populated comment to return
        const populatedPost = await Post.findById(post._id)
            .populate('comments.user', 'username profilePic');
        
        const newComment = populatedPost.comments[populatedPost.comments.length - 1];
        
        res.json({
            ...newComment.toObject(),
            isLiked: false,
            likeCount: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update comment like route
router.post('/:postId/comments/:commentId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Initialize likes array if it doesn't exist
        if (!comment.likes) {
            comment.likes = [];
        }

        const likeIndex = comment.likes.indexOf(req.user.userId);
        let isLiked = false;

        if (likeIndex === -1) {
            comment.likes.push(req.user.userId);
            isLiked = true;
        } else {
            comment.likes.splice(likeIndex, 1);
        }

        await post.save();

        // Send back updated like count and status
        res.json({ 
            likes: comment.likes.length, 
            isLiked,
            commentId: comment._id 
        });
    } catch (error) {
        console.error('Error in comment like:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add route for editing comments
router.put('/:postId/comments/:commentId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the comment author
        if (comment.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        comment.content = req.body.content;
        await post.save();

        res.json({ message: 'Comment updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add route for deleting comments
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the comment author
        if (comment.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        comment.remove();
        await post.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;