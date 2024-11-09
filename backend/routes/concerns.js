import express from 'express';
import Concern from '../models/concern.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all concerns
router.get('/', auth, async (req, res) => {
    try {
        const concerns = await Concern.find()
            .populate('author', 'username profilePic name')
            .populate('comments.user', 'username profilePic name')
            .sort('-createdAt');

        // Add isLiked field to each concern
        const concernsWithLikeStatus = concerns.map(concern => {
            const concernObj = concern.toObject();
            concernObj.isLiked = concern.likes.includes(req.user.userId);
            concernObj.comments = concernObj.comments.map(comment => ({
                ...comment,
                isLiked: comment.likes.includes(req.user.userId)
            }));
            return concernObj;
        });

        res.json(concernsWithLikeStatus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new concern
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const concern = new Concern({
            content: req.body.content,
            author: req.user.userId,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });

        await concern.save();
        const populatedConcern = await Concern.findById(concern._id)
            .populate('author', 'username profilePic name');

        res.status(201).json(populatedConcern);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Like/unlike a concern
router.post('/:id/like', auth, async (req, res) => {
    try {
        const concern = await Concern.findById(req.params.id);
        const userLikeIndex = concern.likes.indexOf(req.user.userId);

        if (userLikeIndex === -1) {
            concern.likes.push(req.user.userId);
        } else {
            concern.likes.splice(userLikeIndex, 1);
        }

        await concern.save();
        res.json({ 
            likes: concern.likes.length,
            isLiked: userLikeIndex === -1
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add comment to a concern
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const concern = await Concern.findById(req.params.id);
        concern.comments.push({
            content: req.body.content,
            user: req.user.userId
        });

        await concern.save();
        
        const populatedConcern = await Concern.findById(concern._id)
            .populate('comments.user', 'username profilePic name');
        
        const newComment = populatedConcern.comments[populatedConcern.comments.length - 1];
        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Like/unlike a comment
router.post('/:id/comments/:commentId/like', auth, async (req, res) => {
    try {
        const concern = await Concern.findById(req.params.id);
        const comment = concern.comments.id(req.params.commentId);
        
        const userLikeIndex = comment.likes.indexOf(req.user.userId);
        
        if (userLikeIndex === -1) {
            comment.likes.push(req.user.userId);
        } else {
            comment.likes.splice(userLikeIndex, 1);
        }
        
        await concern.save();
        res.json({ 
            likes: comment.likes.length,
            isLiked: userLikeIndex === -1
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
