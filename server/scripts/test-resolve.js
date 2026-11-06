// Replace the string below with your actual incidentId from the previous test
const INCIDENT_ID = "6aed93bb2e08c1da8b609cc6"; 

fetch('http://localhost:5000/api/incident/resolve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    incidentId: INCIDENT_ID,
    engineerFeedback: "I restarted the payments-api via PM2, increased the memory limit, and verified that the 502 errors stopped."
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));