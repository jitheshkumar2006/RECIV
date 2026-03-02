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

  let title = document.getElementById("title").value;
  let category = document.getElementById("category").value;
  let desc = document.getElementById("desc").value;
  let file = document.getElementById("photo").files[0];

  if (!file) {
    alert("Upload a photo");
    return;
  }

  let department = "General";
  if (category === "Road") department = "Public Works Dept";
  if (category === "Garbage") department = "Sanitation Dept";
  if (category === "Water") department = "Water Authority";
  if (category === "Electricity") department = "Power Dept";

  let reader = new FileReader();

  reader.onload = function(e) {

    let imageData = e.target.result;

    navigator.geolocation.getCurrentPosition(
      pos => processComplaint(pos.coords.latitude, pos.coords.longitude),
      () => {
        alert("Location blocked — using default location");
        processComplaint(0, 0);
      }
    );

    function processComplaint(lat, lng) {

      db.collection("COMPLAINTS").get().then(snapshot => {

        let count = 0;
        let duplicateFound = false;

        snapshot.forEach(doc => {
          let old = doc.data();

          if (
            Math.abs((old.latitude || 0) - lat) < 0.01 &&
            Math.abs((old.longitude || 0) - lng) < 0.01
          ) {
            count++;
            duplicateFound = true;
          }
        });

        // ⭐ PRIORITY LOGIC
        let priority = "Low";
        let recurring = false;

        if (count >= 5) {
          priority = "High";
          recurring = true;
        } else if (count >= 3) {
          priority = "High";
        } else if (count >= 1) {
          priority = "Medium";
        }

        // ⭐ POPUPS
        if (duplicateFound) alert("⚠️ Similar complaint nearby!");
        if (recurring) alert("🚨 Recurring Problem Area Detected!");
        alert("🔥 Priority Assigned: " + priority);

        // ⭐ RESOLUTION TIME
        let resolutionTime =
          priority === "High" ? "1‑2 days" :
          priority === "Medium" ? "3‑5 days" :
          "7‑10 days";

        if (recurring) resolutionTime += " (may take longer)";

        // ⭐ LOCATION NAME
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {

          let locationName = "Unknown";

          if (data.address) {
            locationName =
              (data.address.road || "") + ", " +
              (data.address.city || "") + ", " +
              (data.address.state || "");
          }

          // ⭐ SAVE TO FIREBASE
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
            alert("✅ Complaint Submitted! ID: " + docRef.id);
            loadLeaderboard();
          });

        });

      });

    }

  };

  reader.readAsDataURL(file);
}

/////////////////////////////////////////////////////
// ⭐ CHECK STATUS + RATING
/////////////////////////////////////////////////////

function checkStatus() {

  let id = document.getElementById("complaintId").value;

  db.collection("COMPLAINTS").doc(id).get().then(doc => {

    if (!doc.exists) {
      statusBox.innerHTML = "Complaint not found";
      return;
    }

    let data = doc.data();
    let dept = data.department;

    db.collection("DEPARTMENTS").doc(dept).get().then(depDoc => {

      let trust = depDoc.exists ? depDoc.data().trustScore + "%" : "Not rated";

      if (data.status === "Resolved") {
        statusBox.innerHTML = `
          Status: Resolved<br>
          Department: ${dept}<br>
          Trust Score: ${trust}<br><br>
          Rate:<br>
          <button onclick="rateComplaint('${id}',5)">⭐⭐⭐⭐⭐</button>
          <button onclick="rateComplaint('${id}',4)">⭐⭐⭐⭐</button>
          <button onclick="rateComplaint('${id}',3)">⭐⭐⭐</button>
          <button onclick="rateComplaint('${id}',2)">⭐⭐</button>
          <button onclick="rateComplaint('${id}',1)">⭐</button>
        `;
      } else {
        statusBox.innerHTML = `
          Status: ${data.status}<br>
          Department: ${dept}<br>
          Trust Score: ${trust}<br>
          Rating available after resolution
        `;
      }

    });

  });
}

/////////////////////////////////////////////////////
// ⭐ RATE COMPLAINT
/////////////////////////////////////////////////////

function rateComplaint(id, stars) {

  db.collection("COMPLAINTS").doc(id).get().then(doc => {

    let dept = doc.data().department;

    db.collection("COMPLAINTS").doc(id).update({ rating: stars });

    db.collection("DEPARTMENTS").doc(dept).get().then(depDoc => {

      if (!depDoc.exists) {
        db.collection("DEPARTMENTS").doc(dept).set({
          totalRating: stars,
          totalComplaints: 1,
          trustScore: stars * 20
        });
      } else {
        let d = depDoc.data();
        let total = d.totalRating + stars;
        let count = d.totalComplaints + 1;
        let score = (total / count) * 20;

        db.collection("DEPARTMENTS").doc(dept).update({
          totalRating: total,
          totalComplaints: count,
          trustScore: score.toFixed(1)
        });
      }

      statusBox.innerHTML = "⭐ Rating Submitted!";
      loadLeaderboard();

    });

  });
}

/////////////////////////////////////////////////////
// 🏆 LEADERBOARD
/////////////////////////////////////////////////////

function loadLeaderboard() {

  db.collection("DEPARTMENTS")
    .orderBy("trustScore", "desc")
    .get()
    .then(snapshot => {

      let html = "";
      let rank = 1;

      snapshot.forEach(doc => {
        let d = doc.data();
        html += `
          <b>#${rank} ${doc.id}</b><br>
          Trust Score: ${d.trustScore}%<br>
          Rated Complaints: ${d.totalComplaints}<hr>
        `;
        rank++;
      });

      leaderboardBox.innerHTML = html || "No ratings yet";

    });

}

window.onload = loadLeaderboard;
