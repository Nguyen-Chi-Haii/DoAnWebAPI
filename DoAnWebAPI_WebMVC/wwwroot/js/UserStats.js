// File: wwwroot/js/UserStats.js

document.addEventListener("DOMContentLoaded", () => {
    // Lấy các phần tử DOM
    const tableBody = document.getElementById('userStats-table-body');
    const loader = document.getElementById('userStats-loader');
    const prevPageBtn = document.getElementById('userStats-prev-page-btn');
    const nextPageBtn = document.getElementById('userStats-next-page-btn');
    const pageInfoSpan = document.getElementById('userStats-page-info');
    const totalViewsSpan = document.getElementById('userStats-total-views');
    const totalDownloadsSpan = document.getElementById('userStats-total-downloads');
    const totalLikesSpan = document.getElementById('userStats-total-likes');
    const exitBtn = document.getElementById('userStats-exit-btn');

    if (!tableBody || !loader || !prevPageBtn || !nextPageBtn || !pageInfoSpan || !exitBtn) {
        console.error("Lỗi: Thiếu một hoặc nhiều phần tử HTML cần thiết.");
        return;
    }

    // Biến trạng thái
    let allImageData = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 5; // Hiển thị 5 ảnh mỗi trang

    // --- HÀM RENDER ---

    /**
     * Hiển thị dữ liệu cho trang hiện tại
     */
    function renderPage() {
        if (allImageData.length === 0) {
            loader.style.display = 'none';
            // Cập nhật lại thông báo cho chính xác
            tableBody.innerHTML = `<tr><td colspan="5" class="userStats-no-data-cell">Bạn chưa có hình ảnh nào được duyệt.</td></tr>`;
            updatePaginationControls();
            return;
        }

        tableBody.innerHTML = ''; // Xóa nội dung cũ
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageItems = allImageData.slice(startIndex, endIndex);

        pageItems.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="userStats-table-cell">
                    <img src="${data.image.thumbnailUrl}" alt="${data.image.title}" class="userStats-thumbnail"/>
                </td>
                <td class="userStats-table-cell userStats-title-cell">${data.image.title}</td>
                <td class="userStats-table-cell">${data.stats.viewsCount ?? 0}</td>
                <td class="userStats-table-cell">${data.stats.downloadsCount ?? 0}</td>
                <td class="userStats-table-cell">${data.stats.likesCount ?? 0}</td>
            </tr>`;
            tableBody.appendChild(row);
        });

        loader.style.display = 'none';
        updatePaginationControls();
    }

    /**
     * Cập nhật thông tin và trạng thái của các nút phân trang
     */
    function updatePaginationControls() {
        const totalPages = Math.ceil(allImageData.length / ITEMS_PER_PAGE);

        if (totalPages <= 1) {
            prevPageBtn.style.display = 'none';
            nextPageBtn.style.display = 'none';
            pageInfoSpan.style.display = 'none';
            return;
        }

        prevPageBtn.style.display = 'inline-flex';
        nextPageBtn.style.display = 'inline-flex';
        pageInfoSpan.style.display = 'inline-block';

        pageInfoSpan.textContent = `Trang ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    /**
     * Tính toán và hiển thị tóm tắt tổng quan
     */
    function renderSummary() {
        const totalViews = allImageData.reduce((sum, data) => sum + (data.stats.viewsCount ?? 0), 0);
        const totalDownloads = allImageData.reduce((sum, data) => sum + (data.stats.downloadsCount ?? 0), 0);
        const totalLikes = allImageData.reduce((sum, data) => sum + (data.stats.likesCount ?? 0), 0);

        totalViewsSpan.textContent = totalViews;
        totalDownloadsSpan.textContent = totalDownloads;
        totalLikesSpan.textContent = totalLikes;
    }


    // --- HÀM TẢI DỮ LIỆU ---

    /**
     * Hàm chính: Tải tất cả ảnh và thống kê liên quan
     */
    async function loadStats() {
        if (!CURRENT_USER_ID) {
            tableBody.innerHTML = `<tr><td colspan="5" class="userStats-error-cell">Không thể xác định người dùng.</td></tr>`;
            loader.style.display = 'none';
            return;
        }

        try {
            // 1. Lấy tất cả ảnh của người dùng
            const allUserImages = await api.images.getByUser(CURRENT_USER_ID);

            // ✅ THAY ĐỔI DUY NHẤT Ở ĐÂY:
            // Lọc để chỉ giữ lại những ảnh có trạng thái là "approved" (chữ thường)
            const approvedImages = allUserImages.filter(image => image.status.toLowerCase() === 'approved');

            if (!approvedImages || approvedImages.length === 0) {
                renderPage(); // Sẽ hiển thị thông báo "không có ảnh nào"
                return;
            }

            // 2. Tạo một mảng các promise để gọi API lấy thống kê cho mỗi ảnh (chỉ cho ảnh approved)
            const statPromises = approvedImages.map(image =>
                api.stats.get(image.id).then(stats => ({ image, stats }))
            );

            // 3. Chờ tất cả các promise hoàn thành
            allImageData = await Promise.all(statPromises);

            // 4. Sắp xếp ảnh theo lượt xem giảm dần
            allImageData.sort((a, b) => (b.stats.viewsCount ?? 0) - (a.stats.viewsCount ?? 0));

            // 5. Render dữ liệu
            renderPage();
            renderSummary();

        } catch (error) {
            console.error("Lỗi khi tải thống kê:", error);
            loader.style.display = 'none';
            tableBody.innerHTML = `<tr><td colspan="5" class="userStats-error-cell">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.</td></tr>`;
        }
    }

    // --- GÁN SỰ KIỆN ---

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allImageData.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });

    exitBtn.addEventListener('click', () => {
        window.history.back(); // Quay lại trang trước đó
    });

    // --- KHỞI CHẠY ---
    lucide.createIcons();
    loadStats();
});