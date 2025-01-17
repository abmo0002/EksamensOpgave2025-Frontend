const deliveryList = document.getElementById('delivery-list');
const createDroneButton = document.getElementById('create-drone');
const createDeliveryButton = document.getElementById('create-delivery');
const deliveryAddressInput = document.getElementById('delivery-address');
const pizzaSelect = document.getElementById('pizza-select');
const droneMessage = document.getElementById('drone-message');


function fetchPizzas() {
    fetch('http://localhost:8080/pizzas')
        .then(response => response.json())
        .then(pizzas => {
            pizzas.forEach(pizza => {
                const option = document.createElement('option');
                option.value = pizza.id;
                option.textContent = pizza.title;
                pizzaSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Fejl ved hentning af pizzaer:', error));
}

function fetchDeliveries() {
    fetch('http://localhost:8080/deliveries')
        .then(response => response.json())
        .then(data => {
            deliveryList.innerHTML = '';
            data.forEach(delivery => {
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', delivery.id);
                listItem.innerHTML = `
                    <span>${delivery.pizza ? delivery.pizza.title : "Ukendt Pizza"} - ${delivery.address}</span>
                    <span>${delivery.drone ? "Drone Tildelt" : "Mangler Drone"}</span>
                    <span>Forventet Leveringstid: ${new Date(delivery.expectedDeliveryTime).toLocaleString()}</span> 
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

function assignDroneToDelivery(deliveryId) {
    fetch(`http://localhost:8080/deliveries/${deliveryId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId: null })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Fejl ved tildeling af drone.');
            }
            return response.json();
        })
        .then(() => {
            const listItem = deliveryList.querySelector(`[data-id="${deliveryId}"]`);
            if (listItem) {
                const statusSpan = listItem.querySelector('span:nth-child(2)');
                statusSpan.textContent = "Drone Tildelt";
                const assignButton = listItem.querySelector('.assign-drone');
                if (assignButton) assignButton.remove();
            }
        })
        .catch(error => console.error('Fejl ved tildeling af drone:', error));
}


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
        .then(() => fetchDeliveries())
        .catch(error => alert(error.message));
}


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


createDeliveryButton.addEventListener('click', () => {
    const address = deliveryAddressInput.value.trim();
    const pizzaId = pizzaSelect.value;

    if (!address || !pizzaId) {
        alert("Indtast både en adresse og vælg en pizza.");
        return;
    }

    fetch(`http://localhost:8080/deliveries/add?pizzaId=${pizzaId}&address=${encodeURIComponent(address)}`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(() => {
            deliveryAddressInput.value = '';
            pizzaSelect.value = '';
            fetchDeliveries();
        })
        .catch(() => alert("Fejl ved oprettelse af levering."));
});


fetchPizzas();
setInterval(fetchDeliveries, 60000);
fetchDeliveries();
