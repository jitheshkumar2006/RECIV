// 🔥 Firebase Config
var firebaseConfig = {
  apiKey: "AIzaSyDgBVweZ7uSQrKvMOupfRkS-sDBLI2lFNU",
  authDomain: "reciv-21e5d.firebaseapp.com",
  projectId: "reciv-21e5d",
  storageBucket: "reciv-21e5d.firebasestorage.app",
  messagingSenderId: "503172859164",
  appId: "1:503172859164:web:846ca4cec88e037d66a6d9"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

/////////////////////////////////////////////////////
// 🔵 SUBMIT COMPLAINT
/////////////////////////////////////////////////////

function submitComplaint() {

  var title = document.getElementById("title").value;
  var category = document.getElementById("category").value;
  var desc = document.getElementById("desc").value;
  var file = document.getElementById("photo").files[0];

  if (!file) {
    alert("Upload a photo");
    return;
  }

  let department = "General";
  if (category === "Road") department = "Public Works Dept";
  if (category === "Garbage") department = "Sanitation Dept";
  if (category === "Water") department = "Water Authority";
  if (category === "Electricity") department = "Power Dept";

  var reader = new FileReader();

  reader.onload = function(e) {

    var imageData = e.target.result;

    navigator.geolocation.getCurrentPosition(function(position) {

      var lat = position.coords.latitude;
      var lng = position.coords.longitude;

      db.collection("COMPLAINTS").get().then(snapshot => {

        let count = 0;
        let duplicateFound = false;

        snapshot.forEach(doc => {
          let old = doc.data();
          if (Math.abs(old.latitude - lat) < 0.01 &&
              Math.abs(old.longitude - lng) < 0.01) {
            count++;
            duplicateFound = true;
          }
        });

        // ⭐ PRIORITY AI
        let priority = "Low";
        let recurring = false;

        if (count >= 3) priority = "High";
        else if (count >= 1) priority = "Medium";

        if (count >= 5) {
          recurring = true;
          alert("Recurring Problem Area Detected!");
        }

        if (duplicateFound) {
          alert("Similar complaint nearby!");
        }

        // ⭐ RESOLUTION TIME AI
        let resolutionTime;
        if (priority === "High") resolutionTime = "1 to 2 days";
        else if (priority === "Medium") resolutionTime = "3 to 5 days";
        else resolutionTime = "7 to 10 days";

        if (recurring) resolutionTime += " (may take longer)";

        // ⭐ LOCATION API
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {

          let locationName = "Unknown";

          if (data.address) {
            locationName =
              (data.address.road || "") + ", " +
              (data.address.city || "") + ", " +
              (data.address.state || "") + ", " +
              (data.address.country || "");
          }

          db.collection("COMPLAINTS").add({
            title,
            description: desc,
            image: imageData,
            latitude: lat,
            longitude: lng,
            location: locationName,
            status: "Pending",
            priority,
            recurring,
            resolutionTime,
            category,
            department,
            timestamp: new Date()
          })
          .then(docRef => {
            alert("Complaint Submitted! Your ID: " + docRef.id);
            loadLeaderboard(); // refresh leaderboard
          });

        });

      });

    });

  };

  reader.readAsDataURL(file);
}

/////////////////////////////////////////////////////
// ⭐ CHECK STATUS + TRUST SCORE
/////////////////////////////////////////////////////

function checkStatus() {

  var id = document.getElementById("complaintId").value;

  db.collection("COMPLAINTS").doc(id).get().then(doc => {

    if (!doc.exists) {
      document.getElementById("statusBox").innerHTML = "Complaint not found";
      return;
    }

    let data = doc.data();
    let dept = data.department;

    db.collection("DEPARTMENTS").doc(dept).get().then(depDoc => {

      let trustScore = "Not rated yet";

      if (depDoc.exists) {
        trustScore = depDoc.data().trustScore + "%";
      }

      if (data.status === "Resolved") {

        document.getElementById("statusBox").innerHTML = `
          <b>Status:</b> Resolved <br>
          <b>Department:</b> ${dept} <br>
          <b>Trust Score:</b> ${trustScore} <br><br>

          <b>Rate Repair:</b><br><br>

          <button onclick="rateComplaint('${id}',5)">5</button>
          <button onclick="rateComplaint('${id}',4)">4</button>
          <button onclick="rateComplaint('${id}',3)">3</button>
          <button onclick="rateComplaint('${id}',2)">2</button>
          <button onclick="rateComplaint('${id}',1)">1</button>
        `;

      } else {

        document.getElementById("statusBox").innerHTML = `
          <b>Status:</b> ${data.status} <br>
          <b>Department:</b> ${dept} <br>
          <b>Trust Score:</b> ${trustScore}
        `;

      }

    });

  });

}

/////////////////////////////////////////////////////
// ⭐ RATE + UPDATE TRUST SCORE
/////////////////////////////////////////////////////

function rateComplaint(id, stars) {

  db.collection("COMPLAINTS").doc(id).get().then(doc => {

    let data = doc.data();
    let dept = data.department;

    db.collection("COMPLAINTS").doc(id).update({
      rating: stars
    });

    db.collection("DEPARTMENTS").doc(dept).get().then(depDoc => {

      if (!depDoc.exists) {

        db.collection("DEPARTMENTS").doc(dept).set({
          totalRating: stars,
          totalComplaints: 1,
          trustScore: stars * 20
        });

      } else {

        let d = depDoc.data();
        let newTotal = d.totalRating + stars;
        let newCount = d.totalComplaints + 1;
        let avg = newTotal / newCount;
        let score = avg * 20;

        db.collection("DEPARTMENTS").doc(dept).update({
          totalRating: newTotal,
          totalComplaints: newCount,
          trustScore: score.toFixed(1)
        });

      }

      document.getElementById("statusBox").innerHTML =
        "Rating submitted successfully!";

      loadLeaderboard(); // refresh leaderboard after rating

    });

  });

}

/////////////////////////////////////////////////////
// 🏆 LEADERBOARD SYSTEM
/////////////////////////////////////////////////////

function loadLeaderboard() {

  db.collection("DEPARTMENTS")
    .orderBy("trustScore", "desc")
    .get()
    .then(snapshot => {

      let html = "";
      let rank = 1;

      if (snapshot.empty) {
        html = "No department ratings yet.";
      }

      snapshot.forEach(doc => {

        let data = doc.data();

        html += `
          <div style="margin-bottom:10px;">
            <b>#${rank} ${doc.id}</b><br>
            Trust Score: ${data.trustScore}%<br>
            Rated Complaints: ${data.totalComplaints}
          </div>
          <hr>
        `;

        rank++;

      });

      document.getElementById("leaderboardBox").innerHTML = html;

    });

}

// Auto load leaderboard when page opens
window.onload = function() {
  loadLeaderboard();
};