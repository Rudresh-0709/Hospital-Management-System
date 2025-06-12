
    const session_id="user123"
    async function askAI() {
      const question = document.getElementById("question").value;

      const res = await fetch('http://localhost:8000/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          question:question,
          session_id: session_id
        })
      });
      console.log(data.answer)
      const data = await res.json();
      // document.getElementById("response").innerText = data.answer;
      document.getElementById("response").innerText = 
  typeof data.answer === "string" ? data.answer : JSON.stringify(data.answer, null, 2);
    }
    const newchat=document.getElementsByClassName("newchat");
    newchat.addEventListener("click",()=>{
      
    })
    // Fix: Use the correct textarea id
    const textarea = document.getElementById('question');

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = textarea.scrollHeight + 'px'; // Set to scroll height
    });
    function toggleDropdown() {
      document.getElementById("dropdownContent").classList.toggle("show");
    }

    // Optional: Close dropdown when clicking outside
    window.onclick = function(e) {
      const dropdownBtn = document.querySelector('.dropdown-btn');
      const dropdownContent = document.getElementById('dropdownContent');
      if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
        dropdownContent.classList.remove('show');
      }
    };