document.getElementById('showRegister').addEventListener('click', function() {
    document.getElementById('loginForm').parentElement.classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', function() {
    document.getElementById('registerContainer').classList.add('hidden');
    document.getElementById('loginForm').parentElement.classList.remove('hidden');
});