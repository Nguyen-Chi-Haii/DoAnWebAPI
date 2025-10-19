// File: wwwroot/js/AdminApproval.js
document.addEventListener('DOMContentLoaded', function () {
    // ======= BIẾN TRẠNG THÁI =======
    let currentPage = 1;
    let filters = { search: "" };
    const imagesPerPage = 9;
    const userCache = {};
    let sortOrder = "desc"; // ✅ Thêm: Mặc định là mới nhất
    let currentTotalPages = 1; // Lưu tổng số trang

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const imageListContainer = document.getElementById('image-list-container');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select'); // ✅ Thêm
    const noResults = document.getElementById('no-results');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const loadingSpinner = document.getElementById('loading-spinner');
    // Popup elements (Giữ nguyên)
    const imagePopup = document.getElementById('image-popup');
    const closePopupBtn = document.getElementById('close-popup-btn');
    const popupImage = document.getElementById('popup-image');
    const popupTitle = document.getElementById('popup-title');
    const popupDescription = document.getElementById('popup-description');
    const popupUploader = document.getElementById('popup-uploader');
    const popupUploadedAt = document.getElementById('popup-uploadedAt');
    const popupApproveBtn = document.getElementById('popup-approve-btn');
    const popupRejectBtn = document.getElementById('popup-reject-btn');

    // ======= HÀM SPINNER (Giữ nguyên) =======
    function showSpinner() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        imageListContainer.innerHTML = '';
        noResults.classList.add('hidden');
    }
    function hideSpinner() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }

    // ======= HÀM LẤY TÊN USER (Giữ nguyên) =======
    async function getUserName(userId) {
        // ... (Giữ nguyên logic cache và gọi API)
        if (!userId) return "N/A";
        if (userCache[userId]) {
            return userCache[userId];
        }
        try {
            const user = await api.users.getById(userId);
            const userName = user.username || `User ${userId}`;
            userCache[userId] = userName;
            return userName;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            userCache[userId] = `User ${userId}`; // Cache fallback
            return `User ${userId}`;
        }
    }

    // ======= HÀM RENDER CHÍNH =======
    async function fetchAndRenderData() {
        showSpinner();
        try {
            const filterParams = {
                search: filters.search || undefined, // Gửi undefined nếu rỗng
                page: currentPage,
                pageSize: imagesPerPage,
                status: "pending", // Luôn lấy ảnh pending
                sortBy: "date", // ✅ Luôn sắp xếp theo ngày
                sortDirection: sortOrder // ✅ Sử dụng state sortOrder
            };

            // Gọi API với tham số filter và sort
            const pagedResult = await api.images.getAll(filterParams);

            const images = pagedResult.items;
            currentTotalPages = pagedResult.totalPages || 1; // Cập nhật tổng số trang

            imageListContainer.innerHTML = ''; // Xóa spinner/nội dung cũ

            if (!images || images.length === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
                // Tạo card ảnh song song
                const imageCardPromises = images.map(img => createImageCard(img));
                const imageCardElements = await Promise.all(imageCardPromises);
                imageCardElements.forEach(el => imageListContainer.appendChild(el));
                // Re-initialize icons if using Lucide
                if (window.lucide) {
                    lucide.createIcons();
                }
            }

            // Cập nhật phân trang
            updatePagination(pagedResult.page, currentTotalPages);

        } catch (error) {
            console.error("Lỗi khi tải ảnh chờ duyệt:", error);
            noResults.textContent = `Lỗi: ${error.message}`;
            noResults.classList.remove('hidden');
            noResults.classList.add('text-red-500'); // Thêm màu đỏ cho lỗi
        } finally {
            hideSpinner();
        }
    }

    // ======= HÀM TẠO CARD ẢNH =======
    async function createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'admin-card relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow';
        card.dataset.id = image.id; // Lưu ID để mở popup

        const userName = await getUserName(image.userId);

        card.innerHTML = `
            <img src="${image.thumbnailUrl || '/img/placeholder-image.png'}" alt="${image.title || 'Pending Image'}"
                 class="w-full h-48 object-cover cursor-pointer group-hover:opacity-80 transition-opacity" loading="lazy">
            <div class="p-4">
                <p class="text-sm font-semibold text-gray-800 truncate mb-1" title="${image.title || ''}">${image.title || '(Chưa có tiêu đề)'}</p>
                <p class="text-xs text-gray-500 mb-3">
                    Bởi: <span class="font-medium text-blue-600">${userName}</span>
                    vào ${new Date(image.createdAt).toLocaleDateString('vi-VN')}
                </p>
                <div class="flex justify-end gap-2">
                    <button class="reject-btn p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-xs font-medium flex items-center gap-1" data-id="${image.id}" title="Từ chối ảnh ${image.id}">
                        <i data-lucide="x" class="w-4 h-4"></i> Từ chối
                    </button>
                    <button class="approve-btn p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-xs font-medium flex items-center gap-1" data-id="${image.id}" title="Duyệt ảnh ${image.id}">
                         <i data-lucide="check" class="w-4 h-4"></i> Duyệt
                    </button>
                </div>
            </div>
             <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex justify-center items-center cursor-pointer view-details-overlay">
                 <span class="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Xem chi tiết</span>
            </div>
        `;
        return card;
    }

    // ======= HÀM CẬP NHẬT PHÂN TRANG (Giữ nguyên) =======
    function updatePagination(currentPageNum, totalPagesNum) {
        pageInfo.innerHTML = `Trang <b>${currentPageNum}</b> / ${totalPagesNum || 1}`;
        prevPageBtn.disabled = (currentPageNum <= 1);
        nextPageBtn.disabled = (currentPageNum >= totalPagesNum);
    }

    // ======= HÀM XỬ LÝ POPUP (Giữ nguyên) =======
    async function openImagePopup(imageId) {
        try {
            // Fetch image details including user info
            const image = await api.images.getById(imageId); // Assume API returns full details
            const uploaderName = await getUserName(image.userId);

            if (!image || !imagePopup) return;

            popupTitle.textContent = image.title || "(Chưa có tiêu đề)";
            popupImage.src = image.fileUrl || '/img/placeholder-image.png'; // Use full URL
            popupImage.alt = image.title || "Chi tiết ảnh";
            popupDescription.textContent = image.description || "(Không có mô tả)";
            popupUploader.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i> Người đăng: <span class="font-medium text-blue-600 ml-1">${uploaderName}</span>`;
            popupUploadedAt.innerHTML = `<i data-lucide="calendar" class="w-4 h-4"></i> Ngày đăng: <span class="font-medium ml-1">${new Date(image.createdAt).toLocaleString('vi-VN')}</span>`;

            // Store imageId in buttons for approve/reject actions
            popupApproveBtn.dataset.id = image.id;
            popupRejectBtn.dataset.id = image.id;

            if (window.lucide) lucide.createIcons(); // Redraw icons inside popup

            imagePopup.classList.remove('hidden');

        } catch (error) {
            console.error("Error opening image popup:", error);
            alert(`Không thể tải chi tiết ảnh: ${error.message}`);
        }
    }

    function closeImagePopup() {
        if (imagePopup) imagePopup.classList.add('hidden');
        // Clear image src to prevent flashing old image
        if (popupImage) popupImage.src = "";
    }


    // ======= HÀM DUYỆT/TỪ CHỐI (Giữ nguyên) =======
    async function handleApprovalAction(button, action) {
        const imageId = button.dataset.id;
        if (!imageId) return;

        const isApprove = action === 'approve';
        const confirmMsg = isApprove
            ? `Bạn có chắc muốn duyệt ảnh ID ${imageId}?`
            : `Bạn có chắc muốn từ chối ảnh ID ${imageId}?`;
        const newStatus = isApprove ? 'Approved' : 'Rejected';

        if (confirm(confirmMsg)) {
            button.disabled = true;
            button.textContent = isApprove ? 'Đang duyệt...' : 'Đang từ chối...';

            try {
                // Gọi API để cập nhật status (Giả sử bạn có endpoint này)
                // Cần endpoint PUT /api/images/{id}/status hoặc dùng Update thông thường
                await api.images.update(imageId, { status: newStatus }); // Dùng Update chung

                alert(`Đã ${isApprove ? 'phê duyệt' : 'từ chối'} ảnh ${imageId}.`);
                closeImagePopup(); // Đóng popup nếu đang mở
                fetchAndRenderData(); // Tải lại danh sách
            } catch (error) {
                console.error(`Lỗi khi ${action} ảnh ${imageId}:`, error);
                alert(`Không thể ${isApprove ? 'phê duyệt' : 'từ chối'} ảnh: ${error.message}`);
                button.disabled = false; // Bật lại nút nếu lỗi
                // Khôi phục text gốc (có thể cần icon)
                button.textContent = isApprove ? 'Phê duyệt' : 'Từ chối';
            }
        }
    }
    // Wrapper functions for clarity
    function handleApprove(button) { handleApprovalAction(button, 'approve'); }
    function handleReject(button) { handleApprovalAction(button, 'reject'); }


    // Hàm debounce cho tìm kiếm (Giữ nguyên)
    let searchTimer;
    function debounceSearch(e) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            filters.search = e.target.value.trim();
            currentPage = 1; // Reset về trang 1 khi tìm kiếm
            fetchAndRenderData();
        }, 500);
    }

    // ======= GẮN SỰ KIỆN =======
    searchInput?.addEventListener('input', debounceSearch);

    // ✅ Thêm sự kiện cho dropdown sắp xếp
    sortSelect?.addEventListener('change', (e) => {
        sortOrder = e.target.value; // Cập nhật state 'desc' hoặc 'asc'
        currentPage = 1; // Reset về trang 1
        fetchAndRenderData(); // Tải lại dữ liệu với thứ tự mới
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndRenderData();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        // Chỉ tăng trang nếu chưa phải trang cuối
        if (currentPage < currentTotalPages) {
            currentPage++;
            fetchAndRenderData();
        }
    });

    // Event delegation cho các nút và overlay xem chi tiết
    imageListContainer.addEventListener('click', (e) => {
        const approveBtn = e.target.closest('.approve-btn');
        const rejectBtn = e.target.closest('.reject-btn');
        const viewDetailsOverlay = e.target.closest('.view-details-overlay');
        const imageInCard = e.target.closest('img'); // Click vào ảnh cũng mở popup

        if (approveBtn) {
            e.stopPropagation();
            handleApprove(approveBtn);
        } else if (rejectBtn) {
            e.stopPropagation();
            handleReject(rejectBtn);
        } else if (viewDetailsOverlay || imageInCard) {
            const card = e.target.closest('.admin-card');
            if (card && card.dataset.id) {
                openImagePopup(card.dataset.id);
            }
        }
    });

    // Sự kiện cho nút đóng popup và các nút trong popup
    closePopupBtn?.addEventListener('click', closeImagePopup);
    popupApproveBtn?.addEventListener('click', (e) => handleApprove(e.currentTarget));
    popupRejectBtn?.addEventListener('click', (e) => handleReject(e.currentTarget));
    // Đóng popup khi click ra ngoài (optional but good UX)
    imagePopup?.addEventListener('click', (e) => {
        // If the click is directly on the backdrop (the popup element itself)
        if (e.target === imagePopup) {
            closeImagePopup();
        }
    });


    // ======= KHỞI CHẠY =======
    if (typeof api !== 'undefined' && api.images && api.users) {
        fetchAndRenderData(); // Tải dữ liệu lần đầu
    } else {
        console.error("API service is not available.");
        noResults.textContent = 'Lỗi: Không thể khởi tạo dịch vụ API.';
        noResults.classList.remove('hidden');
        noResults.classList.add('text-red-500');
    }
});