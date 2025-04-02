const auth = {
    // Check if user is authenticated
    checkAuth: () => {
        const token = localStorage.getItem('token');
        return !!token;
    },

    // Handle login
    login: async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Credenciais inválidas');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            console.error('Erro no login:', error);
            utils.showFeedback('Credenciais inválidas', 'error');
        }
    },

    // Handle logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    },

    // Get current user
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Setup login form
    setupLoginForm: () => {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;
                const password = form.querySelector('input[type="password"]').value;
                await auth.login(email, password);
            });
        }
    },

    // Setup permissions based on user role
    setupPermissions: () => {
        const user = auth.getCurrentUser();
        if (!user) return;

        // Update UI with user info
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }

        // Setup logout button
        const logoutButton = document.querySelector('.logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', auth.logout);
        }

        // Add role-based classes to body
        document.body.classList.add(`role-${user.role}`);
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    // Setup login form if on login page
    if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        auth.setupLoginForm();
    }
    // Setup permissions if authenticated
    else if (auth.checkAuth()) {
        auth.setupPermissions();
    }
});

// Export auth object
window.auth = auth;