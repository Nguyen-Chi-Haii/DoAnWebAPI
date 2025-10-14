document.addEventListener('DOMContentLoaded', function () {
    // ======= DỮ LIỆU GIẢ LẬP =======
    const mockImages = Array.from({ length: 26 }, (_, i) => ({
        id: i + 1,
        title: `Ảnh Phong Cảnh #${i + 1}`,
        description: `Mô tả chi tiết cho ảnh phong cảnh núi rừng hùng vĩ ${i + 1}.`,
        uploader: `user_${100 + i}`,
        uploadedAt: `2025-10-0${(i % 9) + 1}`,
        topic: ["Thiên nhiên", "Động vật", "Kiến trúc"][i % 3],
        tag: ["Phong cảnh", "Chân dung", "Hoàng hôn"][i % 3],
        url: `https://picsum.photos/500/300?random=${200 + i}`,
    }));

    // ======= BIẾN TRẠNG THÁI (Đã bổ sung 'filters') =======
    let currentPage = 1;
    let searchTerm = "";
    let filters = { topic: "Tất cả", tag: "", date: "" };
    const imagesPerPage = 10;

    // ======= LẤY CÁC PHẦN TỬ DOM (Đã bổ sung đầy đủ) =======
    const imageListContainer = document.getElementById('image-list-container');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // DOM cho Popup
    const filterPopup = document.getElementById('filter-popup');
    const filterButton = document.getElementById('filter-button');
    const closeFilterPopupBtn = document.getElementById('close-filter-popup');
    const topicFilterSelect = document.getElementById('topic-filter-select');
    const tagFilterInput = document.getElementById('tag-filter-input');
    const dateFilterInput = document.getElementById('date-filter-input');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        const filteredImages = mockImages.filter(img => {
            const matchSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchTopic = filters.topic === "Tất cả" || img.topic === filters.topic;
            const matchTag = !filters.tag || img.tag.toLowerCase().includes(filters.tag.toLowerCase());
            const matchDate = !filters.date || img.uploadedAt === filters.date;
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
            displayedImages.forEach(img => {
                const imageCard = document.createElement('div');
                imageCard.className = "flex flex-col sm:flex-row bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition group";
                imageCard.innerHTML = `
                    <img src="${img.url}" alt="${img.title}" class="w-full sm:w-40 h-52 sm:h-28 object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-t-none bg-gray-100" />
                    <div class="flex flex-col flex-grow p-4">
                        <h3 class="font-semibold text-lg group-hover:text-blue-600">${img.title}</h3>
                        <p class="text-gray-600 text-sm line-clamp-2">${img.description}</p>
                        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                            <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
                                ${img.uploader}
                            </span>
                            <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                                ${img.uploadedAt}
                            </span>
                            <span>🎯 ${img.topic}</span>
                            <span>🏷️ ${img.tag}</span>
                        </div>
                    </div>
                    <div class="flex sm:flex-col items-center justify-center gap-2 p-3 sm:pr-4 border-t sm:border-t-0 sm:border-l border-gray-100">
                        <button data-id="${img.id}" class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 20h9m-6.5-6.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4l12.5-12.5z"/></svg> Sửa
                        </button>
                        <button data-id="${img.id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6"/></svg> Xóa
                        </button>
                    </div>`;
                imageListContainer.appendChild(imageCard);
            });
        }

        pageInfo.innerHTML = `Trang <b>${currentPage}</b> / ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
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

    // THAY THẾ TOÀN BỘ SỰ KIỆN DƯỚI ĐÂY
    nextPageBtn.addEventListener('click', () => {
        // Tính lại totalPages một cách chính xác bằng cách áp dụng TẤT CẢ bộ lọc
        const filteredImages = mockImages.filter(img => {
            const matchSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchTopic = filters.topic === "Tất cả" || img.topic === filters.topic;
            const matchTag = !filters.tag || img.tag.toLowerCase().includes(filters.tag.toLowerCase());
            const matchDate = !filters.date || img.uploadedAt === filters.date;
            return matchSearch && matchTopic && matchTag && matchDate;
        });

        const totalPages = Math.ceil(filteredImages.length / imagesPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    // Sự kiện cho popup
    filterButton.addEventListener('click', showFilterPopup);
    closeFilterPopupBtn.addEventListener('click', hideFilterPopup);
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Sự kiện cho nút Sửa/Xóa (dùng event delegation)
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

    // Lần render đầu tiên khi tải trang
    render();
});