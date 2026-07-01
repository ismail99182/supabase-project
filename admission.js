// ==========================================
// DETECTIVE & BULLETPROOF ADMISSION LOGIC
// ==========================================

const SUPABASE_URL = "https://aezucynevfjlrknmqqlg.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlenVjeW5ldmZqbHJrbm1xcWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTMyMzAsImV4cCI6MjA5NjIyOTIzMH0.skfqRrv8ZSk9lDnykERDSIrjon6MQfwZEBNgqrDthUQ"; 

let _supabase = null;

try {
    // Safely check and initialize Supabase
    if (window.supabase) {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client initialized successfully with real credentials!");
    } else {
        console.error("Supabase SDK library not loaded on window object.");
    }
} catch (initError) {
    console.error("Supabase Initialization Failed:", initError);
}

// ==========================================
// DYNAMIC CAMPUS COURSES MAPPING LOGIC
// ==========================================
const campusCourses = {
    "Karachi": ["Web & Mobile App Dev", "Graphic Design", "AI & Chatbot"],
    "Lahore": ["Python Programming", "Digital Marketing", "Cyber Security"],
    "Islamabad": ["Cloud Computing", "UI/UX Design", "Data Science"],
    "Quetta": ["Basic IT Course", "Web Development"],
    "Peshawar": ["Graphic Design", "Mobile App Development"]
};

// DOM content load hone par dynamic changes listen karna
document.addEventListener('DOMContentLoaded', () => {
    const campusSelect = document.getElementById('campus');
    const courseSelect = document.getElementById('course');
    const admissionForm = document.getElementById('admission-form');

    // Campus Change hone par automatically courses dropdown populating logic
    if (campusSelect && courseSelect) {
        campusSelect.addEventListener('change', (e) => {
            const selectedCampus = e.target.value;
            
            // Clear previous options except placeholder
            courseSelect.innerHTML = '<option value="" class="bg-slate-950 text-slate-400">Select Course</option>';
            
            if (selectedCampus && campusCourses[selectedCampus]) {
                campusCourses[selectedCampus].forEach(course => {
                    const option = document.createElement('option');
                    option.value = course;
                    option.className = "bg-slate-950";
                    option.textContent = course;
                    courseSelect.appendChild(option);
                });
                console.log(`Courses loaded for ${selectedCampus}`);
            }
        });
    }

    // ==========================================
    // FORM SUBMISSION EVENT WITH LIVE FEEDBACK
    // ==========================================
    if (admissionForm) {
        console.log("Admission Form event listener successfully attached!");

        admissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!_supabase) {
                alert("Error: Supabase properly configured nahi hai. Database down or blocked.");
                return;
            }

            try {
                // Safely reading input values
                const name = document.getElementById('student-name').value;
                const fatherName = document.getElementById('father-name').value;
                const email = document.getElementById('student-email').value;
                const mobileNumber = document.getElementById('mobile-number').value;
                const campus = document.getElementById('campus').value; 
                const course = document.getElementById('course').value; 

                // Un-implemented dropdown variables safely handled with fallbacks to avoid JS crash
                const gender = document.getElementById('gender') ? document.getElementById('gender').value : "Not Provided";
                const city = document.getElementById('city') ? document.getElementById('city').value : campus; // fallback to campus city

                console.log("Submitting to Supabase:", { name, fatherName, email, mobileNumber, campus, course, gender, city });

                const { data, error } = await _supabase
                    .from('admisson data') 
                    .insert([
                        {
                            name: name,
                            father_name: fatherName,
                            email: email,
                            mobile_number: mobileNumber,
                            campus: campus,   
                            course: course,   
                            gender: gender,
                            city: city
                        }
                    ])
                    .select();

                if (error) {
                    console.error("Database Response Error:", error);
                    alert("Database Error:\n" + error.message);
                } else {
                    console.log("Success data saved:", data);
                    alert("Admission Form Submitted Successfully! 🎉");
                    admissionForm.reset();
                    if (courseSelect) {
                        courseSelect.innerHTML = '<option value="" class="bg-slate-950 text-slate-400">Select Course</option>';
                    }
                }

            } catch (jsError) {
                console.error("Critical Runtime Crash Inside Submit:", jsError);
                alert("Runtime Code Error:\n" + jsError.message);
            }
        });
    }
});

// ==========================================
// TABS SWITCHING LOGIC (SMIT STYLE)
// ==========================================
function switchTab(tabName) {
    const regContent = document.getElementById('content-registration');
    const idContent = document.getElementById('content-idcard');
    const resContent = document.getElementById('content-result');

    if(regContent) regContent.classList.add('hidden');
    if(idContent) idContent.classList.add('hidden');
    if(resContent) resContent.classList.add('hidden');

    const tabs = ['registration', 'idcard', 'result'];
    tabs.forEach(tab => {
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

// ==========================================
// SEARCH & GENERATE ID CARD LOGIC FROM DB
// ==========================================
async function searchStudentIDCard() {
    const mobileField = document.getElementById('search-mobile');
    if (!mobileField) return;
    
    const mobileInput = mobileField.value.trim();

    if (!mobileInput) {
        alert("Please enter a mobile number first!");
        return;
    }

    if (!_supabase) {
        alert("Supabase integration issues!");
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('admisson data')
            .select('*')
            .eq('mobile_number', mobileInput); 

        if (error) {
            console.error("Fetch Error:", error);
            alert("Database error: " + error.message);
            return;
        }

        if (data && data.length > 0) {
            const student = data[0];
            const mockRoll = `NX-2026-${1000 + (student.id % 9000 || Math.floor(Math.random() * 8000))}`;

            // Safety assignment to fields avoiding error if missing on elements
            const setElementText = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.innerText = val || '---';
            };

            setElementText('card-roll', mockRoll);
            setElementText('card-name', student.name);
            setElementText('card-father', student.father_name);
            setElementText('card-mobile', student.mobile_number);
            setElementText('card-city', student.city);
            setElementText('card-campus', student.campus);
            setElementText('card-course', student.course);
