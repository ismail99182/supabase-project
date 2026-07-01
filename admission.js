// ==========================================
// DETECTIVE & BULLETPROOF ADMISSION LOGIC
// ==========================================

// Aapki Real Supabase Credentials yahan configure ho gayi hain
const SUPABASE_URL = "https://aezucynevfjlrknmqqlg.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlenVjeW5ldmZqbHJrbm1xcWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTMyMzAsImV4cCI6MjA5NjIyOTIzMH0.skfqRrv8ZSk9lDnykERDSIrjon6MQfwZEBNgqrDthUQ"; 

let _supabase = null;

try {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Client initialized successfully with real credentials!");
} catch (initError) {
    console.error("Supabase Initialization Failed:", initError);
    alert("Supabase Configuration Error:\n" + initError.message);
}

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
            btn.className = "flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold px-5 py-3 rounded-xl transition duration-300 hover:bg-slate-800/40 cursor-pointer flex-1 justify-center min-w-[150px]";
        }
    });

    const activeContent = document.getElementById(`content-${tabName}`);
    if(activeContent) activeContent.classList.remove('hidden');

    const activeBtn = document.getElementById(`tab-${tabName}`);
    if(activeBtn) {
        activeBtn.className = "flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-3 rounded-xl transition duration-300 shadow-lg shadow-indigo-600/20 cursor-pointer flex-1 justify-center min-w-[150px]";
    }
}

// ==========================================
// FORM SUBMISSION EVENT WITH LIVE FEEDBACK
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const admissionForm = document.getElementById('admission-form');

    if (admissionForm) {
        console.log("Admission Form event listener successfully attached!");

        admissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Live status text alert
            alert("Form submit ho raha hai! Supabase se connect karne ki koshish jaari hai...");

            if (!_supabase) {
                alert("Error: Supabase properly configured nahi hai. Request blocked.");
                return;
            }

            try {
                // Form Fields se data get kar rahe hain
                const name = document.getElementById('student-name').value;
                const fatherName = document.getElementById('father-name').value;
                const email = document.getElementById('student-email').value;
                const mobileNumber = document.getElementById('mobile-number').value;
                const campus = document.getElementById('campus').value; // NEW
                const course = document.getElementById('course').value; // NEW
                const gender = document.getElementById('gender').value;
                const city = document.getElementById('city').value;

                console.log("Submitting to Supabase:", { name, fatherName, email, mobileNumber, campus, course, gender, city });

                // Supabase Data Insertion Request
                // Note: Aapke table ka naam exact 'admisson data' (single 's') hai schema ke mutabiq
                const { data, error } = await _supabase
                    .from('admisson data') 
                    .insert([
                        {
                            name: name,
                            father_name: fatherName,
                            email: email,
                            mobile_number: mobileNumber,
                            campus: campus,   // NEW COLUMN IN DB
                            course: course,   // NEW COLUMN IN DB
                            gender: gender,
                            city: city
                        }
                    ])
                    .select();

                // Validation and Response
                if (error) {
                    console.error("Database Response Error:", error);
                    alert("Database Error Received:\n" + error.message + "\nDetails: " + (error.details || 'None'));
                } else {
                    console.log("Success data saved:", data);
                    alert("Admission Form Submitted Successfully! 🎉 Data Supabase mein save ho chuka hai.");
                    admissionForm.reset();
                }

            } catch (jsError) {
                console.error("Critical Runtime Crash:", jsError);
                alert("Runtime Code Crash Alert:\n" + jsError.message);
            }
        });
    } else {
        console.error("Fatal Error: HTML mein 'admission-form' ID nahi mili!");
        alert("Fatal Error: Form ID 'admission-form' not found in HTML!");
    }
});

// ==========================================
// SEARCH & GENERATE ID CARD LOGIC FROM DB
// ==========================================
async function searchStudentIDCard() {
    const mobileInput = document.getElementById('search-mobile').value.trim();

    if (!mobileInput) {
        alert("Please enter a mobile number first!");
        return;
    }

    if (!_supabase) {
        alert("Supabase is not initialized properly!");
        return;
    }

    try {
        // Supabase se input mobile number ke against data fetch karna
        const { data, error } = await _supabase
            .from('admisson data')
            .select('*')
            .eq('mobile_number', mobileInput); // Mobile number column match sequence

        if (error) {
            console.error("Fetch Error:", error);
            alert("Database error while fetching: " + error.message);
            return;
        }

        // Agar user ka record table mein mil jata hai
        if (data && data.length > 0) {
            const student = data[0];
            
            // Dynamic Roll number matching index create karna base on table id or randomizer
            const mockRoll = `NX-2026-${1000 + (student.id % 9000 || Math.floor(Math.random() * 8000))}`;

            // Fields update karna
            document.getElementById('card-roll').innerText = mockRoll;
            document.getElementById('card-name').innerText = student.name || '---';
            document.getElementById('card-father').innerText = student.father_name || '---';
            document.getElementById('card-mobile').innerText = student.mobile_number || '---';
            document.getElementById('card-city').innerText = student.city || '---';

            // UI view toggling: Search hiding and Card showing
            document.getElementById('search-card-container').classList.add('hidden');
            document.getElementById('id-card-display-area').classList.remove('hidden');
        } else {
            alert("No enrollment record found for this mobile number! Please make sure you registered correctly.");
        }

    } catch (err) {
        console.error("Runtime Search Error:", err);
        alert("Search broke down unexpectedly: " + err.message);
    }
}

// Reset view to search again
function resetSearchArea() {
    document.getElementById('search-mobile').value = "";
    document.getElementById('id-card-display-area').classList.add('hidden');
    document.getElementById('search-card-container').classList.remove('hidden');
}

// =======================================================
// 100% FIXED NO-CUTTING NATIVE PRINT/SAVE SYSTEM
// =======================================================
function printIDCard() {
    const cardElement = document.getElementById('student-id-card');
    if (!cardElement) {
        alert("ID Card screen par nahi mila!");
        return;
    }

    // Purane kisi bhi dynamic styles ko pehle remove karna safety ke liye
    const oldStyle = document.getElementById('dynamic-print-css');
    if (oldStyle) oldStyle.remove();

    // Naya structural sheet optimization rule create karna
    const printStyle = document.createElement('style');
    printStyle.id = 'dynamic-print-css';
    printStyle.innerHTML = `
        @media print {
            /* Page margins aur content cut-off ko default standard par zero karna */
            @page {
                size: auto;
                margin: 0mm;
            }
            
            /* Poori screen ke content ko rigid format se clean hide karna */
            body * {
                visibility: hidden !important;
            }
            
            /* Print context ko layout container system banana */
            html, body {
                visibility: hidden !important;
                background-color: #030712 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                width: 100% !important;
                height: 100vh !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
            }
            
            /* Target card aur uske internal elements ko enforce visualization dena */
            #student-id-card, #student-id-card * {
                visibility: visible !important;
            }
            
            /* Card scaling and exact center orientation bypass logic */
            #student-id-card {
                position: relative !important;
                display: block !important;
                margin: auto !important;
                max-width: 310px !important; /* Margin safe lock */
                border: none !important;
                box-shadow: none !important;
                transform: scale(1.0) !important; /* Kisi bhi zoom distortion ko zero karne ke liye */
                left: 0 !important;
                top: 0 !important;
            }
        }
    `;

    // Rules inject karna
    document.head.appendChild(printStyle);
    
    // 150ms ka browser transition safe-buffer gap
    setTimeout(() => {
        window.print();
        
        // Output phase complete hone par runtime logic restore karna
        const injectedStyle = document.getElementById('dynamic-print-css');
        if (injectedStyle) {
            injectedStyle.remove();
        }
    }, 150);
}
