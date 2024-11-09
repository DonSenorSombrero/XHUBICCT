import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `profile-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        const user = new User({ username, email, password, phone, userRole: '' });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, phone, password } = req.body;

    try {
        const user = await User.findOne({ $or: [{ email }, { phone }] });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email/phone or password' });
        }

        const token = jwt.sign({ _id: user._id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

router.get('/check', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ authenticated: false, message: 'Not authenticated' });
    }
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        res.json({ authenticated: true, user: decoded });
    } catch (error) {
        res.status(401).json({ authenticated: false, message: 'Invalid token' });
    }
});

// Get profile data
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('username profilePic userRole');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Update profile
router.put('/profile', auth, upload.single('profilePic'), async (req, res) => {
    try {
        const { name, bio } = req.body;
        const updateData = { name, bio };
        
        if (req.file) {
            updateData.profilePic = `/uploads/profiles/${req.file.filename}`;
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePic: `/uploads/${req.file.filename}` },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;