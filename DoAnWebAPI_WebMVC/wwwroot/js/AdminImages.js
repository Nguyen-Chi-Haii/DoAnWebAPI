document.addEventListener('DOMContentLoaded', function () {
    // ======= BIẾN TRẠNG THÁI =======
    let allImages = [];
    let currentPage = 1;
    let searchTerm = "";
    let filters = { topic: "Tất cả", tag: "", date: "" };
    const imagesPerPage = 10;
    const userCache = {};

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const imageListContainer = document.getElementById('image-list-container');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const filterPopup = document.getElementById('filter-popup');
    const filterButton = document.getElementById('filter-button');
    const closeFilterPopupBtn = document.getElementById('close-filter-popup');
    const topicFilterSelect = document.getElementById('topic-filter-select');
    const tagFilterInput = document.getElementById('tag-filter-input');
    const dateFilterInput = document.getElementById('date-filter-input');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');

    // ======= HÀM RENDER CHÍNH (ĐÃ CẬP NHẬT THEO API THẬT) =======
    async function render() {
        // Logic lọc không thay đổi
        const filteredImages = allImages.filter(img => {
            const uploadedDate = img.uploadedAt ? img.uploadedAt.split('T')[0] : '';
            const matchSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchTopic = filters.topic === "Tất cả" || (img.topics && img.topics.some(t => t.name === filters.topic));
            const matchTag = !filters.tag || (img.tags && img.tags.some(t => t.name.toLowerCase().includes(filters.tag.toLowerCase())));
            const matchDate = !filters.date || uploadedDate === filters.date;
            return matchSearch && matchTopic && matchTag && matchDate;
        });

        const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

        const displayedImages = filteredImages.slice(
            (currentPage - 1) * imagesPerPage,
            currentPage * imagesPerPage
        );

        imageListContainer.innerHTML = '';
        if (displayedImages.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');

            // Tạo một mảng các "lời hứa" sẽ trả về HTML của mỗi card ảnh
            const imageCardPromises = displayedImages.map(async (img) => {
                let userName = `User ID: ${img.userId}`; // Tên mặc định nếu có lỗi

                try {
                    // 1. Kiểm tra trong cache trước
                    if (userCache[img.userId]) {
                        userName = userCache[img.userId];
                    } else {
                        // 2. Nếu không có, gọi API
                        const user = await api.users.getById(img.userId);
                        // Giả sử API trả về { "userName": "ten_nguoi_dung" }
                        // **QUAN TRỌNG**: Thay 'user.userName' cho khớp với dữ liệu API của bạn
                        userName = user.userName;
                        // 3. Lưu vào cache cho lần sau
                        userCache[img.userId] = userName;
                    }
                } catch (error) {
                    console.error(`Không thể lấy tên cho user ID ${img.userId}:`, error);
                }

                const topicName = img.topics && img.topics.length > 0 ? img.topics[0].name : 'N/A';
                const tagNames = img.tags && img.tags.length > 0 ? img.tags.map(t => t.name).join(', ') : 'N/A';
                const uploadedDateDisplay = img.uploadedAt ? new Date(img.uploadedAt).toLocaleDateString() : 'N/A';

                // Trả về chuỗi HTML hoàn chỉnh cho card này
                return `
                    <div class="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition group">
                        <img src="${img.fileUrl}" alt="${img.title}" class="w-full sm:w-40 h-52 sm:h-28 object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-t-none bg-gray-100" />
                        <div class="flex flex-col flex-grow p-4">
                            <h3 class="font-semibold text-lg group-hover:text-blue-600">${img.title}</h3>
                            <p class="text-gray-600 text-sm line-clamp-2">${img.description}</p>
                            <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                                <span class="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
                                    ${userName}
                                </span>
                                <span class="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                                    ${uploadedDateDisplay}
                                </span>
                                <span>🎯 ${topicName}</span>
                                <span>🏷️ ${tagNames}</span>
                            </div>
                        </div>
                        <div class="flex sm:flex-col items-center justify-center gap-2 p-3 sm:pr-4 border-t sm:border-t-0 sm:border-l border-gray-100">
                            <button data-id="${img.id}" class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition">Sửa</button>
                            <button data-id="${img.id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition">Xóa</button>
                        </div>
                    </div>`;
            });

            // Đợi tất cả các "lời hứa" hoàn thành
            const imageCardHTMLs = await Promise.all(imageCardPromises);
            // Nối tất cả HTML lại và gán vào container
            imageListContainer.innerHTML = imageCardHTMLs.join('');
        }

        pageInfo.innerHTML = `Trang <b>${currentPage}</b> / ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // ======= HÀM LẤY DỮ LIỆU TỪ API VÀ RENDER =======
    async function fetchAndRenderImages() {
        try {
            imageListContainer.innerHTML = '<p class="text-center text-gray-500">Đang tải dữ liệu...</p>';

            // Cả hai lệnh gọi này đều có thể gây lỗi
            const images = await api.images.getAll();
            allImages = images;
            await render(); // Phải có 'await' ở đây để bắt lỗi từ hàm render

        } catch (error) {
            console.error('Đã xảy ra lỗi trong quá trình tải dữ liệu:', error);

            // KIỂM TRA XEM CÓ PHẢI LỖI XÁC THỰC KHÔNG
            if (error.message === "Unauthorized") {
                // Chỉ thông báo và chuyển hướng MỘT LẦN DUY NHẤT
                alert("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
                window.location.href = '/Account/Login'; // ⚠️ Điều chỉnh URL trang đăng nhập nếu cần
            } else {
                // Hiển thị các lỗi khác (như lỗi 500) cho người dùng
                imageListContainer.innerHTML = `<p class="text-center text-red-500">Không thể tải dữ liệu. Lỗi: ${error.message}</p>`;
            }
        }
    }


    // ======= HÀM XỬ LÝ POPUP =======
    function showFilterPopup() {
        topicFilterSelect.value = filters.topic;
        tagFilterInput.value = filters.tag;
        dateFilterInput.value = filters.date;
        filterPopup.classList.remove('hidden');
    }

    function hideFilterPopup() { filterPopup.classList.add('hidden'); }

    function applyFilters() {
        filters.topic = topicFilterSelect.value;
        filters.tag = tagFilterInput.value;
        filters.date = dateFilterInput.value;
        currentPage = 1;
        render();
        hideFilterPopup();
    }

    function clearFilters() {
        filters = { topic: "Tất cả", tag: "", date: "" };
        currentPage = 1;
        render();
        hideFilterPopup();
    }

    // ======= GẮN SỰ KIỆN =======
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        currentPage = 1;
        render();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        render();
    });

    filterButton.addEventListener('click', showFilterPopup);
    closeFilterPopupBtn.addEventListener('click', hideFilterPopup);
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    imageListContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            e.stopPropagation();
            alert(`✏️ Sửa thông tin ảnh ID: ${editBtn.dataset.id}`);
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            if (confirm(`Bạn có chắc muốn xóa ảnh ID ${deleteBtn.dataset.id}?`)) {
                alert(`🗑️ Ảnh ID ${deleteBtn.dataset.id} đã bị xóa.`);
            }
        }
    });

    // ======= TẢI DỮ LIỆU LẦN ĐẦU TIÊN =======
    fetchAndRenderImages();
});