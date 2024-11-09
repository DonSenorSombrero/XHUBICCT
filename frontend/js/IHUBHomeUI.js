document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is authenticated
    checkAuthentication();

    // Initialize UI components
    initializeNavigation();
    initializeModal();
    initializeUtilityDropdown();
    
    // Fetch profile data for the create post box
    loadUserProfile();
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'IHUBLogin.html';
        return;
    }

    fetch('/api/auth/check', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.authenticated) {
            window.location.href = 'IHUBLogin.html';
        }
    })
    .catch(error => {
        console.error('Error checking authentication:', error);
        window.location.href = 'IHUBLogin.html';
    });
}

function initializeNavigation() {
    const navButtons = {
        'homeBtn': 'IHUBHome.html',
        'questionBtn': 'IHUBConcerns.html',
        'portalBtn': 'IHUBPortal.html',
        'searchBtn': 'IHUBSearch.html',
        'profileBtn': 'IHUBProfile.html',
        'notificationsBtn': 'IHUBNotifications.html',
        'messagesBtn': 'IHUBMessaging.html'
    };

    Object.entries(navButtons).forEach(([id, url]) => {
        document.getElementById(id)?.addEventListener('click', () => {
            window.location.href = url;
        });
    });
}

function initializeModal() {
    const modal = document.getElementById('modal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const postInput = document.querySelector('.post-input-btn');

    // Open modal when clicking either the button or the input area
    [openModalBtn, postInput].forEach(element => {
        element?.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    });

    // Close modal
    closeModalBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function initializeUtilityDropdown() {
    const utilityBtn = document.querySelector('.utility-btn');
    const dropdown = document.createElement('div');
    dropdown.className = 'utility-dropdown';
    dropdown.innerHTML = `<button id="logoutBtn">Logout</button>`;
    document.body.appendChild(dropdown);

    utilityBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        const rect = utilityBtn.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.right = '20px';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'IHUBLogin.html';
    });
}

async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'IHUBLogin.html';
            return;
        }

        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const profile = await response.json();
        updateUIWithProfile(profile);
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateUIWithProfile(profile) {
    // Update avatar in create post box
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.src = profile.profilePic || 'Images/ProfileIMG.png';
    }
}
