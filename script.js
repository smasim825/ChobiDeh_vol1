// ==========================================================================
// ChobiDeh — PC Smooth Sliding Panel Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const authContainer = document.getElementById('authContainer');
  const btnToSignup = document.getElementById('btnToSignup');
  const btnToLogin = document.getElementById('btnToLogin');
  
  const toggleLoginPwd = document.getElementById('toggleLoginPwd');
  const loginPassword = document.getElementById('loginPassword');
  
  const toggleSignupPwd = document.getElementById('toggleSignupPwd');
  const signupPassword = document.getElementById('signupPassword');
  
  const featureToast = document.getElementById('featureToast');
  const pillCards = document.querySelectorAll('.pill-card');

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Switch to Sign Up (Symmetrical GPU slide & synchronized cross-fade)
  btnToSignup.addEventListener('click', () => {
    authContainer.classList.add('is-signup');
  });

  // Switch to Log In
  btnToLogin.addEventListener('click', () => {
    authContainer.classList.remove('is-signup');
  });

  // Password visibility toggles
  toggleLoginPwd.addEventListener('click', () => {
    const isPwd = loginPassword.type === 'password';
    loginPassword.type = isPwd ? 'text' : 'password';
    toggleLoginPwd.querySelector('.material-symbols-outlined').textContent = isPwd ? 'visibility_off' : 'visibility';
  });

  toggleSignupPwd.addEventListener('click', () => {
    const isPwd = signupPassword.type === 'password';
    signupPassword.type = isPwd ? 'text' : 'password';
    toggleSignupPwd.querySelector('.material-symbols-outlined').textContent = isPwd ? 'visibility_off' : 'visibility';
  });

  // Feature pill tips
  pillCards.forEach((pill) => {
    pill.addEventListener('click', () => {
      const tip = pill.getAttribute('data-tip');
      if (!tip) return;
      featureToast.textContent = `✦ ${tip}`;
      featureToast.style.display = 'block';
      setTimeout(() => {
        featureToast.style.display = 'none';
      }, 3000);
    });
  });

  // Form Submissions (Demo feedback)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Logged in successfully! (Demo mode)');
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Account created successfully! (Demo mode)');
  });
});

