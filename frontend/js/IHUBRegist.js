document.getElementById('registrationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const phone = document.getElementById('phone').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, phone })
        });

        if (!response.ok) {
            throw new Error('Failed to register');
        }

        const data = await response.json();
        alert(data.message);
        window.location.href = 'IHUBLogin.html';
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Error during registration');
    }
});
