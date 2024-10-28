function getUsersFromStorage() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

function saveUsersToStorage(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

document.getElementById('register')?.addEventListener('click', (event) => {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const score = 500;

    const users = getUsersFromStorage();

    const userExists = users.some(user => user.email === email);
    if (userExists) {
        alert('User with this email already exists.');
        return;
    }

    const newUser = { fullname, email, password, score };
    users.push(newUser);
    saveUsersToStorage(users);

    alert('Registration successful! You can now log in.');
    window.location.href = 'login.html';
});

document.getElementById('login')?.addEventListener('click', (event) => {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value;
    const password = document.getElementById('password').value;

    const users = getUsersFromStorage();

    const validUser = users.find(user => user.fullname === fullname && user.password === password);
    
    if (validUser) {
        const userInd = users.indexOf(validUser);
        localStorage.setItem('userID', userInd)
        alert('Login successful!');
        setTimeout(() => {
            window.location.href = 'gamesMenu.html';
        } , 1000);
    } else {
        alert('Invalid credentials. Please try again.');
    }
});
