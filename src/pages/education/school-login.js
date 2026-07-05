// School Login — teacher & student entry point for classroom use.
// Roles are stored on users/{uid} in Firestore; students may attach a class
// code so teachers can group them. Reuses the shared Firebase auth module.
import { signIn, signUp, signInWithGoogle, logOut, onAuthStateChange } from '../../firebase/auth.js';
import { db } from '../../firebase/config.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function createSchoolLoginPage() {
  return `
    <div class="education-page school-login-page">
      <section class="education-hero">
        <div class="container">
          <div class="education-hero-content">
            <div class="education-hero-text">
              <h1>School Login</h1>
              <p class="education-tagline">One door for teachers and students</p>
              <p class="education-description">
                Sign in to reach your classroom tools: teachers get curriculum and
                resource downloads, students get their projects and assignments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="container school-login-body">
        <div id="sl-signed-out">
          <div class="sl-role-toggle" role="tablist" aria-label="I am a">
            <button id="sl-role-teacher" class="btn sl-role active" type="button">👩‍🏫 Teacher</button>
            <button id="sl-role-student" class="btn sl-role" type="button">🎒 Student</button>
          </div>

          <form id="sl-form" class="sl-form">
            <label>Email <input id="sl-email" type="email" autocomplete="email" required /></label>
            <label>Password <input id="sl-pass" type="password" autocomplete="current-password" minlength="6" required /></label>
            <label id="sl-class-wrap" hidden>Class code (from your teacher)
              <input id="sl-class" type="text" maxlength="12" placeholder="e.g. GARDEN7" />
            </label>
            <div class="sl-actions">
              <button class="btn btn-primary" id="sl-signin" type="submit">Sign In</button>
              <button class="btn btn-secondary" id="sl-register" type="button">Create Account</button>
            </div>
            <button class="btn btn-google" id="sl-google" type="button">Continue with Google</button>
            <p id="sl-msg" class="sl-msg" role="alert"></p>
          </form>
          <p class="sl-note">Students: use the account your teacher set up, or create one with
          your class code. Schools using managed Google accounts can use the Google button.</p>
        </div>

        <div id="sl-signed-in" hidden>
          <h2 id="sl-hello"></h2>
          <div class="sl-links" id="sl-links"></div>
          <button class="btn btn-secondary" id="sl-logout" type="button">Sign out</button>
        </div>
      </section>
    </div>
  `;
}

export function initializeSchoolLoginPage() {
  const $ = (id) => document.getElementById(id);
  if (!$("sl-form")) return;
  let role = 'teacher';

  const setRole = (r) => {
    role = r;
    $("sl-role-teacher").classList.toggle('active', r === 'teacher');
    $("sl-role-student").classList.toggle('active', r === 'student');
    $("sl-class-wrap").hidden = r !== 'student';
  };
  $("sl-role-teacher").addEventListener('click', () => setRole('teacher'));
  $("sl-role-student").addEventListener('click', () => setRole('student'));

  const msg = (t, ok) => { const m = $("sl-msg"); m.textContent = t; m.style.color = ok ? '#2e7d32' : '#c62828'; };

  const saveProfile = async (user, extra = {}) => {
    const ref = doc(db, 'users', user.uid);
    const cur = await getDoc(ref).catch(() => null);
    const existing = cur && cur.exists() ? cur.data() : {};
    await setDoc(ref, {
      email: user.email || '',
      displayName: user.displayName || existing.displayName || '',
      role: existing.role || role,                    // first login decides; never silently upgrade
      classCode: extra.classCode ?? existing.classCode ?? '',
      updatedAt: Date.now(),
    }, { merge: true });
    return existing.role || role;
  };

  const showSignedIn = async (user) => {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref).catch(() => null);
    const r = (snap && snap.exists() && snap.data().role) || role;
    $("sl-signed-out").hidden = true;
    $("sl-signed-in").hidden = false;
    $("sl-hello").textContent = `Welcome, ${user.displayName || user.email} (${r})`;
    $("sl-links").innerHTML = r === 'teacher'
      ? `<a class="btn btn-primary" href="#education/resources">Teacher Resources</a>
         <a class="btn btn-secondary" href="#education/curriculum">Curriculum</a>
         <a class="btn btn-secondary" href="#education/programs">Programs</a>`
      : `<a class="btn btn-primary" href="#education/projects">My Projects</a>
         <a class="btn btn-secondary" href="#education/curriculum">Lessons</a>`;
  };

  const finish = async (user, extra) => {
    await saveProfile(user, extra);
    await showSignedIn(user);
  };

  $("sl-form").addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await signIn($("sl-email").value.trim(), $("sl-pass").value);
    if (r.success) await finish(r.user, { classCode: $("sl-class").value.trim().toUpperCase() });
    else msg(friendly(r.error), false);
  });
  $("sl-register").addEventListener('click', async () => {
    if (role === 'student' && !$("sl-class").value.trim()) { msg('Ask your teacher for the class code first.', false); return; }
    const r = await signUp($("sl-email").value.trim(), $("sl-pass").value);
    if (r.success) { await finish(r.user, { classCode: $("sl-class").value.trim().toUpperCase() }); msg('Account created!', true); }
    else msg(friendly(r.error), false);
  });
  $("sl-google").addEventListener('click', async () => {
    const r = await signInWithGoogle();
    if (r.success) await finish(r.user, { classCode: $("sl-class").value.trim().toUpperCase() });
    else msg(friendly(r.error), false);
  });
  $("sl-logout").addEventListener('click', async () => {
    await logOut();
    $("sl-signed-in").hidden = true;
    $("sl-signed-out").hidden = false;
  });

  // already signed in? skip the form
  onAuthStateChange((user) => { if (user) showSignedIn(user); });

  function friendly(err) {
    const c = String(err || '');
    if (c.includes('invalid-credential') || c.includes('wrong-password')) return 'Email or password is incorrect.';
    if (c.includes('user-not-found')) return 'No account with that email — use Create Account.';
    if (c.includes('email-already-in-use')) return 'That email already has an account — use Sign In.';
    if (c.includes('weak-password')) return 'Password needs at least 6 characters.';
    if (c.includes('popup')) return 'Google sign-in was closed before finishing.';
    return 'Sign-in failed. Check your connection and try again.';
  }
}
