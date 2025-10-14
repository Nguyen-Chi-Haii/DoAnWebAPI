document.addEventListener('DOMContentLoaded', function () {
    // ---- Dữ liệu giả lập ----
    const stats = {
        totalImages: 1240,
        totalUsers: 356,
        totalLikes: 18340,
        totalDownloads: 9210,
    };

    const monthlyUsers = [
        { month: "Thg 1", users: 25 }, { month: "Thg 2", users: 40 },
        { month: "Thg 3", users: 55 }, { month: "Thg 4", users: 70 },
        { month: "Thg 5", users: 80 }, { month: "Thg 6", users: 90 },
        { month: "Thg 7", users: 100 }, { month: "Thg 8", users: 120 },
        { month: "Thg 9", users: 130 }, { month: "Thg 10", users: 150 },
    ];

    const topTags = [
        { name: "Phong cảnh", count: 320 },
        { name: "Động vật", count: 210 },
        { name: "Kiến trúc", count: 150 },
    ];

    const topTopics = [
        { name: "Thiên nhiên", count: 280 },
        { name: "Con người", count: 200 },
        { name: "Du lịch", count: 160 },
    ];

    const uploadDownloadData = [
        { month: "Thg 1", uploads: 120, downloads: 400 }, { month: "Thg 2", uploads: 140, downloads: 420 },
        { month: "Thg 3", uploads: 180, downloads: 460 }, { month: "Thg 4", uploads: 200, downloads: 480 },
        { month: "Thg 5", uploads: 220, downloads: 520 }, { month: "Thg 6", uploads: 250, downloads: 540 },
        { month: "Thg 7", uploads: 260, downloads: 580 }, { month: "Thg 8", uploads: 280, downloads: 600 },
        { month: "Thg 9", uploads: 300, downloads: 620 }, { month: "Thg 10", uploads: 320, downloads: 650 },
    ];

    // --- Cập nhật các card thống kê ---
    document.getElementById('totalImages').textContent = stats.totalImages.toLocaleString('vi-VN');
    document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString('vi-VN');
    document.getElementById('totalLikes').textContent = stats.totalLikes.toLocaleString('vi-VN');
    document.getElementById('totalDownloads').textContent = stats.totalDownloads.toLocaleString('vi-VN');

    // --- Hiển thị Top Tags & Topics ---
    const topTagsContainer = document.getElementById('topTagsContainer');
    topTags.forEach(tag => {
        topTagsContainer.innerHTML += `
            <div class="flex justify-between py-2 border-b last:border-none text-sm">
                <span>${tag.name}</span>
                <span class="font-semibold text-blue-600">${tag.count}</span>
            </div>
        `;
    });

    const topTopicsContainer = document.getElementById('topTopicsContainer');
    topTopics.forEach(topic => {
        topTopicsContainer.innerHTML += `
            <div class="flex justify-between py-2 border-b last:border-none text-sm">
                <span>${topic.name}</span>
                <span class="font-semibold text-green-600">${topic.count}</span>
            </div>
        `;
    });

    // --- Cấu hình chung cho biểu đồ ---
    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 6,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#e5e7eb' }, // gray-200
                ticks: { color: '#6b7280' } // gray-500
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6b7280' }
            }
        }
    };

    // --- Vẽ Biểu đồ Tăng trưởng Người dùng (Bar Chart) ---
    const userCtx = document.getElementById('userGrowthChart').getContext('2d');
    userCtx.canvas.height = 300;
    new Chart(userCtx, {
        type: 'bar',
        data: {
            labels: monthlyUsers.map(d => d.month),
            datasets: [{
                label: 'Người dùng mới',
                data: monthlyUsers.map(d => d.users),
                backgroundColor: '#3b82f6', // blue-500
                borderColor: '#2563eb', // blue-600
                borderWidth: 1,
                borderRadius: { topLeft: 6, topRight: 6 }
            }]
        },
        options: chartOptions,
    });

    // --- Vẽ Biểu đồ Hoạt động (Line Chart) ---
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    activityCtx.canvas.height = 300;
    new Chart(activityCtx, {
        type: 'line',
        data: {
            labels: uploadDownloadData.map(d => d.month),
            datasets: [
                {
                    label: 'Tải lên',
                    data: uploadDownloadData.map(d => d.uploads),
                    borderColor: '#22c55e', // green-500
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                },
                {
                    label: 'Tải xuống',
                    data: uploadDownloadData.map(d => d.downloads),
                    borderColor: '#3b82f6', // blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                }
            ]
        },
        options: chartOptions
    });
});