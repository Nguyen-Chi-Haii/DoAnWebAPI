 // File: wwwroot/js/userStats.js

document.addEventListener("DOMContentLoaded", () => {
    // Lấy các phần tử DOM cần thiết từ CSHTML
    const tableBody = document.getElementById('userStats-table-body');
    const prevPageBtn = document.getElementById('userStats-prev-page-btn');
    const nextPageBtn = document.getElementById('userStats-next-page-btn');
    const pageInfoSpan = document.getElementById('userStats-page-info');
    const totalViewsSpan = document.getElementById('userStats-total-views');
    const totalDownloadsSpan = document.getElementById('userStats-total-downloads');
    const totalLikesSpan = document.getElementById('userStats-total-likes');
    const exitBtn = document.getElementById('userStats-exit-btn');

    // Kiểm tra các phần tử có tồn tại không
    if (!tableBody || !prevPageBtn || !nextPageBtn || !pageInfoSpan || !exitBtn) {
        console.error("Lỗi: Thiếu một hoặc nhiều phần tử HTML cần thiết cho trang thống kê.");
        return;
    }

    // Cấu hình và trạng thái cho phân trang
    let allStatsData = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 10; // Số mục hiển thị trên mỗi trang

    /**
     * Hàm helper để giải mã JWT token và lấy payload.
     */
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Lỗi giải mã token:", e);
            return null;
        }
    }

    /**
     * Hàm render bảng, phân trang, và tóm tắt dựa trên dữ liệu và trang hiện tại.
     */
    function renderPage() {
        // Xóa nội dung cũ trong bảng
        tableBody.innerHTML = '';

        // Tính toán tổng số trang
        const totalPages = Math.ceil(allStatsData.length / ITEMS_PER_PAGE);
        if (totalPages === 0) {
            pageInfoSpan.textContent = 'Không có dữ liệu';
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            return;
        }

        // Cập nhật thông tin trang
        pageInfoSpan.textContent = `Trang ${currentPage} / ${totalPages}`;

        // Bật/tắt nút phân trang
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Lấy dữ liệu cho trang hiện tại
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = allStatsData.slice(startIndex, endIndex);

        // Tạo và chèn các hàng vào bảng
        pageData.forEach(item => {
            const row = document.createElement('tr');
            // SỬA LỖI: Dùng đúng tên thuộc tính là "thumbnailUrl"
            row.innerHTML = `
                <td class="userStats-table-cell">
                    <div class="userStats-image-info">
                         <img src="${item.image.thumbnailUrl}" 
                              alt="${item.image.title}" 
                              class="userStats-thumbnail" />
                         <span>${item.image.title}</span>
                    </div>
                </td>
                <td class="userStats-table-cell">${item.stats.viewsCount || 0}</td>
                <td class="userStats-table-cell">${item.stats.downloadCount || 0}</td>
                <td class="userStats-table-cell">${item.stats.likesCount || 0}</td>
            `;

            tableBody.appendChild(row);
        });
    }

    /**
     * Hàm tính toán và hiển thị tổng số liệu thống kê.
     */
    function renderSummary() {
        const totals = allStatsData.reduce((acc, item) => {
            acc.views += item.stats.viewsCount || 0;
            acc.downloads += item.stats.downloadCount || 0;
            acc.likes += item.stats.likesCount || 0;
            return acc;
        }, { views: 0, downloads: 0, likes: 0 });

        totalViewsSpan.textContent = totals.views.toLocaleString();
        totalDownloadsSpan.textContent = totals.downloads.toLocaleString();
        totalLikesSpan.textContent = totals.likes.toLocaleString();
    }


    /**
     * Hàm chính để tải và hiển thị toàn bộ thống kê.
     */
    async function loadUserStats() {
        tableBody.innerHTML = '<tr><td colspan="4" class="userStats-loading-cell">Đang tải thống kê của bạn...</td></tr>';

        // Lấy token và userId từ localStorage
        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            tableBody.innerHTML = '<tr><td colspan="4" class="userStats-error-cell">Lỗi: Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.</td></tr>';
            return;
        }

        try {
            // 1. Lấy tất cả ảnh của người dùng
            const userImages = await api.images.getByUser(userId);

            if (userImages.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="userStats-loading-cell">Bạn chưa đăng tải hình ảnh nào.</td></tr>';
                renderPage();
                return;
            }

            // 2. Lấy thống kê cho từng ảnh
            const statPromises = userImages.map(image =>
                api.stats.get(image.id).then(stats => ({ image, stats }))
            );

            // 3. Chờ tất cả API hoàn thành
            allStatsData = await Promise.all(statPromises);

            renderPage();
            renderSummary();

        } catch (error) {
            console.error("Lỗi khi tải thống kê:", error);
            tableBody.innerHTML = `<tr><td colspan="4" class="userStats-error-cell">Đã xảy ra lỗi: ${error.message}</td></tr>`;
        }
    }


    // Gán sự kiện cho các nút
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allStatsData.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });

    exitBtn.addEventListener('click', () => {
        // Quay lại trang trước đó trong lịch sử trình duyệt
        window.history.back();
    });

    // Bắt đầu quá trình tải dữ liệu
    loadUserStats();

    // Gọi lại lucide để render icon sau khi thêm các phần tử động
    if (window.lucide) {
        lucide.createIcons();
    }
});