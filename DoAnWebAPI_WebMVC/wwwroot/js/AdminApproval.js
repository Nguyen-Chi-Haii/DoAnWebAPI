document.addEventListener('DOMContentLoaded', function () {
    // ======= DỮ LIỆU GIẢ LẬP =======
    const mockImages = Array.from({ length: 27 }, (_, i) => ({
        id: i + 1,
        title: `Ảnh chờ duyệt #${i + 1}`,
        description: `Mô tả ngắn cho ảnh ${i + 1}. Đây là ảnh phong cảnh thiên nhiên.`,
        uploader: `user_${100 + i}`,
        uploadedAt: new Date(2025, 9, (i % 9) + 1, 14, (i * 7) % 60), // Dùng đối tượng Date để sắp xếp
        url: `https://picsum.photos/500/300?image=${200 + i}`,
    }));

    // ======= BIẾN TRẠNG THÁI =======
    let currentPage = 1;
    let searchTerm = "";
    let filter = "Mới nhất"; // 'Mới nhất' hoặc 'Cũ nhất'
    const imagesPerPage = 10;

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const imageListContainer = document.getElementById('image-list-container');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const noResults = document.getElementById('no-results');

    // Popup DOMs
    const detailsPopup = document.getElementById('details-popup');
    const closePopupBtn = document.getElementById('close-popup-btn');
    const popupTitle = document.getElementById('popup-title');
    const popupImage = document.getElementById('popup-image');
    const popupDescription = document.getElementById('popup-description');
    const popupUploader = document.getElementById('popup-uploader');
    const popupUploadedAt = document.getElementById('popup-uploadedAt');
    const popupApproveBtn = document.getElementById('popup-approve-btn');
    const popupRejectBtn = document.getElementById('popup-reject-btn');

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        // 1. Lọc và Sắp xếp
        let processedImages = mockImages
            .filter(img => img.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (filter === 'Mới nhất') {
                    return b.uploadedAt - a.uploadedAt;
                } else {
                    return a.uploadedAt - b.uploadedAt;
                }
            });

        // 2. Phân trang
        const totalPages = Math.ceil(processedImages.length / imagesPerPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
        const displayedImages = processedImages.slice(
            (currentPage - 1) * imagesPerPage,
            currentPage * imagesPerPage
        );

        // 3. Render danh sách ảnh
        imageListContainer.innerHTML = '';
        if (displayedImages.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
            displayedImages.forEach(img => {
                const dateString = img.uploadedAt.toLocaleDateString('vi-VN');
                const timeString = img.uploadedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                const card = document.createElement('div');
                card.className = "flex flex-col sm:flex-row bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition group";
                card.dataset.id = img.id;
                card.innerHTML = `
                    <img src="${img.url}" alt="${img.title}" class="w-full sm:w-40 h-52 sm:h-28 object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-t-none bg-gray-100"/>
                    <div class="flex flex-col flex-grow p-4">
                        <h3 class="font-semibold text-lg group-hover:text-blue-600">${img.title}</h3>
                        <p class="text-gray-600 text-sm">${img.description}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${img.uploader}
                            </span>
                            <span class="flex items-center gap-1">
                               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7v5l3 3"/><circle cx="12" cy="12" r="10"/></svg> ${dateString} ${timeString}
                            </span>
                        </div>
                    </div>
                    <div class="flex sm:flex-col items-center justify-center gap-2 p-3 sm:pr-4 border-t sm:border-t-0 sm:border-l border-gray-100">
                        <button data-id="${img.id}" class="approve-btn bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition w-full sm:w-auto justify-center">✅ Duyệt</button>
                        <button data-id="${img.id}" class="reject-btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition w-full sm:w-auto justify-center">❌ Hủy</button>
                    </div>
                `;
                imageListContainer.appendChild(card);
            });
        }

        // 4. Cập nhật phân trang
        pageInfo.innerHTML = `Trang <b>${currentPage}</b> / ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // ======= HÀM XỬ LÝ POPUP =======
    function showDetailsPopup(img) {
        popupTitle.textContent = img.title;
        popupImage.src = img.url;
        popupDescription.textContent = img.description;
        const dateString = img.uploadedAt.toLocaleDateString('vi-VN');
        const timeString = img.uploadedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        popupUploader.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Người tải: <b>${img.uploader}</b>`;
        popupUploadedAt.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7v5l3 3"/><circle cx="12" cy="12" r="10"/></svg> Thời gian: ${dateString} ${timeString}`;

        popupApproveBtn.dataset.id = img.id;
        popupRejectBtn.dataset.id = img.id;

        detailsPopup.classList.remove('hidden');
    }

    function hideDetailsPopup() {
        detailsPopup.classList.add('hidden');
    }

    // ======= GẮN SỰ KIỆN =======
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        currentPage = 1;
        render();
    });

    filterSelect.addEventListener('change', (e) => {
        filter = e.target.value;
        render();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(mockImages.filter(img => img.title.toLowerCase().includes(searchTerm.toLowerCase())).length / imagesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    // Sự kiện cho danh sách (event delegation)
    imageListContainer.addEventListener('click', (e) => {
        const approveBtn = e.target.closest('.approve-btn');
        const rejectBtn = e.target.closest('.reject-btn');
        const card = e.target.closest('.group');

        if (approveBtn) {
            e.stopPropagation();
            alert(`Ảnh ID ${approveBtn.dataset.id} đã được duyệt ✅`);
        } else if (rejectBtn) {
            e.stopPropagation();
            alert(`Ảnh ID ${rejectBtn.dataset.id} đã bị từ chối ❌`);
        } else if (card) {
            const imgId = parseInt(card.dataset.id, 10);
            const selectedImage = mockImages.find(img => img.id === imgId);
            if (selectedImage) showDetailsPopup(selectedImage);
        }
    });

    // Sự kiện cho popup
    closePopupBtn.addEventListener('click', hideDetailsPopup);
    popupApproveBtn.addEventListener('click', (e) => {
        alert(`Ảnh ID ${e.target.dataset.id} đã được duyệt ✅`);
        hideDetailsPopup();
    });
    popupRejectBtn.addEventListener('click', (e) => {
        alert(`Ảnh ID ${e.target.dataset.id} đã bị từ chối ❌`);
        hideDetailsPopup();
    });

    // Lần render đầu tiên
    render();
});