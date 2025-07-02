const textarea = document.getElementById("question");
newchatbutton = document.getElementById("newchatbutton");
const initialDataStore =document.getElementById("initial-data-store");
let activeSessionId=null;
const chatmessagesdiv= document.getElementById("chatMessages");
const sessionullist = document.getElementById("chatList");


async function sendQuestion(event) {
  if(!activeSessionId){
    alert("No active session found")
    return;
  }
  event.preventDefault();
  const question=textarea.value.trim();

  const selectedTables = [];
  const checkboxes = document.querySelectorAll("input[type='checkbox']:checked");
  checkboxes.forEach((checkbox) => {
    if (checkbox.value === "patients") {
      // Add both 'patients' and 'admit' if not already present
      if (!selectedTables.includes("patients")) selectedTables.push("patients");
      if (!selectedTables.includes("admit")) selectedTables.push("admit");
    } else {
      if (!selectedTables.includes(checkbox.value)) selectedTables.push(checkbox.value);
    }
  });
  chatmessagesdiv.innerHTML += `<div class ="chat-message user">${question}</div>`;
  textarea.value='';
  textarea.style.height = "auto";
  chatmessagesdiv.scrollTop=chatmessagesdiv.scrollHeight;
  

  const res = await fetch("http://localhost:8000/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },  
    body: JSON.stringify({
      question: question,
      session_id: activeSessionId,
      selected_tables: selectedTables
    }),
  });
  const data = await res.json();
  console.log(data.answer);
  
  chatmessagesdiv.innerHTML += `<div class ="chat-message ai">${data.answer}</div>`
  chatmessagesdiv.scrollTop = chatmessagesdiv.scrollHeight;
}

// Fix: Use the correct textarea id

textarea.addEventListener("input", () => {
  textarea.style.height = "auto"; // Reset height
  textarea.style.height = textarea.scrollHeight + "px"; // Set to scroll height
});
function toggleDropdown() {
  document.getElementById("dropdownContent").classList.toggle("show");
}

// Optional: Close dropdown when clicking outside
window.onclick = function (e) {
  const dropdownBtn = document.querySelector(".dropdown-btn");
  const dropdownContent = document.getElementById("dropdownContent");
  if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
    dropdownContent.classList.remove("show");
  }
};
async function loadChat(sessionId){
  // if(activeSessionId === sessionId) return;
  activeSessionId = sessionId;
  try{
    const res = await fetch(`/admin/ai/chat/${sessionId}`)
    if(!res.ok){
      const errordata = await res.json();
      throw new Error(errordata.error);
    }
    const data = await res.json();
    renderChat(data);

  }
  catch(err){
    console.error("error loading chat, err");
  }
}
newchatbutton.addEventListener("click", async () => {
  try {
    const res = await fetch("/admin/ai/newchat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const errordata = await res.json();
      throw new Error(errordata.error);
    }
    const data = await res.json();
    const newchatli = document.createElement("li");
    newchatli.className = "newchatli";
    newchatli.dataset.sessionId = data.session_uuid; // Store session ID
    const sessionullist = document.getElementById("chatList");
    newchatli.innerHTML = `
      <span class="chat-name">${data.name || 'Chat'}</span>
      <div class="menu-wrapper" style="position: relative;">
        <i class="ri-more-2-line"></i>
        <div class="dropdown-menu" style="display: none;">
          <button>Rename</button>
          <button>Delete</button>
        </div>
      </div>
    `;
    sessionullist.prepend(newchatli);
  } catch (err) {
    console.error("Error creating new chat", err);
  }
});
if(initialDataStore){
  activeSessionId=initialDataStore.dataset.initialSessionId;
  if(activeSessionId==="null"){
    activeSessionId=null;
  }
  else{
    loadChat(activeSessionId);
    highlightActiveChat(activeSessionId);
  }
}


function renderChat(response_data){
  chatmessagesdiv.innerHTML = "";
  const chatHistory = response_data.chat_history;
  if(chatHistory && chatHistory.length > 0){
    chatHistory.forEach(msg =>{
      chatmessagesdiv.innerHTML += `<div class="chat-message user">${msg.question}</div>`;
      chatmessagesdiv.innerHTML += `<div class="chat-message ai">${msg.answer}</div>`;
    })
  }
  else{
    chatmessagesdiv.innerHTML = `
      <div class="chatbot-rules">
          <h3>📘 How to Use the AI Admin Chatbot</h3>
          <ul>
              <li>✔️ Select only relevant tables (e.g., <em>patients</em>, <em>appointments</em>, <em>staff</em>).</li>
              <li>✔️ Ask specific questions based on the database (e.g., “Today's appointments?”).</li>
              <li>✔️ Avoid vague queries like “how is everything?”</li>
              <li>✔️ Combine filters for better insights (e.g., “ICU patients admitted this week”).</li>
              <li>✔️ Use it to monitor hospital status: bed availability, staff shifts, pending discharges.</li>
          </ul>
      </div>
  `;
  }
  chatmessagesdiv.scrollTop = chatmessagesdiv.scrollHeight;
}
if(sessionullist){
  sessionullist.addEventListener("click",(event)=>{
    const clickedChat = event.target.closest(".newchatli");
    if(clickedChat){
      const sessionId = clickedChat.dataset.sessionId;
      if(sessionId){
        loadChat(sessionId);
        highlightActiveChat(sessionId);
      }
    }
    
  })
}
function highlightActiveChat(sessionId) {
    // Remove highlight from all chats first
    document.querySelectorAll(".newchatli.active").forEach(li => {
        li.classList.remove("active");
    });
    if(!sessionId) return;
    // Add highlight to the currently active chat
    const currentActiveLi = document.querySelector(`.newchatli[data-session-id="${sessionId}"]`);
    if (currentActiveLi) {
        currentActiveLi.classList.add("active");
    }
}
document.querySelectorAll(".menu-wrapper").forEach(wrapper =>{
  wrapper.addEventListener("click",function (event){
    event.stopPropagation();
    document.querySelectorAll('.dropdown-menu').forEach(m =>{
      if(m !== this.querySelector(".dropdown-menu"))m.style.display = 'none';
    })
    const menu = this.querySelector(".dropdown-menu");
    if(menu){
      menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex'; 
    }
  })
})
document.querySelectorAll(".dropdown-menu button:nth-child(1)").forEach(renameButton =>{
  renameButton.addEventListener("click",function(event){
    event.stopPropagation();
    const li=this.closest("li");
    const chatName=li.querySelector(".chat-name")
    const oldName = chatName.textContent.trim();
    if(li.querySelector(".rename-input")){
      return;
    }
    const input= document.createElement("input");
    input.type="text";
    input.value=oldName;
    input.className="rename-input";
    chatName.replaceWith(input);
    input.focus();
    input.addEventListener("keydown",async(e)=>{
      if(e.key === 'Enter'){
        const newName = input.value.trim();
        const sessionId = li.dataset.sessionId;
        const span = document.createElement("span");
        span.className="chat-name";
        span.textContent = newName;
        input.replaceWith(span);
        li.querySelector(".dropdown-menu").style.display = 'none'; // Hide dropdown menu
        fetch(`/admin/ai/chat/${sessionId}/rename`, {
          method:"POST",
          headers:{
            "Content-Type": "application/json"
          },
          body:JSON.stringify({
            newName,
            sessionId
          })
        })
        .then((res)=>{
          if(!res.ok){
            throw new Error("Failed to rename chat");
          }
          return res.json();
        })
      }
    })
  })
})
document.querySelectorAll(".dropdown-menu button:nth-child(2)").forEach(deleteButton =>{
  deleteButton.addEventListener("click",function(event){
    event.stopPropagation();
    const li = this.closest("li");
    const sessionId = li.dataset.sessionId;
    if(confirm("Are you sure you want to delete this chat?")){
      fetch(`/admin/ai/chat/${sessionId}/delete`,{
        method:"DELETE",
        headers:{
          "Content-Type":"application/json"
        }
      })
      .then((res)=>{
        if(!res.ok){
          throw new Error("Failed to delete chat");
        }
        li.remove();
        activeSessionId = null;
        highlightActiveChat(null);
        renderChat(null)
      })
      .catch((err)=>{
        alert("Error deleting chat");
      })
    }
  })
})