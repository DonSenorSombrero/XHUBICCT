let postText = ""; // Define postText at the beginning

const openModal = () => {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modalTextArea").value = postText;
};

const closeModal = () => {
  document.getElementById("modal").style.display = "none";
};

const syncText = (event) => {
  postText = event.target.value;
  document.getElementById("modalTextArea").value = postText;
};

document.getElementById("openModalBtn").onclick = openModal;
document.getElementById("textArea").onclick = openModal;
document.getElementById("textArea").addEventListener("input", syncText);
document.getElementById("modalTextArea").addEventListener("input", syncText);
document.getElementById("closeModal").onclick = closeModal;

document.getElementById("submitPostModalBtn").onclick = async () => {
  const content = document.getElementById('modalTextArea').value;
  const imageInput = document.getElementById('imageInput');
  const formData = new FormData();
  
  formData.append('content', content.trim());
  
  if (imageInput.files.length > 0) {
      formData.append('image', imageInput.files[0]);
  }

  try {
      const response = await fetch('/api/posts', {
          method: 'POST',
          credentials: 'include',
          body: formData
      });

      if (!response.ok) {
          throw new Error('Failed to create post');
      }

      document.getElementById('modalTextArea').value = '';
      imageInput.value = '';
      document.getElementById('imagePreviewContainer').style.display = 'none';
      closeModal();
      await fetchPosts(); // Refresh posts
  } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post: ' + error.message);
  }
};

window.fetchPosts = async () => {
    const postsContainer = document.getElementById('postsContainer');
    try {
        const response = await fetch('/api/posts', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }

        const posts = await response.json();
        console.log('Fetched posts:', posts);
        
        if (!postsContainer) {
            console.error('Posts container not found!');
            return;
        }

        postsContainer.innerHTML = ''; // Clear existing posts
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<div class="no-posts">No posts yet</div>';
            return;
        }

        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        if (postsContainer) {
            postsContainer.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
        }
    }
};

const createPostElement = (post) => {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.postId = post._id;
    
    // Update image paths to be consistent
    const likeImagePath = post.isLiked ? 'Images/LikedIMG.png' : 'Images/LikeIMG.png';
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-header-left">
                <img src="${post.author.profilePic || 'Images/ProfileIMG.png'}" alt="Profile" class="profile-pic">
                <div class="post-user-info">
                    <span class="username">${post.author.username}</span>
                    <span class="post-timestamp">${formatTimestamp(post.createdAt)}</span>
                </div>
            </div>
            ${post.isAuthor ? `
                <button class="post-menu-btn">⋮</button>
                <div class="post-dropdown" style="display: none;">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            ` : ''}
        </div>
        <div class="post-content">
            <p>${linkify(post.content)}</p>
            ${post.image ? `
                <div class="post-image-container">
                    <img src="../uploads${post.image}" alt="Post Image" class="post-image" style="max-width: 500px; max-height: 500px;">
                </div>
            ` : ''}
        </div>
        <div class="post-actions">
            <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                <img src="${likeImagePath}" alt="Like" class="like-icon">
                <span class="like-count">${post.likeCount || 0}</span>
            </button>
            <button class="action-btn comment-btn">
                <img src="Images/CommentIMG.png" alt="Comment">
                <span>${post.commentCount || 0}</span>
            </button>
        </div>
        <div class="comments-section" style="display: none;">
            <div class="comments-list"></div>
            <div class="comment-input-container">
                <input type="text" placeholder="Write a comment..." class="comment-input">
                <button class="comment-submit-btn">Post</button>
            </div>
        </div>
    `;

    // Add event listener for like button
    const likeBtn = postElement.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            try {
                const postId = postElement.dataset.postId;
                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to update like');
                
                const data = await response.json();
                
                // Update the UI
                const likeImg = likeBtn.querySelector('img');
                const likeCount = likeBtn.querySelector('.like-count');
                
                likeBtn.classList.toggle('liked', data.isLiked);
                likeImg.src = `Images/${data.isLiked ? 'LikedIMG.png' : 'LikeIMG.png'}`;
                likeCount.textContent = data.likeCount;
                
            } catch (error) {
                console.error('Error updating like:', error);
            }
        });
    }

    // ... existing event listeners ...

    // Update edit functionality to handle images
    const editBtn = postElement.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            openEditModal(post);
        });
    }

    return postElement;
};

const openEditModal = (post) => {
    const editModal = document.getElementById('editModal');
    const editTextArea = document.getElementById('editModalTextArea');
    const editImagePreview = document.getElementById('editImagePreview');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImageInput = document.getElementById('editImageInput');

    if (!editModal || !editTextArea) {
        console.error('Edit modal elements not found!');
        return;
    }

    // Set existing post content
    editTextArea.value = post.content;

    // Set existing image preview if post has an image
    if (post.image) {
        editImagePreview.src = post.image;
        editImagePreviewContainer.style.display = 'block';
    } else {
        editImagePreviewContainer.style.display = 'none';
        editImagePreview.src = '';
    }

    // Clear any previously selected file
    editImageInput.value = '';

    editModal.style.display = 'flex';

    // Handle save edit
    document.getElementById('saveEditModalBtn').onclick = async () => {
        const formData = new FormData();
        formData.append('content', editTextArea.value);

        // Add new image if selected
        if (editImageInput.files.length > 0) {
            formData.append('image', editImageInput.files[0]);
        } else if (editImagePreviewContainer.style.display === 'none' && post.image) {
            // If the image was removed (preview container is hidden) and there was an original image
            formData.append('removeImage', 'true');
        }

        try {
            await updatePost(post._id, formData);
            editModal.style.display = 'none';
            await fetchPosts(); // Refresh posts after update
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post: ' + error.message);
        }
    };

    // Handle modal close
    document.getElementById('closeEditModal').onclick = () => {
        editModal.style.display = 'none';
    };

    // Handle new image selection
    document.getElementById('editImageInput').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                editImagePreview.src = e.target.result;
                editImagePreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle remove image button
    document.getElementById('removeEditImage').onclick = (e) => {
        e.preventDefault();
        editImageInput.value = '';
        editImagePreviewContainer.style.display = 'none';
        editImagePreview.src = '';
    };
};

const updatePost = async (postId, formData) => {
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        if (response.ok) {
            window.fetchPosts();
        } else {
            throw new Error('Failed to update post');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        alert('Network error: ' + error.message);
    }
};

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.postId = post._id;
    
    // Update image paths to be consistent
    const likeImagePath = post.isLiked ? 'Images/LikedIMG.png' : 'Images/LikeIMG.png';
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-header-left">
                <img src="${post.author.profilePic || 'Images/ProfileIMG.png'}" alt="Profile" class="profile-pic">
                <div>
                    <span class="username">${post.author.username}</span>
                    <span class="post-time">${formatTimestamp(post.createdAt)}</span>
                </div>
            </div>
            ${post.isAuthor ? `
                <button class="post-menu-btn">⋮</button>
                <div class="post-dropdown" style="display: none;">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            ` : ''}
        </div>
        <div class="post-content">
            <p>${linkify(post.content)}</p>
            ${post.image ? `<img src="../uploads${post.image}" alt="Post Image" class="post-image" style="max-width: 500px; max-height: 500px;">` : ''}
        </div>
        <div class="post-actions">
            <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                <img src="${likeImagePath}" alt="Like" class="like-icon">
                <span class="like-count">${post.likeCount || 0}</span>
            </button>
            <button class="action-btn comment-btn">
                <img src="Images/CommentIMG.png" alt="Comment">
                <span>${post.commentCount || 0}</span>
            </button>
        </div>
        <div class="comments-section" style="display: none;">
            <div class="comments-list"></div>
            <div class="comment-input-container">
                <input type="text" placeholder="Write a comment..." class="comment-input">
                <button class="comment-submit-btn">Post</button>
            </div>
        </div>
    `;

    // Add event listener for like button
    const likeBtn = postElement.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            try {
                const postId = postElement.dataset.postId;
                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to update like');
                
                const data = await response.json();
                
                // Update the UI
                const likeImg = likeBtn.querySelector('img');
                const likeCount = likeBtn.querySelector('.like-count');
                
                likeBtn.classList.toggle('liked', data.isLiked);
                likeImg.src = `Images/${data.isLiked ? 'LikedIMG.png' : 'LikeIMG.png'}`;
                likeCount.textContent = data.likeCount;
                
            } catch (error) {
                console.error('Error updating like:', error);
            }
        });
    }

    // Add your existing event listeners for post actions
    addPostEventListeners(postElement, post);
    
    return postElement;
}

// Initialize image upload preview
document.getElementById('imageBtn')?.addEventListener('click', () => {
    document.getElementById('imageInput').click();
});

document.getElementById('imageInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();
});

document.getElementById('editImageInput')?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('editImagePreview');
            preview.src = e.target.result;
            document.getElementById('editImagePreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('removeEditImage')?.addEventListener('click', () => {
    document.getElementById('editImageInput').value = '';
    document.getElementById('editImagePreviewContainer').style.display = 'none';
});

// Initial fetch of posts
window.fetchPosts();

// Call fetchPosts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();
});

const linkify = (text) => {
  const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
};

const deletePost = async (postId) => {
  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok) {
      window.fetchPosts();
    } else {
      alert('Failed to delete post');
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
};

const addCommentEventListeners = (commentElement, postId, commentId) => {
  const likeBtn = commentElement.querySelector('.comment-like-btn');
  const likeIcon = commentElement.querySelector('.comment-like-icon');
  const likeCount = commentElement.querySelector('.comment-like-count');

  if (likeBtn) {
    likeBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          likeCount.textContent = data.likes;
          likeIcon.src = data.isLiked ? '/Images/LikedIMG.png' : '/Images/LikeIMG.png';
          likeBtn.classList.toggle('liked', data.isLiked);
        }
      } catch (error) {
        console.error('Error liking comment:', error);
      }
    };
  }

  const menuBtn = commentElement.querySelector('.comment-menu-btn');
  const dropdown = commentElement.querySelector('.comment-dropdown');
  const editBtn = commentElement.querySelector('.comment-edit-btn');
  const deleteBtn = commentElement.querySelector('.comment-delete-btn');

  if (menuBtn) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
  }

  document.addEventListener('click', () => {
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  });

  if (editBtn) {
    editBtn.onclick = async (e) => {
      e.stopPropagation();
      const commentContent = commentElement.querySelector('p').textContent;
      const newContent = prompt('Edit your comment:', commentContent);

      if (newContent && newContent !== commentContent) {
        try {
          const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content: newContent })
          });

          if (response.ok) {
            commentElement.querySelector('p').textContent = newContent;
            dropdown.style.display = 'none';
          }
        } catch (error) {
          console.error('Error updating comment:', error);
        }
      }
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async (e) => {//
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this comment?')) {
        try {
          const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            commentElement.remove();
            const commentCount = document.querySelector('.comment-count');
            commentCount.textContent = parseInt(commentCount.textContent) - 1;
          }
        } catch (error) {
          console.error('Error deleting comment:', error);
        }
      }
      dropdown.style.display = 'none';
    };
  }
};

// Add image preview functionality for edit modal
document.getElementById('editImageInput')?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('editImagePreview');
            preview.src = e.target.result;
            document.getElementById('editImagePreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('removeEditImage')?.addEventListener('click', () => {
    document.getElementById('editImageInput').value = '';
    document.getElementById('editImagePreviewContainer').style.display = 'none';
});

// Initial fetch of posts
window.fetchPosts();

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
};
