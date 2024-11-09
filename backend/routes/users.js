router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('username bio profilePic bannerPic');
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get counts
        const postsCount = await Post.countDocuments({ author: user._id });

    }
});