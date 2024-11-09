document.getElementById("homeBtn").onclick = () => {
  window.location.href = "IHUBHome.html";
};

document.getElementById("questionBtn").onclick = () => {
  window.location.href = "IHUBConcerns.html";
};

document.getElementById("portalBtn").onclick = () => {
  window.location.href = "IHUBPortal.html";
};

document.getElementById("searchBtn").onclick = () => {
  window.location.href = "IHUBSearch.html";
};

document.getElementById("profileBtn").onclick = () => {
  window.location.href = "IHUBProfile.html";
};

document.getElementById("notificationsBtn").onclick = () => {
  window.location.href = "IHUBNotifications.html";
};

document.getElementById("messagesBtn").onclick = () => {
  window.location.href = "IHUBMessaging.html";
};

document.querySelector('.utility-btn').onclick = (event) => {
  const dropdown = document.getElementById('utilityDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  event.stopPropagation();
};

document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('utilityDropdown');
  if (!event.target.matches('.utility-btn, .utility-btn *')) {
    dropdown.style.display = 'none';
  }
});

document.getElementById('logoutBtn').onclick = async () => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    if (response.ok) {
      window.location.href = 'IHUBLogin.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        window.location.href = 'IHUBLogin.html';
        return;
      }
      
      const userData = await response.json();
      
      const postContainerProfilePic = document.querySelector('.post-container img');
      if (postContainerProfilePic) {
        postContainerProfilePic.src = userData.profilePic || '/Images/ProfileIMG.png';
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      window.location.href = 'IHUBLogin.html';
    }
  };

  fetchUserProfile();

  // Add event listener for like buttons
  document.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
      const postElement = event.target.closest('.post');
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
  });
});
