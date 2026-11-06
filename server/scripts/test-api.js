fetch('http://localhost:5000/api/incident/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    errorLog: "payments-api returned 502 Bad Gateway. upstream timed out",
    useMemory: true
  })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));