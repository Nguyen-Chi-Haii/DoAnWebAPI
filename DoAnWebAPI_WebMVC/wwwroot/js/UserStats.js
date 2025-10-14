document.addEventListener("DOMContentLoaded", () => {
    // --- DỮ LIỆU VÀ TRẠNG THÁI ---
    const mockStatsData = [
        { Id: 1, ImageId: 101, ViewsCount: 15240, DownloadCount: 3500, LikesCount: 1200 },
        { Id: 2, ImageId: 102, ViewsCount: 8900, DownloadCount: 1200, LikesCount: 850 },
        { Id: 3, ImageId: 103, ViewsCount: 21500, DownloadCount: 7800, LikesCount: 5000 },
        { Id: 4, ImageId: 104, ViewsCount: 5200, DownloadCount: 950, LikesCount: 450 },
        { Id: 5, ImageId: 105, ViewsCount: 18000, DownloadCount: 4200, LikesCount: 3100 },
        { Id: 6, ImageId: 106, ViewsCount: 12500, DownloadCount: 3000, LikesCount: 1800 },
        { Id: 7, ImageId: 107, ViewsCount: 7800, DownloadCount: 1500, LikesCount: 900 },
        { Id: 8, ImageId: 108, ViewsCount: 30000, DownloadCount: 9000, LikesCount: 7500 },
        { Id: 9, ImageId: 109, ViewsCount: 9200, DownloadCount: 2100, LikesCount: 1050 },
        { Id: 10, ImageId: 110, ViewsCount: 14500, DownloadCount: 3800, LikesCount: 2900 },
        { Id: 11, ImageId: 111, ViewsCount: 2000, DownloadCount: 500, LikesCount: 180 },
        { Id: 12, ImageId: 112, ViewsCount: 25000, DownloadCount: 6500, LikesCount: 4500 },
    ];
    let currentPage = 1;
    const itemsPerPage = 5;

    // ====> CẬP NHẬT LẠI TÊN ID Ở ĐÂY <====
    const tableBody = document.getElementById("userStats-table-body");
    const pageInfo = document.getElementById("userStats-page-info");
    const prevPageBtn = document.getElementById("userStats-prev-page-btn");
    const nextPageBtn = document.getElementById("userStats-next-page-btn");
    const totalViewsEl = document.getElementById("userStats-total-views");
    const totalDownloadsEl = document.getElementById("userStats-total-downloads");
    const totalLikesEl = document.getElementById("userStats-total-likes");
    const exitBtn = document.getElementById("userStats-exit-btn");

    // --- CÁC HÀM XỬ LÝ ---
    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

    function render() {
        const totalPages = Math.ceil(mockStatsData.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentStats = mockStatsData.slice(start, end);

        tableBody.innerHTML = '';
        currentStats.forEach(item => {
            // ====> CẬP NHẬT LẠI TÊN CLASS Ở ĐÂY <====
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="userStats-mobile-label">ID Ảnh:</span>
                    <span class="userStats-cell-content">#${item.ImageId}</span>
                </td>
                <td>
                    <span class="userStats-mobile-label">Lượt xem:</span>
                    <div class="userStats-cell-content">
                        <i data-lucide="eye" style="color: #3b82f6;"></i>
                        <span>${formatNumber(item.ViewsCount)}</span>
                    </div>
                </td>
                <td>
                    <span class="userStats-mobile-label">Lượt tải xuống:</span>
                    <div class="userStats-cell-content">
                        <i data-lucide="download" style="color: #22c55e;"></i>
                        <span>${formatNumber(item.DownloadCount)}</span>
                    </div>
                </td>
                <td>
                    <span class="userStats-mobile-label">Lượt thích:</span>
                    <div class="userStats-cell-content">
                        <i data-lucide="heart" style="color: #ef4444;"></i>
                        <span>${formatNumber(item.LikesCount)}</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        pageInfo.textContent = `Trang ${currentPage} trên ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        totalViewsEl.textContent = formatNumber(mockStatsData.reduce((acc, curr) => acc + curr.ViewsCount, 0));
        totalDownloadsEl.textContent = formatNumber(mockStatsData.reduce((acc, curr) => acc + curr.DownloadCount, 0));
        totalLikesEl.textContent = formatNumber(mockStatsData.reduce((acc, curr) => acc + curr.LikesCount, 0));

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // --- GÁN SỰ KIỆN ---
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(mockStatsData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    exitBtn.addEventListener('click', () => {
        window.location.href = "/";
    });

    // --- KHỞI TẠO ---
    render();
});