fetch('/get-admitted-patients')
    .then(response => response.json())
    .then(patientData => {
        // Extract the dates and patient counts
        const labels = patientData.map(item => item.date); // Admission dates for the X-axis
        const data = patientData.map(item => item.patient_count); // Patient count for the Y-axis

        const formattedLabels = labels.map(label => {
            const date = new Date(label);
            return date.toLocaleDateString(); // Formats the date to MM/DD/YYYY
        });

        // Create the chart
        var ctx = document.getElementById('admittedPatientsChart').getContext('2d');
        var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedLabels, // Dates on X-axis
                datasets: [{
                    label: 'Admitted Patients',
                    data: data, // Patient counts on Y-axis
                    borderColor: 'rgba(75, 192, 192, 1)', // Line color
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill under the line
                    borderWidth: 2,
                    tension: 0.4 // Curve smoothness
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Patients',
                            color: 'rgba(0, 0, 0, 0.8)',
                            font: { size: 16 }
                        },
                        ticks: { color: 'rgba(0, 0, 0, 0.8)' }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: 'rgba(0, 0, 0, 0.8)',
                            font: { size: 16 }
                        },
                        ticks: { color: 'rgba(0, 0, 0, 0.8)' }
                    }
                },
                plugins: {
                    legend: { display: true }
                }
            }
        });
    })
    .catch(error => console.error('Error fetching admitted patient data:', error));

fetch('/admitted-vs-discharged')
    .then(response => response.json())
    .then(data => {
        const admitted = data.admitted || 0; // Count of admitted patients
        const discharged = data.discharged || 0; // Count of discharged patients

        // Create the donut chart
        const ctx = document.getElementById('admittedDischargedChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Admitted', 'Discharged'],
                datasets: [{
                    data: [admitted, discharged], // Data for the chart
                    backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(75, 192, 192, 0.8)'], // Colors for the segments
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'], // Border colors
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top', // Position of the legend
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                const value = tooltipItem.raw;
                                const total = admitted + discharged;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    })
    .catch(error => console.error('Error fetching chart data:', error));

function toggleAppointmentsDropdown() {
    var dropdown = document.getElementById("appointmentDropdown");
    dropdown.style.display = (dropdown.style.display === "flex") ? "none" : "flex";
}
window.onclick = function (event) {
    var dropdown = document.getElementById("appointmentDropdown");
    var button = document.querySelector(".calendar-btn");
    if (!button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none"; // Close dropdown if clicked outside
    }
}
