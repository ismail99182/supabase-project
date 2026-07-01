// Real Credentials Connected Safely
const SUPABASE_URL = "https://aezucynevfjlrknmqqlg.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlenVjeW5ldmZqbHJrbm1xcWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTMyMzAsImV4cCI6MjA5NjIyOTIzMH0.skfqRrv8ZSk9lDnykERDSIrjon6MQfwZEBNgqrDthUQ"; 

let _supabase = null;
try {
    if (window.supabase) {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client initialized!");
    }
} catch (e) {
    console.error("Supabase load error:", e);
}

// Campus Courses Key Mapping Data
const campusCourses = {
    "Karachi": ["Web & Mobile App Dev", "Graphic Design", "AI & Chatbot"],
    "Lahore": ["Python Programming", "Digital Marketing", "Cyber Security"],
    "Islamabad": ["Cloud Computing", "UI/UX Design", "Data Science"]
};

document.addEventListener('DOMContentLoaded', () => {
    const campusSelect = document.getElementById('campus');
    const courseSelect = document.getElementById('course');
    const admissionForm = document.getElementById('admission-form');

    // Dynamic Options Loader logic
    if (campusSelect && courseSelect) {
        campusSelect.addEventListener('change', (e) => {
            const selectedCampus = e.target.value;
            courseSelect.innerHTML = '<option value="" class="bg-slate-950 text-slate-400">Select Course</option>';
            
            if (selectedCampus && campusCourses[selectedCampus]) {
                campusCourses[selectedCampus].forEach(course => {
                    const op = document.createElement('option');
                    op.value = course;
                    op.className = "bg-slate-950";
                    op.textContent = course;
                    courseSelect.appendChild(op);
                });
            }
        });
    }

    // Secure Submit Data Handle 
    if (admissionForm) {
        admissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!_supabase) return;

            try {
                const name = document.getElementById('student-name').value;
                const fatherName = document.getElementById('father-name').value;
                const email = document.getElementById('student-email').value;
                const mobileNumber = document.getElementById('mobile-number').value;
                const campus = document.getElementById('campus').value; 
                const course = document.getElementById('course').value; 

                const { data, error } = await _supabase
                    .from('admisson data') 
                    .insert([{
                        name: name,
                        father_name: fatherName,
                        email: email,
                        mobile_number: mobileNumber,
                        campus: campus,   
                        course: course,   
                        gender: "Not Provided", // Safe Fallbacks
                        city: campus
                    }]);

                if (error) {
                    alert("Database Error: " + error.message);
                } else {
                    alert("Admission Form Submitted Successfully! 🎉");
                    admissionForm.reset();
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
});

// Premium Tab switching styles wrapper
function switchTab(tabName) {
    const regContent = document.getElementById('content-registration');
    const idContent = document.getElementById('content-idcard');
    const resContent = document.getElementById('content-result');

    if(regContent) regContent.classList.add('hidden');
    if(idContent) idContent.classList.add('hidden');
    if(resContent) resContent.classList.add('hidden');

    ['registration', 'idcard', 'result'].forEach(tab => {
        const btn = document.getElementById(`tab-${tab}`);
        if(btn) {
            btn.className = "flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-bold px-4 py-3 rounded-xl transition duration-200 hover:bg-slate-800/40 cursor-pointer w-full sm:flex-1 justify-center";
        }
    });

    const activeContent = document.getElementById(`content-${tabName}`);
    if(activeContent) activeContent.classList.remove('hidden');

    const activeBtn = document.getElementById(`tab-${tabName}`);
    if(activeBtn) {
        activeBtn.className = "flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30 cursor-pointer w-full sm:flex-1 justify-center";
    }
}

// Search ID card fetch logic
async function searchStudentIDCard() {
    const mobileInput = document.getElementById('search-mobile').value.trim();
    if (!mobileInput || !_supabase) return;

    try {
        const { data, error } = await _supabase.from('admisson data').select('*').eq('mobile_number', mobileInput);
        if (data && data.length > 0) {
            const s = data[0];
            document.getElementById('card-roll').innerText = `NX-2026-${s.id}`;
            document.getElementById('card-name').innerText = s.name || '---';
            document.getElementById('card-father').innerText = s.father_name || '---';
            document.getElementById('card-mobile').innerText = s.mobile_number || '---';
            document.getElementById('card-campus').innerText = s.campus || '---';
            document.getElementById('card-course').innerText = s.course || '---';

            document.getElementById('search-card-container').classList.add('hidden');
            document.getElementById('id-card-display-area').classList.remove('hidden');
        } else {
            alert("No enrollment record found!");
        }
    } catch (err) {
        console.error(err);
    }
}

function resetSearchArea() {
    document.getElementById('search-mobile').value = "";
    document.getElementById('id-card-display-area').classList.add('hidden');
    document.getElementById('search-card-container').classList.remove('hidden');
}

function printIDCard() {
    window.print();
}
