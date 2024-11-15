import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded; // Attach the decoded token to the request object
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export default auth;