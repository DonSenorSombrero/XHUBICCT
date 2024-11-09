import express from 'express';
import Message from '../models/message.js';
import User from '../models/user.js';  // Add this import
import auth from '../middleware/auth.js';

const router = express.Router();

// Get conversation history
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.userId, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.userId }
            ]
        }).sort('timestamp');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get contact list
router.get('/contacts', auth, async (req, res) => {
    try {
        const contacts = await User.find(
            { _id: { $ne: req.user.userId } },
            'username profilePic name'  // Include these fields
        );
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;