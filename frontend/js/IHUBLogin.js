document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, phone, password })
        });

        if (!response.ok) {
            throw new Error('Failed to log in');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        alert(data.message);
        window.location.href = 'IHUBHome.html';
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error during login');
    }
});

document.getElementById('registerBtn').addEventListener('click', () => {
    window.location.href = 'IHUBRegist.html';
});

function redirectToRegister() {
    window.location.href = 'IHUBRegist.html';
}