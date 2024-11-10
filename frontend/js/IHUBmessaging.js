document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'IHUBLogin.html';
        return;
    }

    // Check authentication
    fetch('/api/auth/check', { credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                window.location.href = 'IHUBLogin.html';
            }
        })
        .catch(() => {
            window.location.href = 'IHUBLogin.html';
        });

    // Navigation buttons - Updated with correct paths
    document.getElementById('homeBtn').onclick = () => {
        window.location.href = 'IHUBHome.html';
    };

    document.getElementById('questionBtn').onclick = () => {
        window.location.href = 'IHUBConcerns.html';
    };

    document.getElementById('portalBtn').onclick = () => {
        window.location.href = 'IHUBPortal.html';
    };

    // Utility dropdown
    document.querySelector('.utility-btn').onclick = (event) => {
        const dropdown = document.getElementById('utilityDropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        event.stopPropagation();
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const dropdown = document.getElementById('utilityDropdown');
        if (!event.target.matches('.utility-btn, .utility-btn *')) {
            dropdown.style.display = 'none';
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').onclick = () => {
        document.cookie = 'token=; Max-Age=0';
        window.location.href = 'IHUBLogin.html';
    };

    // Messaging functionality
    const contactsList = document.getElementById('contactsList');
    const messages = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');

    let selectedContact = null;
    const ws = new WebSocket('ws://localhost:3000'); // Ensure this matches your backend server URL

    // Modified loadContacts function
    const loadContacts = async () => {
        try {
            const response = await fetch('/api/messages/contacts', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load contacts');
            }

            const contacts = await response.json();
            
            contactsList.innerHTML = contacts.map(contact => `
                <div class="contact" data-id="${contact._id}">
                    <img src="${contact.profilePic ? 
                        (contact.profilePic.startsWith('http') ? contact.profilePic :
                         contact.profilePic.startsWith('../uploads') ? contact.profilePic :
                         `../uploads/${contact.profilePic}`) :
                        '../uploads/Images/ProfileIMG.png'}" alt="Profile">
                    <div class="contact-info">
                        <span class="contact-name">${contact.name || contact.username}</span>
                        ${contact.name ? `<span class="contact-username">@${contact.username}</span>` : ''}
                    </div>
                </div>
            `).join('');

            // Add click handlers to contacts
            document.querySelectorAll('.contact').forEach(contact => {
                contact.addEventListener('click', () => {
                    document.querySelectorAll('.contact').forEach(c => c.classList.remove('selected'));
                    contact.classList.add('selected');
                    selectedContact = contact.dataset.id;
                    loadMessages(selectedContact);
                });
            });
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    // Load messages for selected contact
    const loadMessages = async (contactId) => {
        const response = await fetch(`/api/messages/${contactId}`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const messageHistory = await response.json();
        
        messages.innerHTML = messageHistory.map(msg => `
            <div class="message ${msg.sender === localStorage.getItem('userId') ? 'sent' : 'received'}">
                <p>${msg.content}</p>
                <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
        
        messages.scrollTop = messages.scrollHeight;
    };

    // WebSocket message handling
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.sender === selectedContact || message.receiver === selectedContact) {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.sender === localStorage.getItem('userId') ? 'sent' : 'received'}`;
            messageElement.innerHTML = `
                <p>${message.content}</p>
                <span>${new Date(message.timestamp).toLocaleTimeString()}</span>
            `;
            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
        }
    };

    // Initialize
    loadContacts();

    document.getElementById('sendMessage').addEventListener('click', async () => {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value;

        if (!content) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const message = await response.json();
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'sent');
            messageElement.innerText = message.content;
            document.getElementById('messages').appendChild(messageElement);
            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
});
