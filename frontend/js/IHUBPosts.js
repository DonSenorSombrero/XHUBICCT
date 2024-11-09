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

      // Clear form and UI
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
      credentials: 'include'
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
        <img src="${post.author.profilePic || '/Images/ProfileIMG.png'}" alt="Profile Picture" class="profile-pic">
        <span class="username">${post.author.username}</span>
      </div>
      <button class="post-menu-btn">⋮</button>
    </div>
    <div class="content">
      <p>${linkify(post.content)}</p>
      ${post.image ? `<img src="../../uploads${post.image}" alt="Post Image" class="post-image" style="max-width: 500px; max-height: 500px;">` : ''}
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
                <img src="${comment.user.profilePic || '/Images/ProfileIMG.png'}" alt="Profile Picture" class="comment-profile-pic">
                <span class="comment-username">${comment.user.username}</span>
              </div>
              <button class="comment-menu-btn">⋮</button>
            </div>
            <div class="comment-content">
              <p>${comment.content}</p>
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
  postElement.querySelector('.like-btn').addEventListener('click', async (event) => {
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
        await fetchPosts(); // Refresh posts
      } else {
        throw new Error('Failed to like post');
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  });

  return postElement;
};

const linkify = (text) => {
  const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
};

const updatePost = async (postId, formData) => {
  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    // ...rest of the code...
  } catch (error) {
    console.error('Error updating post:', error);
  }
};

// Initial fetch of posts
window.fetchPosts();
