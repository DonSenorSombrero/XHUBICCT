document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'IHUBLogin.html';
        return;
    }

    try {
        const userResponse = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userResponse.ok) throw new Error('Failed to fetch user profile');

        const currentUser = await userResponse.json();

        const postsResponse = await fetch('/api/posts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!postsResponse.ok) throw new Error('Failed to fetch posts');

        const posts = await postsResponse.json();
        const postsContainer = document.getElementById('posts');
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${post.author.profilePic || 'Images/ProfileIMG.png'}" alt="Avatar" class="post-avatar">
                    <div class="post-user-info">
                        <div class="post-username">${post.author.username}</div>
                        <div class="post-timestamp">${new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                    <div class="post-actions">
                        ${currentUser._id === post.author._id ? `
                            <button class="post-action edit-btn">Edit</button>
                            <button class="post-action delete-btn">Delete</button>
                        ` : `
                            <button class="post-action report-btn">Report</button>
                        `}
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
            `;
            postsContainer.appendChild(postElement);

            if (currentUser._id === post.author._id) {
                postElement.querySelector('.edit-btn').addEventListener('click', () => {
                    // Implement edit functionality
                });

                postElement.querySelector('.delete-btn').addEventListener('click', async () => {
                    try {
                        const response = await fetch(`/api/posts/${post._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) throw new Error('Failed to delete post');

                        postElement.remove();
                    } catch (error) {
                        console.error('Error deleting post:', error);
                    }
                });
            } else {
                postElement.querySelector('.report-btn').addEventListener('click', () => {
                    // Implement report functionality
                });
            }
        });
    } catch (error) {
        console.error('Error fetching posts or user profile:', error);
    }
});