
// // --- 1. Supabase Connection Configuration ---
const supabaseUrl = 'https://aezucynevfjlrknmqqlg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlenVjeW5ldmZqbHJrbm1xcWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTMyMzAsImV4cCI6MjA5NjIyOTIzMH0.skfqRrv8ZSk9lDnykERDSIrjon6MQfwZEBNgqrDthUQ';

// Browser standard client setup
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// // --- 2. OAuth Social Logins (Google, GitHub, Facebook) ---
async function loginWithProvider(provider) {
    let redirectUrl = window.location.origin + '/dashbord.html';

    // Agar site GitHub Pages par chal rahi hai, toh repo ka naam automatic add ho jaye
    if (window.location.hostname.includes('github.io')) {
        redirectUrl = window.location.origin + '/supabase-project/dashbord.html';
    }

    const { error } = await _supabase.auth.signInWithOAuth({ 
        provider: provider, 
        options: { 
            redirectTo: redirectUrl
        }
    });

    if (error) {
        alert(provider + " Auth Error: " + error.message);
    }
}
// --- 3. Sign Up Handling (index.html / Create Account) ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameField = document.getElementById('signup-name');
        const emailField = document.getElementById('signup-email');
        const passwordField = document.getElementById('signup-password');

        const fullName = nameField ? nameField.value : "";
        const email = emailField.value;
        const password = passwordField.value;

        const { data, error } = await _supabase.auth.signUp({ 
            email: email, 
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) {
            alert("Signup Issue: " + error.message);
        } else {
            await _supabase.auth.signOut(); 
            
            alert("Account successfully created! Please check your email for confirmation link.");
            window.location.href = 'index.html'; 
        }
    });
}

// --- 4. Login Handling (index.html) ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await _supabase.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });

        if (error) {
            alert("Login Failed: " + error.message);
        } else {
            window.location.href = 'dashbord.html';
        }
    });
}

// --- 5. Logout Handling (dashbord.html) ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const { error } = await _supabase.auth.signOut();
        if (error) {
            alert("Logout Error: " + error.message);
        } else {
            alert("Logged out successfully!");
            window.location.href = 'index.html';
        }
    });
}

async function protectDashboard() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('reset.html')) {
        console.log("On reset page, bypassing protection guard completely.");
        return; 
    }

    if (currentPath.includes('dashbord.html')) {
        const { data, error } = await _supabase.auth.getSession();

        if (!data.session || error) {
            alert("Please login first to access the dashboard!");
            window.location.href = 'index.html';
        } else {
            const user = data.session.user;
            
            const profileNameInput = document.getElementById('profile-name');
            const profileEmailInput = document.getElementById('profile-email');

            if (profileNameInput) {
                profileNameInput.value = user.user_metadata?.full_name || "";
            }
            if (profileEmailInput) {
                profileEmailInput.value = user.email || "";
            }
            
            const userNameHeader = document.getElementById('user-name');
            const userEmailHeader = document.getElementById('user-email');
            if (userNameHeader) userNameHeader.innerText = user.user_metadata?.full_name || "User";
            if (userEmailHeader) userEmailHeader.innerText = user.email || "";
        }
    } 
    else if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
        const { data } = await _supabase.auth.getSession();
        if (data?.session) {
            window.location.href = 'dashbord.html';
        }
    }
}

protectDashboard();

let resetpassbtn = document.getElementById('resetpass-btn');

if (resetpassbtn) {
  resetpassbtn.addEventListener('click', async () => {

    let forgetpasinput =
      document.getElementById('forgetpass-input').value;

    if (!forgetpasinput) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please enter your email"
      });
      return;
    }

    const { data, error } =
      await _supabase.auth.resetPasswordForEmail(
        forgetpasinput,
        {
          redirectTo: 'http://127.0.0.1:5500/reset.html'
        }
      );

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Sent!",
      text: "Reset link sent to your email"
    });

    document.getElementById('forgetpass-input').value = "";
  });
}

// ==========================================
// FILE UPLOAD ATTACHMENT SETUP
// ==========================================
let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const customFileBtn = document.getElementById('custom-file-btn');
    const fileNamePreview = document.getElementById('file-name-preview');

    if (customFileBtn && fileInput) {
        customFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput && fileNamePreview) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                fileNamePreview.textContent = selectedFile.name;
                fileNamePreview.style.color = '#34d399'; 
            }
        });
    }
    
    // Form submission binding
    const publishBtn = document.getElementById("publish-btn");
    if (publishBtn) {
        publishBtn.addEventListener("click", addPost);
    }
});

// ========================================================
// SMART POST SYSTEM (TEXT + OPTIONAL FILE)
// ========================================================

async function addPost() {
    const titleInput = document.getElementById("title") || document.getElementById("post-title");
    const contentInput = document.getElementById("content") || document.getElementById("post-content");
    const fileInput = document.getElementById("fileInput") || document.getElementById("file-input");
    const fileNamePreview = document.getElementById('file-name-preview') || document.getElementById('file-text');

    const title = titleInput ? titleInput.value.trim() : "";
    const content = contentInput ? contentInput.value.trim() : "";
    
    if (!title && !content && (!fileInput || fileInput.files.length === 0)) {
        alert("Please add some text or select a file to publish!");
        return;
    }

    let publicUrl = null; 

    // FILE UPLOAD LOGIC
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `post-images/${fileName}`;

        console.log("Uploading file to storage...");
        const { data: storageData, error: storageError } = await _supabase.storage
            .from('post-files')
            .upload(filePath, file);

        if (storageError) {
            alert("Storage Upload Error: " + storageError.message);
            return;
        }

        const { data: urlData } = _supabase.storage
            .from('post-files')
            .getPublicUrl(filePath);
            
        publicUrl = urlData.publicUrl;
        console.log("File uploaded successfully. URL:", publicUrl);
    }

    // USER SESSION FETCHING
    const { data: { session } } = await _supabase.auth.getSession();
    const currentUserName = session?.user?.user_metadata?.full_name || "Anonymous User";

    console.log("Inserting post into database...");
    
    // DATABASE INSERTS
    const { error: dbError } = await _supabase
        .from("posts")
        .insert([
            {
                title: title || "Untitled Post", 
                content: content || "",
                user_name: currentUserName,
                file_url: publicUrl 
            }
        ]);

    if (dbError) {
        alert("Database Error: " + dbError.message);
        return;
    }

    alert("Post published successfully! 🎉");

    if (titleInput) titleInput.value = "";
    if (contentInput) contentInput.value = "";
    if (fileInput) fileInput.value = ""; 
    if (fileNamePreview) fileNamePreview.textContent = "No file chosen";

    loadPosts();
}

async function loadPosts() {
const urlParams = new URLSearchParams(window.location.search);
const singlePostId = urlParams.get('post');

if (singlePostId) {
    // Agar URL mein post ID hai, to Supabase se sirf wahi ek post fetch karein:
    // .from("posts").select("*").eq("id", singlePostId)
} else {
    // Warna normal saari posts fetch karein jaise pehle ho rahi hain
}
    const postsContainer = document.getElementById("posts");
    if (!postsContainer) return;
    

    const { data: { session } } = await _supabase.auth.getSession();
    const loggedInUserName = session?.user?.user_metadata?.full_name || "Nexus User";

    const { data, error } = await _supabase
        .from("posts")
        .select("*")
        .order("id", { ascending: false }); 

    if (error) {
        console.log("Error loading posts:", error);
        return;
    }

    postsContainer.innerHTML = "";
    postsContainer.className = "flex flex-col gap-6 mt-8 max-w-3xl mx-auto w-full";

    if (!data || data.length === 0) {
        postsContainer.innerHTML = `<p class="text-slate-500 text-center text-sm py-8">No posts available yet.</p>`;
        return;
    }

    data.forEach((post) => {
        const postDate = post.created_at 
            ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : "Just now";

        const authorName = post.user_name || loggedInUserName;
        const initials = authorName.charAt(0).toUpperCase();
        
        const initialLikes = Math.floor(Math.random() * 5);
        const initialComments = Math.floor(Math.random() * 3);

        let imageHTML = "";
        if (post.file_url) {
            imageHTML = `
                <div class="mt-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                    <img src="${post.file_url}" alt="Post Image" class="w-full h-auto max-h-[450px] object-contain block mx-auto" onerror="this.style.display='none';" />
                </div>
            `;
        }

        postsContainer.innerHTML += `
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:border-slate-700/50 transition-all duration-300">
            
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/10">
                        ${initials}
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-200 text-sm tracking-tight">${authorName}</h4>
                        <p class="text-[11px] text-slate-500 font-medium">${postDate}</p>
                    </div>
                </div>
                
                <button class="text-slate-600 hover:text-slate-400 transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                </button>
            </div>

            <div class="space-y-2 mb-4">
                <h3 class="text-lg font-bold text-indigo-400 tracking-tight">${post.title}</h3>
                <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">${post.content}</p>
                ${imageHTML}
            </div>

            <div class="border-t border-slate-800/60 my-3"></div>

            <div class="flex items-center justify-between px-2 pt-1 text-slate-400 text-xs font-semibold">
                <button onclick="toggleLike(this)" data-likes="${initialLikes}" class="flex items-center gap-2 hover:text-rose-400 transition cursor-pointer py-1 px-3 rounded-lg hover:bg-rose-500/5 group active:scale-95 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 group-hover:scale-110 transition heart-icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    <span class="like-count">${initialLikes} Likes</span>
                </button>

                <button onclick="addCommentPrompt(this)" data-comments="${initialComments}" class="flex items-center gap-2 hover:text-indigo-400 transition cursor-pointer py-1 px-3 rounded-lg hover:bg-indigo-500/5 group active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 group-hover:scale-110 transition">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48L4.5 21l3.75-1.5c1.1.34 2.275.5 3.75.5Z" />
                    </svg>
                    <span class="comment-count">${initialComments} Comments</span>
                </button>

                <button onclick="sharePostLink('${post.id}')" class="flex items-center gap-2 hover:text-emerald-400 transition cursor-pointer py-1 px-3 rounded-lg hover:bg-emerald-500/5 group active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 group-hover:scale-110 transition">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    <span>Share</span>
                </button>
            </div>

        </div>
        `;
    });
}

if (window.location.pathname.includes("dashbord.html")) {
    loadPosts();
}

// ==========================================
// POST INTERACTION SYSTEM (GLOBAL BINDINGS FIXED)
// ==========================================

window.toggleLike = function(button) {
    const heartIcon = button.querySelector('.heart-icon');
    const likeCountSpan = button.querySelector('.like-count');
    let currentLikes = parseInt(button.getAttribute('data-likes')) || 0;

    if (button.classList.contains('text-rose-500')) {
        button.classList.remove('text-rose-500');
        button.classList.add('text-slate-400');
        if (heartIcon) heartIcon.setAttribute('fill', 'none'); 
        currentLikes--;
    } else {
        button.classList.remove('text-slate-400');
        button.classList.add('text-rose-500');
        if (heartIcon) heartIcon.setAttribute('fill', 'currentColor'); 
        currentLikes++;
    }

    button.setAttribute('data-likes', currentLikes);
    if (likeCountSpan) likeCountSpan.innerText = `${currentLikes} Likes`;
};

window.addCommentPrompt = function(button) {
    const commentCountSpan = button.querySelector('.comment-count');
    let currentComments = parseInt(button.getAttribute('data-comments')) || 0;
    
    const userComment = prompt("Write your comment:");
    
    if (userComment && userComment.trim() !== "") {
        currentComments++;
        button.setAttribute('data-comments', currentComments);
        if (commentCountSpan) commentCountSpan.innerText = `${currentComments} Comments`;
        alert("Comment added successfully! (Local Feed)");
    }
};
window.sharePostLink = function(postId) {
    if (!postId) {
        alert("Post ID not found!");
        return;
    }

    // Yeh aapki current website ka domain aur path le aayega (e.g., http://127.0.0.1:5500/dashbord.html)
    const baseUrl = window.location.origin + window.location.pathname;
    
    // Dynamic URL banayein specific post param ke sath
    const postUrl = `${baseUrl}?post=${postId}`;

    // Navigator API ka use karke clipboard par real copy karein
    navigator.clipboard.writeText(postUrl)
        .then(() => {
            alert("Specific post link copied to clipboard! 🚀");
        })
        .catch(err => {
            console.error("Could not copy text: ", err);
            alert("Error copying link. Please copy manually.");
        });
};

// ========================================================
// PROFILE DROPDOWN & PANEL TOGGLE SYSTEM
// ========================================================
const profileMenuBtn = document.getElementById('profile-menu-btn');
const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
const dropdownEditBtn = document.getElementById('dropdown-edit-btn');
const profileSection = document.getElementById('profile-section');

if (profileMenuBtn && profileDropdownMenu) {
    profileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        profileDropdownMenu.classList.add('hidden');
    });

    if (dropdownEditBtn && profileSection) {
        dropdownEditBtn.addEventListener('click', () => {
            profileSection.classList.toggle('hidden');
            if (!profileSection.classList.contains('hidden')) {
                profileSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

const updateProfileForm = document.getElementById('update-profile-form');
if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newName = document.getElementById('profile-name').value;
        const newEmail = document.getElementById('profile-email').value;
        const newPassword = document.getElementById('profile-password').value;
        const updateMessage = document.getElementById('update-message');

        if (!updateMessage) return;

        updateMessage.style.color = "#6366f1"; 
        updateMessage.innerText = "Saving changes to Supabase...";

        let updateData = {
            data: { full_name: newName } 
        };

        if (newPassword && newPassword.trim() !== "") {
            updateData.password = newPassword;
        }

        if (newEmail && newEmail.trim() !== "") {
            updateData.email = newEmail;
        }

        const { data, error } = await _supabase.auth.updateUser(updateData);

        if (error) {
            updateMessage.style.color = "#f87171"; 
            updateMessage.innerText = "Update Failed: " + error.message;
        } else {
            updateMessage.style.color = "#34d399"; 
            
            if (newEmail && data.user.new_email) {
                updateMessage.innerText = "Name updated! Check your new email inbox to confirm the change.";
            } else {
                updateMessage.innerText = "Profile successfully updated! 🔥";
            }

            const userNameHeader = document.getElementById('user-name');
            if (userNameHeader) {
                userNameHeader.innerText = newName;
            }

            document.getElementById('profile-password').value = "";
        }
    });
}
