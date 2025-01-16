// Hent leveringer, der ikke er leveret endnu
async function fetchUnassignedDeliveries() {
    try {
        const response = await fetch('http://localhost:8080/deliveries/queue');
        if (!response.ok) {
            throw new Error("Error fetching deliveries");
        }
        const deliveries = await response.json();
        console.log("Fetched deliveries:", deliveries);
        displayDeliveries(deliveries);
    } catch (error) {
        console.error("Error fetching deliveries:", error);
    }
}

// Vis leveringer i listen
function displayDeliveries(deliveries) {
    const deliveryList = document.getElementById('delivery-list');
    deliveryList.innerHTML = ''; // Tøm listen, før vi tilføjer nye elementer

    deliveries.sort((a, b) => a.id - b.id); // Sorter efter id (ældre leveringer først)

    deliveries.forEach(delivery => {
        const listItem = document.createElement('li');
        listItem.textContent = `Delivery ID: ${delivery.id}, Pizza: ${delivery.pizza.title}`;

        if (!delivery.drone) {
            const addDroneButton = document.createElement('button');
            addDroneButton.textContent = 'Assign Drone';
            addDroneButton.onclick = () => assignDroneToDelivery(delivery.id);
            listItem.appendChild(addDroneButton);
        } else {
            listItem.textContent += ' - Drone Assigned';
        }

        deliveryList.appendChild(listItem);
    });
}

// Tildel en drone til en levering
async function assignDroneToDelivery(deliveryId) {
    try {
        const response = await fetch(`http://localhost:8080/deliveries/${deliveryId}/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error("Error assigning drone");
        }
        const updatedDelivery = await response.json();
        console.log("Delivery updated:", updatedDelivery);
        fetchUnassignedDeliveries(); // Opdater listen efter tildeling
    } catch (error) {
        console.error("Error assigning drone:", error);
    }
}

// Opret en ny drone
async function createDrone() {
    try {
        const response = await fetch('http://localhost:8080/drones/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error("Error creating drone");
        }
        const newDrone = await response.json();
        console.log("Drone created:", newDrone);
    } catch (error) {
        console.error("Error creating drone:", error);
    }
}

// Opdater leveringskøen automatisk hver 60. sekund
setInterval(fetchUnassignedDeliveries, 60000); // Opdaterer listen hver 60. sekund

// Hent leveringer ved første indlæsning
fetchUnassignedDeliveries();
