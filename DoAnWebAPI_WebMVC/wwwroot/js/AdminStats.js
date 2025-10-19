// File: wwwroot/js/AdminStats.js

document.addEventListener('DOMContentLoaded', function () {
    console.log("Admin Stats script loaded.");

    // DOM Elements to update
    const totalApprovedImagesEl = document.getElementById('totalApprovedImages');
    const totalUsersEl = document.getElementById('totalUsers');
    const userGrowthChartCanvas = document.getElementById('userGrowthChart');
    const chartErrorEl = document.getElementById('chart-error');

    let userGrowthChart = null; // Variable to hold the chart instance

    // --- Function to fetch data from APIs ---
    async function loadStatsData() {
        // Show loading state
        if (totalApprovedImagesEl) totalApprovedImagesEl.textContent = '...';
        if (totalUsersEl) totalUsersEl.textContent = '...';
        if (chartErrorEl) chartErrorEl.classList.add('hidden'); // Hide previous errors

        try {
            // Fetch Approved Image Count and Total User Count in parallel
            const [imageResult, users] = await Promise.all([
                api.images.getAll({ status: 'approved', page: 1, pageSize: 1 }), // Get count efficiently
                api.users.getAll() // Get all users for count and chart data
            ]);

            // 1. Update Total Approved Images Count
            const approvedImageCount = imageResult.totalCount || 0;
            if (totalApprovedImagesEl) {
                totalApprovedImagesEl.textContent = approvedImageCount.toLocaleString('vi-VN');
            }
            console.log("Approved Images:", approvedImageCount);

            // 2. Update Total Users Count
            const totalUserCount = users ? users.length : 0;
            if (totalUsersEl) {
                totalUsersEl.textContent = totalUserCount.toLocaleString('vi-VN');
            }
            console.log("Total Users:", totalUserCount);

            // 3. Process User Data for Growth Chart
            if (users && users.length > 0 && userGrowthChartCanvas) {
                const userGrowthData = processUserDataForChart(users);
                renderUserGrowthChart(userGrowthData);
            } else if (userGrowthChartCanvas) {
                // Handle case with no users or canvas not found
                console.log("No user data or canvas to render chart.");
                if (chartErrorEl) {
                    chartErrorEl.textContent = 'Chưa có dữ liệu người dùng để vẽ biểu đồ.';
                    chartErrorEl.classList.remove('hidden');
                }
            }

        } catch (error) {
            console.error("Error loading stats data:", error);
            // Display error messages
            if (totalApprovedImagesEl) totalApprovedImagesEl.textContent = 'Lỗi';
            if (totalUsersEl) totalUsersEl.textContent = 'Lỗi';
            if (chartErrorEl) {
                chartErrorEl.textContent = `Lỗi tải dữ liệu: ${error.message}`;
                chartErrorEl.classList.remove('hidden');
            }
        }
    }

    // --- Function to process user data for the chart ---
    function processUserDataForChart(users) {
        const monthlyCounts = {}; // Object to store counts like: {"YYYY-MM": count}

        users.forEach(user => {
            if (user.createdAt && !user.createdAt.startsWith("0001-01-01")) { // Check for valid date
                try {
                    const date = new Date(user.createdAt);
                    // Format as YYYY-MM for grouping
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are 0-indexed, padStart ensures '01', '02', etc.
                    const yearMonth = `${year}-${month}`;

                    monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
                } catch (e) {
                    console.warn("Could not parse date for user:", user.id, user.createdAt);
                }
            }
        });

        // Convert to array and sort by date
        const sortedData = Object.entries(monthlyCounts)
            .map(([yearMonth, count]) => ({ month: yearMonth, users: count }))
            .sort((a, b) => a.month.localeCompare(b.month)); // Sort chronologically

        console.log("Processed User Growth Data:", sortedData);
        return sortedData; // Example: [{ month: "2025-09", users: 2 }, { month: "2025-10", users: 10 }]
    }

    // --- Function to render the User Growth Chart ---
    function renderUserGrowthChart(data) {
        if (!userGrowthChartCanvas) return;
        const ctx = userGrowthChartCanvas.getContext('2d');

        // Destroy previous chart instance if it exists
        if (userGrowthChart) {
            userGrowthChart.destroy();
        }


        // Basic chart options (customize as needed)
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false, // Allow height control
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Số lượng người dùng mới'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tháng'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend for single dataset
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` Người dùng mới: ${context.parsed.y}`;
                        }
                    }
                }
            }
        };

        // Create the new chart
        userGrowthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.month), // Use YYYY-MM as labels
                datasets: [{
                    label: 'Người dùng mới',
                    data: data.map(d => d.users),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)', // Tailwind blue-500 with opacity
                    borderColor: 'rgba(37, 99, 235, 1)',   // Tailwind blue-700
                    borderWidth: 1,
                    borderRadius: 4 // Add some rounding to bars
                }]
            },
            options: chartOptions
        });
        userGrowthChartCanvas.style.height = '350px'; // Set a reasonable height
    }

    // --- Run Initialization ---
    if (typeof api !== 'undefined' && api.images && api.users && typeof Chart !== 'undefined') {
        loadStatsData();
    } else {
        console.error("API service or Chart.js is not available.");
        if (chartErrorEl) {
            chartErrorEl.textContent = 'Lỗi: Không thể tải thư viện biểu đồ hoặc dịch vụ API.';
            chartErrorEl.classList.remove('hidden');
        }
        // Show error state for counts as well
        if (totalApprovedImagesEl) totalApprovedImagesEl.textContent = 'Lỗi';
        if (totalUsersEl) totalUsersEl.textContent = 'Lỗi';
    }
});