document.addEventListener('DOMContentLoaded', () => {
    // Get profile ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    
    loadProfile(profileId);
});

async function loadProfile(profileId) {
    try {
        const response = await fetch(`/api/users/${profileId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const profileData = await response.json();
        const currentUserId = localStorage.getItem('userId');
        
        updateProfileUI(profileData, currentUserId === profileId);
        loadProfilePosts(profileId);
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileUI(profile, isOwnProfile) {
    const getProfilePicPath = (picPath) => {
        if (!picPath) return '../uploads/Images/ProfileIMG.png';
        if (picPath.startsWith('http')) return picPath;
        if (picPath.startsWith('../uploads')) return picPath;
        return `../uploads/${picPath}`;
    };
    
    // Update basic profile info
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'No bio yet';
    document.getElementById('profilePicture').src = getProfilePicPath(profile.profilePic);
    document.getElementById('profileBanner').src = profile.bannerPic || '../uploads/Images/DefaultBanner.png';
    
    // Update stats
    document.getElementById('postsCount').textContent = profile.postsCount || 0;
    document.getElementById('friendsCount').textContent = profile.friendsCount || 0;
    
    // Update action buttons based on whether it's the user's own profile
    const actionsContainer = document.getElementById('profileActions');
    actionsContainer.innerHTML = isOwnProfile ? 
        `<button class="action-btn edit-profile-btn" onclick="openEditProfileModal()">Edit Profile</button>` :
        `<button class="action-btn add-friend-btn" onclick="handleFriendRequest('${profile._id}')">Add Friend</button>`;
}

async function loadProfilePosts(userId) {
    try {
        const response = await fetch(`/api/posts/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const posts = await response.json();
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';
        
        posts.forEach(post => {
            const postElement = createPostElement(post); // Use your existing post creation function
            postsContainer.appendChild(postElement);
        });
        
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'flex';
    
    // Load current profile data into form
    document.getElementById('editUsername').value = document.getElementById('profileUsername').textContent;
    document.getElementById('editBio').value = document.getElementById('profileBio').textContent;
}

// Handle profile picture change
document.getElementById('changeProfilePicBtn').onclick = () => {
    document.getElementById('profilePicInput').click();
};

document.getElementById('profilePicInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
        const preview = document.getElementById('profilePicPreview');
        preview.src = URL.createObjectURL(file);
    }
};

// Handle banner change
document.getElementById('changeBannerBtn').onclick = () => {
    document.getElementById('bannerInput').click();
};

document.getElementById('bannerInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
        const preview = document.getElementById('bannerPreview');
        preview.src = URL.createObjectURL(file);
    }
};

// Save profile changes
document.getElementById('saveProfileBtn').onclick = async () => {
    const formData = new FormData();
    formData.append('username', document.getElementById('editUsername').value);
    formData.append('bio', document.getElementById('editBio').value);
    
    const profilePicInput = document.getElementById('profilePicInput');
    const bannerInput = document.getElementById('bannerInput');
    
    if (profilePicInput.files[0]) {
        formData.append('profilePic', profilePicInput.files[0]);
    }
    
    if (bannerInput.files[0]) {
        formData.append('bannerPic', bannerInput.files[0]);
    }
    
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to update profile');
        
        document.getElementById('editProfileModal').style.display = 'none';
        // Reload profile to show changes
        loadProfile(localStorage.getItem('userId'));
        
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
    }
};

// Handle friend request
async function handleFriendRequest(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/friend`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to send friend request');
        
        const button = document.querySelector('.add-friend-btn');
        button.textContent = 'Friend Request Sent';
        button.disabled = true;
        
    } catch (error) {
        console.error('Error sending friend request:', error);
        alert('Failed to send friend request');
    }
}

// Close modal
document.getElementById('closeEditProfileModal').onclick = () => {
    document.getElementById('editProfileModal').style.display = 'none';
};

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const tab = button.dataset.tab;
        // Handle tab content switching here
    });
});

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.postId = post._id;
    
    // Get current user ID from token
    const token = localStorage.getItem('token');
    let currentUserId = '';
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload._id || payload.userId; // Try both fields
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    // Check if current user is the author - compare string values
    const isAuthor = currentUserId && post.author._id.toString() === currentUserId.toString();

    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-header-left">
                <img src="${post.author.profilePic ? 
                    (post.author.profilePic.startsWith('http') ? post.author.profilePic :
                     post.author.profilePic.startsWith('../uploads') ? post.author.profilePic :
                     `../uploads/${post.author.profilePic}`) :
                    '../uploads/Images/ProfileIMG.png'}" alt="Profile" class="profile-pic">
                <div class="post-user-info">
                    <span class="username">${post.author.username}</span>
                    <span class="post-timestamp">${formatTimestamp(post.createdAt)}</span>
                </div>
            </div>
            <button class="post-menu-btn">⋮</button>
            <div class="post-dropdown" style="display: none;">
                ${isAuthor ? `
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                ` : `
                    <button class="report-btn">Report</button>
                `}
            </div>
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

    // Add event listeners for post menu
    const menuBtn = postElement.querySelector('.post-menu-btn');
    const dropdown = postElement.querySelector('.post-dropdown');
    const editBtn = postElement.querySelector('.edit-btn');
    const deleteBtn = postElement.querySelector('.delete-btn');
    const reportBtn = postElement.querySelector('.report-btn');

    menuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            openEditModal(post);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this post?')) {
                await deletePost(post._id);
            }
        });
    }

    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            alert('Post reported.');
        });
    }

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

    return postElement;
}
