fetch('http://localhost:3000/user', {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json',
  },

  body: JSON.stringify({
    name: 'Yasin',
    department: 'Logistics',
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.log(error));
