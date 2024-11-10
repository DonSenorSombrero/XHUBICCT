document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is authenticated
    checkAuthentication();

    // Initialize UI components
    initializeNavigation();
    initializeModal();
    initializeUtilityDropdown();
    
    // Fetch profile data for the create post box
    loadUserProfile();

    document.getElementById('profileLink').addEventListener('click', (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const username = payload.username;
                if (username) {
                    window.location.href = `/IHUBProfile.html?username=${username}`;
                } else {
                    // If no username in token, fetch from profile endpoint
                    fetch('/api/auth/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.username) {
                            window.location.href = `/IHUBProfile.html?username=${data.username}`;
                        } else {
                            throw new Error('No username found');
                        }
                    })
                    .catch(err => console.error('Error fetching user profile:', err));
                }
            } catch (error) {
                console.error('Error parsing token or fetching profile:', error);
            }
        } else {
            console.error('No token found in localStorage');
        }
    });
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

    // Remove duplicate submit handler since it's in IHUBHomePosts.js
    // Remove submitBtn?.addEventListener('click', async () => { ... });

    // Close modal handlers
    closeModalBtn?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
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
    const getProfilePicPath = (picPath) => {
        if (!picPath) return '../uploads/Images/ProfileIMG.png';
        if (picPath.startsWith('http')) return picPath;
        if (picPath.startsWith('../uploads')) return picPath;
        return `../uploads/${picPath}`;
    };

    const userAvatar = document.querySelector('.user-avatar');
    const modalUserAvatar = document.getElementById('modalUserAvatar');
    
    if (userAvatar) {
        userAvatar.src = getProfilePicPath(profile.profilePic);
    }
    
    if (modalUserAvatar) {
        modalUserAvatar.src = getProfilePicPath(profile.profilePic);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Get elements
    const openModalBtn = document.getElementById("openModalBtn");
    const modalTextArea = document.getElementById("modalTextArea");
    const imageInput = document.getElementById("imageInput");
    const imageBtn = document.getElementById("imageBtn");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const removeImageBtn = document.getElementById("removeImage");
    const modalUserAvatar = document.getElementById("modalUserAvatar");
    let postText = ""; // Store the text

    // Sync text between button and modal
    openModalBtn.addEventListener("click", () => {
        modalTextArea.value = postText;
        // Also fetch user data
        fetchUserData();
    });

    modalTextArea.addEventListener("input", (event) => {
        postText = event.target.value;
        openModalBtn.textContent = postText || "What's on your mind?";
    });

    // Fetch user data function
    async function fetchUserData() {
        try {
            const response = await fetch("/api/auth/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                document.querySelectorAll(".user-name").forEach(element => {
                    if (element) element.textContent = userData.username;
                });
                
                const modalUserAvatar = document.getElementById("modalUserAvatar");
                if (modalUserAvatar) {
                    modalUserAvatar.src = userData.profilePic ? 
                        (userData.profilePic.startsWith('http') ? userData.profilePic :
                         userData.profilePic.startsWith('../uploads') ? userData.profilePic :
                         `../uploads/${userData.profilePic}`) :
                        '../uploads/Images/ProfileIMG.png';
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    // Close modal handler
    document.getElementById("closeModal").addEventListener("click", () => {
        document.getElementById("modal").style.display = "none";
    });

    document.getElementById("closeEditModal").addEventListener("click", () => {
        document.getElementById("editModal").style.display = "none";
    });

    // Image upload functionality for post creation modal
    imageBtn.addEventListener("click", () => {
        imageInput.click();
    });

    imageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener("click", () => {
        imageInput.value = "";
        imagePreviewContainer.style.display = "none";
        imagePreview.src = "";
    });

    // Image upload functionality for edit post modal
    const editImageInput = document.getElementById('editImageInput');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');
    const removeEditImageBtn = document.getElementById('removeEditImage');

    // Handle image selection
    editImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                editImagePreview.src = e.target.result;
                editImagePreviewContainer.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    removeEditImageBtn.addEventListener("click", () => {
        editImageInput.value = "";
        editImagePreviewContainer.style.display = "none";
        editImagePreview.src = "";
    });
});

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const username = payload.username;
            if (username) {
                const currentUserName = document.getElementById("currentUserName");
                if (currentUserName) {
                    currentUserName.textContent = username;
                }
            } else {
                await fetchUserData();
            }
        } catch (error) {
            console.error("Error parsing token:", error);
            await fetchUserData();
        }
    } else {
        await fetchUserData();
    }

    async function fetchUserData() {
        try {
            const response = await fetch("/api/auth/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                const currentUserName = document.getElementById("currentUserName");
                if (currentUserName) {
                    currentUserName.textContent = userData.username;
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }
});

document.getElementById('profileLink').addEventListener('click', (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const username = payload.username;
            if (username) {
                window.location.href = `/IHUBProfile.html?username=${username}`;
            } else {
                // If no username in token, fetch from profile endpoint
                fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.username) {
                        window.location.href = `/IHUBProfile.html?username=${data.username}`;
                    } else {
                        throw new Error('No username found');
                    }
                })
                .catch(err => console.error('Error fetching user profile:', err));
            }
        } catch (error) {
            console.error('Error parsing token or fetching profile:', error);
        }
    } else {
        console.error('No token found in localStorage');
    }
});
