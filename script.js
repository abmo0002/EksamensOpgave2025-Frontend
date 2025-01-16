// Hent elementer fra DOM
const deliveryList = document.getElementById('delivery-list');
const createDroneButton = document.getElementById('create-drone');
const createDeliveryButton = document.getElementById('create-delivery');
const deliveryAddressInput = document.getElementById('delivery-address');
const droneMessage = document.getElementById('drone-message');

// Funktion til at opdatere leveringslisten
function fetchDeliveries() {
    fetch('http://localhost:8080/deliveries')
        .then(response => {
            if (!response.ok) {
                throw new Error('Netværksfejl');
            }
            return response.json();
        })
        .then(data => {
            deliveryList.innerHTML = '';
            data.forEach(delivery => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${delivery.pizza.name || "Ukendt Pizza"} - ${delivery.address}</span>
                    <span>${delivery.drone ? "Tildelt Drone" : "Mangler Drone"}</span>
                    ${!delivery.drone ? '<button class="assign-drone">Tildel Drone</button>' : ''}
                    <button class="finish-delivery">Afslut Levering</button>
                `;

                if (!delivery.drone) {
                    const assignButton = listItem.querySelector('.assign-drone');
                    assignButton.addEventListener('click', () => assignDroneToDelivery(delivery.id));
                }

                const finishButton = listItem.querySelector('.finish-delivery');
                finishButton.addEventListener('click', () => finishDelivery(delivery.id));

                deliveryList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Fejl ved hentning af leveringer:', error));
}

// Funktion til at tildele drone til levering
function assignDroneToDelivery(deliveryId) {
    fetch(`http://localhost:8080/deliveries/${deliveryId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId: null })
    })
        .then(response => response.json())
        .then(() => fetchDeliveries());
}

// Funktion til at afslutte levering
function finishDelivery(deliveryId) {
    fetch(`http://localhost:8080/deliveries/${deliveryId}/finish`, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "Kunne ikke afslutte leveringen uden en tilkoblet drone.");
                });
            }
            return response.json();
        })
        .then(() => {
            fetchDeliveries(); // Opdater listen, hvis afslutningen var succesfuld
        })
        .catch(error => {
            alert(error.message); // Vis fejlbeskeden som en alert
        });
}
// Funktion til at oprette en drone
createDroneButton.addEventListener('click', () => {
    fetch('http://localhost:8080/drones/add', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            droneMessage.textContent = `Drone oprettet med serienummer: ${data.serialNumber}`;
            droneMessage.style.color = "green";
            setTimeout(() => (droneMessage.textContent = ""), 3000);
            fetchDeliveries();
        })
        .catch(() => {
            droneMessage.textContent = "Fejl ved oprettelse af drone";
            droneMessage.style.color = "red";
        });
});

// Funktion til at oprette en levering
createDeliveryButton.addEventListener('click', () => {
    const address = deliveryAddressInput.value.trim();
    if (!address) {
        alert("Indtast venligst en adresse.");
        return;
    }

    fetch(`http://localhost:8080/deliveries/add?pizzaId=1&address=${encodeURIComponent(address)}`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(() => {
            deliveryAddressInput.value = '';
            fetchDeliveries();
        })
        .catch(() => alert("Fejl ved oprettelse af levering."));
});

// Opdater leveringslisten hvert minut
setInterval(fetchDeliveries, 60000);

// Initial opdatering
fetchDeliveries();
