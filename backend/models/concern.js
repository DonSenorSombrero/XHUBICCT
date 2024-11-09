import mongoose from 'mongoose';

const concernSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    image: { type: String },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    createdAt: { type: Date, default: Date.now }
});

concernSchema.methods.isLikedByUser = function(userId) {
    return this.likes.includes(userId);
};

concernSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

concernSchema.set('toJSON', { virtuals: true });
concernSchema.set('toObject', { virtuals: true });

export default mongoose.model('Concern', concernSchema);
