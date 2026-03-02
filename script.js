<!DOCTYPE html>
<html>
<head>
  <title>RECIV Admin Dashboard</title>

  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">

  <style>
    *{
      box-sizing:border-box;
      font-family:'Poppins',sans-serif;
    }

    body{
      margin:0;
      padding:30px;
      background:linear-gradient(270deg,#0f2027,#203a43,#2c5364);
      background-size:600% 600%;
      animation:bgMove 15s ease infinite;
      color:white;
    }

    @keyframes bgMove{
      0%{background-position:0%}
      50%{background-position:100%}
      100%{background-position:0%}
    }

    .header{
      text-align:center;
      margin-bottom:30px;
    }

    .header h1{
      font-size:36px;
      margin:0;
    }

    .stats{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
      gap:20px;
      margin-bottom:30px;
    }

    .stat-card{
      background:rgba(255,255,255,0.1);
      backdrop-filter:blur(15px);
      border-radius:15px;
      padding:20px;
      text-align:center;
      box-shadow:0 10px 30px rgba(0,0,0,0.4);
    }

    .stat-card h2{
      margin:0;
      font-size:28px;
    }

    .dashboard{
      display:grid;
      grid-template-columns:1fr 2fr;
      gap:25px;
    }

    .panel{
      background:rgba(255,255,255,0.95);
      border-radius:18px;
      padding:25px;
      box-shadow:0 15px 40px rgba(0,0,0,0.4);
      color:#1e3c72;
    }

    h2{
      text-align:center;
      margin-bottom:15px;
    }

    .card{
      background:#f4f6f9;
      padding:15px;
      border-radius:12px;
      margin-bottom:15px;
      box-shadow:0 5px 15px rgba(0,0,0,0.1);
      transition:.3s;
    }

    .card:hover{
      transform:scale(1.02);
    }

    .badge{
      padding:4px 10px;
      border-radius:20px;
      font-size:12px;
      color:white;
      font-weight:600;
    }

    .pending{background:orange;}
    .resolved{background:green;}
    .high{background:red;}
    .medium{background:orange;}
    .low{background:green;}

    button{
      padding:8px 12px;
      border:none;
      border-radius:8px;
      background:linear-gradient(45deg,#1e3c72,#2a5298);
      color:white;
      cursor:pointer;
      margin-top:8px;
      font-weight:600;
      transition:.3s;
    }

    button:hover{
      transform:translateY(-3px);
      box-shadow:0 8px 20px rgba(0,0,0,0.3);
    }

    .delete-btn{
      background:crimson;
    }

    input{
      width:100%;
      padding:10px;
      margin-bottom:15px;
      border-radius:8px;
      border:none;
    }

    img{
      width:100%;
      max-width:220px;
      border-radius:10px;
      margin-top:8px;
    }

    a{
      font-size:13px;
      color:#1e3c72;
      text-decoration:none;
      font-weight:600;
    }

    a:hover{
      text-decoration:underline;
    }

  </style>
</head>

<body>

<div class="header">
  <h1>📊 RECIV Admin Dashboard</h1>
  <p>Smart Civic Intelligence & Governance Analytics</p>
</div>

<!-- STATS -->
<div class="stats">
  <div class="stat-card">
    <h2 id="totalComplaints">0</h2>
    Total Complaints
  </div>
  <div class="stat-card">
    <h2 id="pendingCount">0</h2>
    Pending Issues
  </div>
  <div class="stat-card">
    <h2 id="resolvedCount">0</h2>
    Resolved Issues
  </div>
</div>

<div class="dashboard">

  <!-- Leaderboard -->
  <div class="panel">
    <h2>🏆 Department Leaderboard</h2>
    <div id="leaderboardBox">Loading...</div>
  </div>

  <!-- Complaints -->
  <div class="panel">
    <h2>📋 All Complaints</h2>

    <!-- 🔍 SEARCH BAR -->
    <input type="text" id="searchBox" placeholder="Search by title, department, status..." onkeyup="filterComplaints()">

    <div id="complaints"></div>
  </div>

</div>

<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<script>

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "reciv-21e5d.firebaseapp.com",
  projectId: "reciv-21e5d",
  storageBucket: "reciv-21e5d.firebasestorage.app",
  messagingSenderId: "503172859164",
  appId: "1:503172859164:web:846ca4cec88e037d66a6d9"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

window.allComplaints = [];

/////////////////////////////////////////////////////
// LEADERBOARD
/////////////////////////////////////////////////////

function loadLeaderboard() {
  db.collection("DEPARTMENTS")
    .orderBy("trustScore", "desc")
    .get()
    .then(snapshot => {
      let html = "";
      let rank = 1;

      snapshot.forEach(doc => {
        let data = doc.data();
        html += `
          <div class="card">
            <b>#${rank} ${doc.id}</b><br>
            Trust Score: <b>${data.trustScore}%</b><br>
            Rated Complaints: ${data.totalComplaints}
          </div>
        `;
        rank++;
      });

      document.getElementById("leaderboardBox").innerHTML = html || "No ratings yet.";
    });
}

/////////////////////////////////////////////////////
// LOAD COMPLAINTS + STATS
/////////////////////////////////////////////////////

db.collection("COMPLAINTS").onSnapshot(snapshot => {

  let html = "";
  let total = 0;
  let pending = 0;
  let resolved = 0;

  window.allComplaints = [];

  snapshot.forEach(doc => {

    total++;
    let data = doc.data();
    window.allComplaints.push({ id: doc.id, data });

    if(data.status === "Pending") pending++;
    if(data.status === "Resolved") resolved++;

    html += createCard(doc.id, data);
  });

  document.getElementById("complaints").innerHTML = html;
  document.getElementById("totalComplaints").innerText = total;
  document.getElementById("pendingCount").innerText = pending;
  document.getElementById("resolvedCount").innerText = resolved;

});

/////////////////////////////////////////////////////
// CARD TEMPLATE
/////////////////////////////////////////////////////

function createCard(id, data){
  return `
    <div class="card">
      <b>${data.title}</b><br>
      ${data.description}<br><br>

      <b>Status:</b>
      <span class="badge ${data.status === "Pending" ? "pending" : "resolved"}">
        ${data.status}
      </span><br><br>

      <b>Priority:</b>
      <span class="badge ${data.priority.toLowerCase()}">
        ${data.priority}
      </span><br><br>

      <b>Department:</b> ${data.department}<br>
      <b>Location:</b> ${data.location}<br><br>

      ${data.image ? `<img src="${data.image}"><br>` : ""}

      <a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" target="_blank">
        📍 View on Map
      </a><br><br>

      ${data.status === "Pending"
        ? `<button onclick="updateStatus('${id}')">Mark Resolved</button>`
        : `<button class="delete-btn" onclick="deleteComplaint('${id}')">Delete Complaint</button>`
      }
    </div>
  `;
}

/////////////////////////////////////////////////////
// SEARCH FUNCTION
/////////////////////////////////////////////////////

function filterComplaints(){
  let keyword = document.getElementById("searchBox").value.toLowerCase();
  let html = "";

  window.allComplaints.forEach(item => {
    let data = item.data;

    if(
      data.title.toLowerCase().includes(keyword) ||
      data.department.toLowerCase().includes(keyword) ||
      data.status.toLowerCase().includes(keyword)
    ){
      html += createCard(item.id, data);
    }
  });

  document.getElementById("complaints").innerHTML = html;
}

/////////////////////////////////////////////////////
// UPDATE STATUS
/////////////////////////////////////////////////////

function updateStatus(id){
  db.collection("COMPLAINTS").doc(id).update({
    status:"Resolved"
  });
}

/////////////////////////////////////////////////////
// DELETE
/////////////////////////////////////////////////////

function deleteComplaint(id){
  if(confirm("Delete this complaint?")){
    db.collection("COMPLAINTS").doc(id).delete();
  }
}

window.onload = function(){
  loadLeaderboard();
};

</script>

</body>
</html>
