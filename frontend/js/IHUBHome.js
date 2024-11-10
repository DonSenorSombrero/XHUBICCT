// ...existing code...
window.fetchPosts = async () => {
    const postsContainer = document.getElementById('postsContainer');
    try {
        const response = await fetch('/api/posts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const posts = await response.json();
        console.log('Fetched posts:', posts);
        
        if (!postsContainer) {
            console.error('Posts container not found!');
            return;
        }

        postsContainer.innerHTML = ''; // Clear existing posts
        
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        alert('Failed to load posts. Please try again later.');
    }
};

const createPostElement = (post) => {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.postId = post._id;
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-header-left">
                <img src="${post.author.profilePic ? 
                    (post.author.profilePic.startsWith('http') ? post.author.profilePic :
                     post.author.profilePic.startsWith('../uploads') ? post.author.profilePic :
                     `../uploads/${post.author.profilePic}`) :
                    '../uploads/Images/ProfileIMG.png'}" alt="Profile Picture" class="profile-pic">
                <span class="username">${post.author.username}</span>
            </div>
            <button class="post-menu-btn">⋮</button>
            <div class="post-dropdown" style="display: none;">
                ${post.author._id === localStorage.getItem('userId') ? `
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                ` : `
                    <button class="report-btn">Report</button>
                `}
            </div>
        </div>
        <div class="content">
            <p>${linkify(post.content)}</p>
            ${post.image ? `<img src="../uploads${post.image}" alt="Post Image" class="post-image" style="max-width: 500px; max-height: 500px;">` : ''}
        </div>
        <div class="post-actions">
            <div class="action-btn">
                <button class="like-btn ${post.isLiked ? 'liked' : ''}">
                    <img src="/Images/${post.isLiked ? 'LikedIMG.png' : 'LikeIMG.png'}" alt="Like" class="like-icon">
                </button>
                <span class="like-count">${post.likeCount || 0}</span>
            </div>
            <div class="action-btn">
                <button class="comment-btn">
                    <img src="/Images/CommentIMG.png" alt="Comment">
                </button>
                <span class="comment-count">${post.comments?.length || 0}</span>
            </div>
        </div>
        <div class="comments-section" style="display: none;">
            <div class="comments-list">
                ${post.comments?.map(comment => `
                    <div class="comment" data-comment-id="${comment._id}">
                        <div class="comment-header">
                            <div class="comment-header-left">
                                <img src="${comment.user.profilePic ? 
                                    (comment.user.profilePic.startsWith('http') ? comment.user.profilePic :
                                     comment.user.profilePic.startsWith('../uploads') ? comment.user.profilePic :
                                     `../uploads/${comment.user.profilePic}`) :
                                    '../uploads/Images/ProfileIMG.png'}" alt="Profile Picture" class="comment-profile-pic">
                                <span class="username">${comment.user.username}</span>
                            </div>
                            <button class="comment-menu-btn">⋮</button>
                            <div class="comment-dropdown" style="display: none; position: absolute; right: 0; background-color: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 1000;">
                                ${comment.user._id === localStorage.getItem('userId') ? `
                                    <button class="comment-edit-btn">Edit</button>
                                    <button class="comment-delete-btn">Delete</button>
                                ` : `
                                    <button class="comment-report-btn">Report</button>
                                `}
                            </div>
                        </div>
                        <div class="comment-content">
                            <p>${comment.content}</p>
                        </div>
                        <div class="comment-footer">
                            <div class="comment-actions">
                                <div class="comment-action-btn">
                                    <button class="comment-like-btn ${comment.isLiked ? 'liked' : ''}">
                                        <img src="/Images/${comment.isLiked ? 'LikedIMG.png' : 'LikeIMG.png'}" alt="Like" class="comment-like-icon">
                                    </button>
                                    <span class="comment-like-count">${comment.likeCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('') || ''}
            </div>
            <div class="comment-input-container">
                <textarea class="comment-input" placeholder="Write a comment..."></textarea>
                <button class="comment-submit-btn">Comment</button>
            </div>
        </div>
    `;

    // Add event listeners for like button
    const likeBtn = postElement.querySelector('.like-btn');
    likeBtn.addEventListener('click', async (event) => {
        const postId = postElement.dataset.postId;
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                likeBtn.classList.toggle('liked', result.isLiked);
                likeBtn.querySelector('img').src = `/Images/${result.isLiked ? 'LikedIMG.png' : 'LikeIMG.png'}`;
                postElement.querySelector('.like-count').textContent = result.likeCount;
            } else {
                throw new Error('Failed to like post');
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    });

    // Add event listeners for comment like button
    postElement.querySelectorAll('.comment').forEach(commentElement => {
        const commentLikeBtn = commentElement.querySelector('.comment-like-btn');
        commentLikeBtn.addEventListener('click', async (event) => {
            const commentId = commentElement.dataset.commentId;
            try {
                const response = await fetch(`/api/posts/${post._id}/comments/${commentId}/like`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    commentLikeBtn.classList.toggle('liked', result.isLiked);
                    commentLikeBtn.querySelector('img').src = `/Images/${result.isLiked ? 'LikedIMG.png' : 'LikeIMG.png'}`;
                    commentElement.querySelector('.comment-like-count').textContent = result.likeCount;
                } else {
                    throw new Error('Failed to like comment');
                }
            } catch (error) {
                console.error('Error liking comment:', error);
            }
        });

        // Toggle dropdown
        const menuBtn = commentElement.querySelector('.comment-menu-btn');
        const dropdown = commentElement.querySelector('.comment-dropdown');
        const editBtn = commentElement.querySelector('.comment-edit-btn');
        const deleteBtn = commentElement.querySelector('.comment-delete-btn');
        const reportBtn = commentElement.querySelector('.comment-report-btn');

        menuBtn?.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!commentElement.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Edit comment
        editBtn?.addEventListener('click', () => {
            const commentId = commentElement.dataset.commentId;
            const contentElement = commentElement.querySelector('.comment-content p');
            const currentContent = contentElement.textContent;
            
            const textarea = document.createElement('textarea');
            textarea.value = currentContent;
            textarea.className = 'comment-edit-textarea';
            
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.className = 'comment-save-btn';
            
            contentElement.replaceWith(textarea);
            textarea.after(saveBtn);
            
            saveBtn.onclick = async () => {
                try {
                    const response = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: textarea.value })
                    });
                    
                    if (response.ok) {
                        await fetchPosts();
                    }
                } catch (error) {
                    console.error('Error updating comment:', error);
                }
            };
        });

        // Delete comment
        deleteBtn?.addEventListener('click', async () => {
            const commentId = commentElement.dataset.commentId;
            try {
                const response = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    await fetchPosts();
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        });

        // Report comment
        reportBtn?.addEventListener('click', () => {
            alert('Comment reported');
            dropdown.style.display = 'none';
        });
    });

    // Add event listeners for post menu button
    const postMenuBtn = postElement.querySelector('.post-menu-btn');
    const postDropdown = postElement.querySelector('.post-dropdown');
    postMenuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        postDropdown.style.display = postDropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!postElement.contains(event.target)) {
            postDropdown.style.display = 'none';
        }
    });

    // Prevent dropdown from closing when clicking inside
    postDropdown.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Add event listeners for edit and delete buttons if the user is the author
    if (post.author._id === localStorage.getItem('userId')) {
        postElement.querySelector('.edit-btn').addEventListener('click', () => {
            openEditModal(post);
            postDropdown.style.display = 'none';
        });

        postElement.querySelector('.delete-btn').addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/posts/${post._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    await fetchPosts(); // Refresh posts
                } else {
                    throw new Error('Failed to delete post');
                }
            } catch (error) {
                console.error('Error deleting post:', error);
            }
            postDropdown.style.display = 'none';
        });
    } else {
        // Add event listener for report button
        postElement.querySelector('.report-btn').addEventListener('click', () => {
            alert('Post reported.');
            postDropdown.style.display = 'none';
        });
    }

    // Add event listener for comment button
    const commentBtn = postElement.querySelector('.comment-btn');
    const commentsSection = postElement.querySelector('.comments-section');
    const commentInput = postElement.querySelector('.comment-input');
    const commentSubmitBtn = postElement.querySelector('.comment-submit-btn');

    commentBtn.addEventListener('click', () => {
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
        commentBtn.classList.toggle('active');
    });

    // Add event listener for comment submission
    commentSubmitBtn.addEventListener('click', async () => {
        const content = commentInput.value.trim();
        if (!content) return;

        try {
            const response = await fetch(`/api/posts/${post._id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                commentInput.value = ''; // Clear input
                await fetchPosts(); // Refresh posts to show new comment
            } else {
                throw new Error('Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    });

    // Handle pressing Enter to submit comment
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commentSubmitBtn.click();
        }
    });

    // Add event listeners for comment menu button and dropdown
    postElement.querySelectorAll('.comment').forEach(commentElement => {
        const menuBtn = commentElement.querySelector('.comment-menu-btn');
        const dropdown = commentElement.querySelector('.comment-dropdown');
        const editBtn = commentElement.querySelector('.comment-edit-btn');
        const deleteBtn = commentElement.querySelector('.comment-delete-btn');
        const reportBtn = commentElement.querySelector('.comment-report-btn');

        // Toggle dropdown
        menuBtn?.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!commentElement.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Edit comment
        editBtn?.addEventListener('click', () => {
            const commentId = commentElement.dataset.commentId;
            const contentElement = commentElement.querySelector('.comment-content p');
            const currentContent = contentElement.textContent;
            
            const textarea = document.createElement('textarea');
            textarea.value = currentContent;
            textarea.className = 'comment-edit-textarea';
            
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.className = 'comment-save-btn';
            
            contentElement.replaceWith(textarea);
            textarea.after(saveBtn);
            
            saveBtn.onclick = async () => {
                try {
                    const response = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: textarea.value })
                    });
                    
                    if (response.ok) {
                        await fetchPosts();
                    }
                } catch (error) {
                    console.error('Error updating comment:', error);
                }
            };
        });

        // Delete comment
        deleteBtn?.addEventListener('click', async () => {
            const commentId = commentElement.dataset.commentId;
            try {
                const response = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    await fetchPosts();
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        });

        // Report comment
        reportBtn?.addEventListener('click', () => {
            alert('Comment reported');
            dropdown.style.display = 'none';
        });
    });

    return postElement;
};

const openEditModal = (post) => {
    const modal = document.getElementById('editModal');
    const modalTextArea = document.getElementById('editModalTextArea');
    if (!modalTextArea) {
        console.error('Edit modal textarea not found!');
        return;
    }
    modalTextArea.value = post.content;
    modal.style.display = 'flex';

    document.getElementById('saveEditModalBtn').onclick = async () => {
        const newContent = modalTextArea.value;
        try {
            const response = await fetch(`/api/posts/${post._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            if (response.ok) {
                modal.style.display = 'none';
                await fetchPosts(); // Refresh posts
            } else {
                throw new Error('Failed to update post');
            }
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    document.getElementById('closeEditModal').onclick = () => {
        modal.style.display = 'none';
    };
};

const linkify = (text) => {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
};

document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();
    
    // Fix image upload handling inside modal
    const imageBtn = document.querySelector('.modal .image-btn');
    const imageInput = document.getElementById('imageInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    if (imageBtn) {
        imageBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default behavior
            imageInput.click(); // Trigger file input click
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Add remove image functionality
    const removeImageBtn = document.getElementById('removeImage');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            imagePreviewContainer.style.display = 'none';
            imagePreview.src = '';
        });
    }

    // Update the submit post handler
    const submitPostBtn = document.getElementById('submitPostModalBtn');
    if (submitPostBtn) {
        submitPostBtn.addEventListener('click', async () => {
            try {
                const modalTextArea = document.getElementById('modalTextArea');
                const imageInput = document.getElementById('imageInput');
                const imagePreviewContainer = document.getElementById('imagePreviewContainer');
                const imagePreview = document.getElementById('imagePreview');
                const modal = document.getElementById('modal');

                // Validate that required elements exist
                if (!modalTextArea || !imageInput || !imagePreviewContainer || !imagePreview || !modal) {
                    throw new Error('Required elements not found');
                }

                const content = modalTextArea.value.trim();
                const formData = new FormData();

                // Validate content
                if (!content) {
                    alert('Please enter some content for your post');
                    return;
                }

                // Append content and image to formData
                formData.append('content', content);
                if (imageInput.files.length > 0) {
                    formData.append('image', imageInput.files[0]);
                }

                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to create post');
                }

                // Clear form and reset UI
                modalTextArea.value = '';
                imageInput.value = '';
                imagePreviewContainer.style.display = 'none';
                imagePreview.src = '';
                modal.style.display = 'none';

                // Reset stored post text if it exists
                if (typeof postText !== 'undefined') {
                    postText = '';
                }

                // Reset main textarea if it exists
                const mainTextArea = document.getElementById('textArea');
                if (mainTextArea) {
                    mainTextArea.value = '';
                }

                // Refresh posts
                await window.fetchPosts();

            } catch (error) {
                console.error('Error creating post:', error);
                alert('Failed to create post: ' + error.message);
            }
        });
    }

    // Initialize other event listeners
    const modalOpen = document.getElementById("openModalBtn");
    const modalClose = document.getElementById("closeModal");
    const modalTextArea = document.getElementById("modalTextArea");
    const textArea = document.getElementById("textArea");

    if (modalOpen) modalOpen.onclick = openModal;
    if (textArea) textArea.onclick = openModal;
    if (modalClose) modalClose.onclick = closeModal;
    if (modalTextArea) modalTextArea.addEventListener("input", syncText);
    if (textArea) textArea.addEventListener("input", syncText);
});

document.getElementById("openModalBtn").onclick = openModal;
document.getElementById("textArea").onclick = openModal;
document.getElementById("textArea").addEventListener("input", syncText);
document.getElementById("modalTextArea").addEventListener("input", syncText);
document.getElementById("closeModal").onclick = closeModal;

// Add modal open/close functions if they don't exist
const openModal = () => {
    document.getElementById("modal").style.display = "flex";
};

const closeModal = () => {
    document.getElementById("modal").style.display = "none";
    document.getElementById('modalTextArea').value = '';
    document.getElementById('textArea').value = '';  // Clear the main textarea
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('imagePreview').src = '';
    postText = ''; // Reset the stored post text
};

// Add event listeners for opening modal
document.getElementById("openModalBtn")?.addEventListener('click', openModal);
document.getElementById("closeModal")?.addEventListener('click', closeModal);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
});

// ...existing code...
