// File: wwwroot/js/AdminApproval.js
document.addEventListener('DOMContentLoaded', function () {
    // ======= BIẾN TRẠNG THÁI =======
    let currentPage = 1;
    let filters = { search: "" }; // Chỉ cần tìm kiếm cơ bản
    const imagesPerPage = 9; // Có thể điều chỉnh số lượng mỗi trang
    const userCache = {}; // Cache tên user

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const imageListContainer = document.getElementById('image-list-container');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const loadingSpinner = document.getElementById('loading-spinner');

    // ======= HÀM SPINNER =======
    function showSpinner() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        imageListContainer.innerHTML = '';
        noResults.classList.add('hidden');
    }

    function hideSpinner() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }

    // ======= HÀM RENDER CHÍNH =======
    async function fetchAndRenderData() {
        showSpinner();
        try {
            const filterParams = {
                search: filters.search || "",
                page: currentPage,
                pageSize: imagesPerPage,
                status: "pending" // ✅ CHỈ LẤY ẢNH PENDING
            };

            const pagedResult = await api.images.getAll(filterParams); // Gọi API cũ nhưng với status=pending
            const images = pagedResult.items;
            imageListContainer.innerHTML = ''; // Xóa spinner

            if (!images || images.length === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
                // Dùng Promise.all để tải tên user
                const imageCardPromises = images.map(img => createApprovalCard(img));
                const imageCardElements = await Promise.all(imageCardPromises);
                imageCardElements.forEach(el => imageListContainer.appendChild(el));
                if (window.lucide) lucide.createIcons(); // Cập nhật icons
            }
            updatePagination(pagedResult);

        } catch (error) {
            console.error("Lỗi khi tải ảnh chờ duyệt:", error);
            hideSpinner();
            if (error.message !== "Unauthorized") {
                imageListContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Không thể tải dữ liệu. ${error.message}</p>`;
            }
        } finally {
            // Đảm bảo spinner luôn ẩn sau khi xong (trừ khi lỗi đã ẩn)
            if (loadingSpinner && !loadingSpinner.classList.contains('hidden')) {
                hideSpinner();
            }
        }
    }

    // ======= HÀM HỖ TRỢ =======
    async function getUserName(userId) {
        // (Giữ nguyên hàm getUserName từ AdminImages.js)
        if (!userId) return "N/A";
        if (userCache[userId]) return userCache[userId];
        try {
            const user = await api.users.getById(userId);
            const userName = user.userName || `User ${userId}`;
            userCache[userId] = userName;
            return userName;
        } catch (error) {
            console.error(`Lỗi lấy user ${userId}:`, error);
            userCache[userId] = `User ${userId}`;
            return `User ${userId}`;
        }
    }

    // ✅ HÀM TẠO CARD DUYỆT ẢNH MỚI
    async function createApprovalCard(image) {
        const div = document.createElement('div');
        // Thêm data-id vào card chính để dễ lấy khi xử lý nút
        div.className = 'approval-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col border border-gray-200';
        div.dataset.id = image.id; // Lưu ID ảnh vào card

        const userName = await getUserName(image.userId);

        div.innerHTML = `
            <div class="relative group">
                <img src="${image.thumbnailUrl || image.fileUrl || '/img/placeholder-image.png'}"
                     alt="${image.title || 'Ảnh chờ duyệt'}"
                     class="w-full h-48 object-cover bg-gray-100">
                 </div>
            <div class="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <p class="font-semibold text-gray-800 truncate mb-1" title="${image.title || ''}">${image.title || '(Chưa có tiêu đề)'}</p>
                    <p class="text-xs text-gray-500 mb-1">
                        Người đăng: <span class="font-medium text-blue-600">${userName}</span>
                    </p>
                    <p class="text-xs text-gray-500 mb-3">
                        Ngày đăng: <span class="font-medium">${new Date(image.createdAt).toLocaleDateString('vi-VN')}</span>
                    </p>
                    <p class="text-sm text-gray-600 line-clamp-2 mb-3">${image.description || 'Không có mô tả.'}</p>
                </div>
                 <div class="flex justify-end gap-2 mt-auto pt-3 border-t border-gray-100">
                    <button class="reject-btn text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition flex items-center gap-1" data-id="${image.id}">
                        <i data-lucide="x" class="w-4 h-4"></i> Từ chối
                    </button>
                    <button class="approve-btn text-sm font-medium text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md transition flex items-center gap-1" data-id="${image.id}">
                        <i data-lucide="check" class="w-4 h-4"></i> Duyệt
                    </button>
                </div>
            </div>
        `;
        return div;
    }

    // (Hàm updatePagination giữ nguyên từ AdminImages.js)
    function updatePagination(pagedResult) {
        if (!pagedResult) return;
        pageInfo.innerHTML = `Trang <b>${pagedResult.page}</b> / ${pagedResult.totalPages || 1}`;
        prevPageBtn.disabled = (pagedResult.page <= 1);
        nextPageBtn.disabled = (pagedResult.page >= pagedResult.totalPages);
        currentPage = pagedResult.page;
    }

    // ======= HÀM XỬ LÝ SỰ KIỆN =======

    // Hàm xử lý khi bấm nút "Duyệt"
    async function handleApprove(button) {
        const imageId = button.dataset.id;
        if (!imageId) {
            alert("Không tìm thấy ID ảnh để duyệt.");
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1"></i> Đang duyệt...';
        if (window.lucide) lucide.createIcons();

        try {
            // 🔹 1. Lấy thông tin gốc của ảnh từ API
            const imageData = await api.images.getById(imageId);

            // 🔹 2. Tạo object mới, giữ nguyên toàn bộ dữ liệu gốc
            const updatedData = {
                Title: imageData.title,
                Description: imageData.description,
                IsPublic: imageData.isPublic,
                Status: "approved", // ✅ Chỉ thay đổi trạng thái
                TagIds: imageData.tags ? imageData.tags.map(t => t.id) : [],
                TopicIds: imageData.topics ? imageData.topics.map(t => t.id) : []
            };

            // 🔹 3. Gọi API cập nhật
            await api.images.update(imageId, updatedData);

            alert(`✅ Ảnh ID ${imageId} đã được duyệt thành công!`);

            // 🔹 4. Xử lý UI sau khi duyệt
            const card = button.closest('.approval-card');
            if (card) {
                card.remove();
                if (!imageListContainer.hasChildNodes()) {
                    noResults.classList.remove('hidden');
                }
            } else {
                fetchAndRenderData(); // fallback nếu không có card
            }

        } catch (error) {
            console.error(`❌ Lỗi khi duyệt ảnh ${imageId}:`, error);
            alert(`Duyệt ảnh thất bại: ${error.message}`);
            button.disabled = false;
            button.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Duyệt';
            if (window.lucide) lucide.createIcons();
        }
    }


    // Hàm xử lý khi bấm nút "Từ chối" (Xóa ảnh)
    async function handleReject(button) {
        const imageId = button.dataset.id;
        if (!imageId) return;

        if (confirm(`Bạn có chắc muốn TỪ CHỐI (xóa) ảnh ID ${imageId} không? Hành động này không thể hoàn tác.`)) {
            button.disabled = true; // Vô hiệu hóa nút
            button.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1"></i> Đang xóa...';
            if (window.lucide) lucide.createIcons();

            try {
                // Gọi API xóa ảnh
                await api.images.delete(imageId); //
                alert(`Đã từ chối (xóa) thành công ảnh ID ${imageId}.`);
                // Xóa card khỏi giao diện hoặc tải lại trang hiện tại
                const card = button.closest('.approval-card');
                if (card) {
                    card.remove(); // Xóa ngay lập tức
                    // Kiểm tra nếu container rỗng sau khi xóa
                    if (!imageListContainer.hasChildNodes()) {
                        noResults.classList.remove('hidden');
                    }
                } else {
                    fetchAndRenderData(); // Hoặc tải lại nếu không tìm thấy card
                }

            } catch (error) {
                console.error(`Lỗi khi từ chối ảnh ${imageId}:`, error);
                alert(`Từ chối ảnh thất bại: ${error.message}`);
                // Kích hoạt lại nút nếu lỗi
                button.disabled = false;
                button.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i> Từ chối';
                if (window.lucide) lucide.createIcons();
            }
        }
    }

    // Hàm debounce cho tìm kiếm (giữ nguyên)
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
    searchInput?.addEventListener('input', debounceSearch); // Thêm ? để tránh lỗi nếu không có ô search

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndRenderData();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        // Chỉ tăng trang, hàm fetchAndRenderData sẽ kiểm tra totalPages
        currentPage++;
        fetchAndRenderData();
    });

    // Event delegation cho các nút trong danh sách ảnh
    imageListContainer.addEventListener('click', (e) => {
        const approveBtn = e.target.closest('.approve-btn');
        const rejectBtn = e.target.closest('.reject-btn');

        if (approveBtn) {
            e.stopPropagation();
            handleApprove(approveBtn);
        } else if (rejectBtn) {
            e.stopPropagation();
            handleReject(rejectBtn);
        }
        // Có thể thêm xử lý click vào card để mở popup chi tiết sau
    });

    // ======= KHỞI CHẠY =======
    fetchAndRenderData(); // Tải dữ liệu ban đầu
});