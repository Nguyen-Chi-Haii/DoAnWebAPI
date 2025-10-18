document.addEventListener('DOMContentLoaded', () => {

    /**
     * Factory function: Tạo ra một khu vực quản lý hoàn chỉnh với phân trang.
     */
    const createManagementSection = (config) => {
        let mode = 'normal';
        let data = [];
        let currentPage = 1;
        const itemsPerPage = 8;

        const buttonsContainer = document.getElementById(config.buttonsId);
        const gridContainer = document.getElementById(config.gridId);
        const paginationContainer = document.getElementById(config.paginationId);

        if (!buttonsContainer || !gridContainer) {
            console.error(`Lỗi khởi tạo section: Thiếu container HTML chính.`);
            return null;
        }

        // --- CÁC HÀM RENDER --- (Giữ nguyên, không thay đổi)

        const renderButtons = () => {
            if (mode === 'normal') {
                buttonsContainer.innerHTML = `
                    <a href="${config.addUrl}" class="button button-blue"><i data-lucide="plus"></i><span>Thêm</span></a>
                    <button class="button button-gray" data-action="edit"><i data-lucide="edit-3"></i><span>Sửa</span></button>
                    <button class="button button-red" data-action="delete"><i data-lucide="trash-2"></i><span>Xóa</span></button>
                `;
            } else {
                buttonsContainer.innerHTML = `
                    <button class="button button-gray" data-action="cancel"><i data-lucide="x"></i><span>Hủy</span></button>
                `;
            }
            if (window.lucide) lucide.createIcons();
        };

        const renderPagination = () => {
            if (!paginationContainer) return;
            const totalPages = Math.ceil(data.length / itemsPerPage);
            paginationContainer.innerHTML = '';
            if (totalPages <= 1) return;

            let paginationHTML = '';
            paginationHTML += `<div class="page-item ${currentPage === 1 ? 'disabled' : ''}" data-page="prev">‹</div>`;
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<div class="page-item ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</div>`;
            }
            paginationHTML += `<div class="page-item ${currentPage === totalPages ? 'disabled' : ''}" data-page="next">›</div>`;
            paginationContainer.innerHTML = paginationHTML;
        };

        const renderGrid = () => {
            gridContainer.className = 'item-grid';
            if (mode === 'edit') gridContainer.classList.add('editing');
            if (mode === 'delete') gridContainer.classList.add('deleting');

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);

            if (paginatedData.length === 0 && currentPage > 1) {
                currentPage--;
                renderGrid();
                renderPagination();
                return;
            }

            if (data.length === 0) {
                gridContainer.innerHTML = `<p class="text-center text-gray-600 col-span-full">${config.emptyMessage}</p>`;
                return;
            }

            gridContainer.innerHTML = paginatedData.map(item => config.renderItem(item, mode)).join('');
            if (window.lucide) lucide.createIcons();
        };

        // --- CÁC HÀM XỬ LÝ SỰ KIỆN --- (Giữ nguyên, không thay đổi)

        const handleButtonClick = (action) => {
            switch (action) {
                case 'edit': mode = 'edit'; break;
                case 'delete': mode = 'delete'; break;
                case 'cancel': mode = 'normal'; break;
            }
            renderButtons();
            renderGrid();
        };

        const handleGridClick = async (e) => {
            const targetItem = e.target.closest('.item-card');
            if (!targetItem) return;
            const id = targetItem.dataset.id;

            if (mode === 'edit') {
                window.location.href = `${config.editUrl}/${id}`;
            } else if (mode === 'delete') {
                if (confirm(`Bạn có chắc chắn muốn xóa mục này không?`)) {
                    try {
                        await config.deleteAction(id);
                        alert(`Đã xóa thành công!`);

                        // Chuyển về chế độ normal và cập nhật nút bấm TRƯỚC
                        mode = 'normal';
                        renderButtons();

                        // Tải lại dữ liệu SAU
                        await loadData();
                    } catch (error) {
                        alert(`Xóa thất bại: ${error.message}`);
                        mode = 'normal';
                        renderButtons();
                    }
                }
            } else {
                if (config.onItemClick) {
                    config.onItemClick(id);
                }
            }
        };

        const handlePaginationClick = (e) => {
            if (!paginationContainer) return;
            const target = e.target.closest('.page-item');
            if (!target || target.classList.contains('disabled') || target.classList.contains('active')) return;

            const pageAction = target.dataset.page;
            const totalPages = Math.ceil(data.length / itemsPerPage);

            if (pageAction === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (pageAction === 'next' && currentPage < totalPages) {
                currentPage++;
            } else {
                currentPage = parseInt(pageAction);
            }

            renderGrid();
            renderPagination();
        };

        // --- HÀM TẢI DỮ LIỆU ---
        const loadData = async () => {
            gridContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Đang tải...</p>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            try {
                if (config.fetchData) {
                    data = await config.fetchData();
                }
                // Giữ lại trang hiện tại nếu có thể, nếu không thì về trang 1
                const totalPages = Math.ceil(data.length / itemsPerPage);
                if (currentPage > totalPages) {
                    currentPage = totalPages > 0 ? totalPages : 1;
                }

                renderGrid();
                renderPagination();
            } catch (error) {
                console.error(`Lỗi khi tải dữ liệu cho ${config.gridId}:`, error);
                gridContainer.innerHTML = `<p class="text-center text-red-500 col-span-full">Tải dữ liệu thất bại.</p>`;
            }
        };

        // --- GÁN SỰ KIỆN BAN ĐẦU ---
        buttonsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (button) handleButtonClick(button.dataset.action);
        });
        gridContainer.addEventListener('click', handleGridClick);
        if (paginationContainer) paginationContainer.addEventListener('click', handlePaginationClick);

        // --- KHỞI TẠO ---
        renderButtons();
        loadData();

        // ✅ THAY ĐỔI 1: Trả về một object chứa hàm reloadData
        return {
            reloadData: loadData
        };
    };

    // --- CẤU HÌNH CHO CÁC KHU VỰC --- (Giữ nguyên, không thay đổi)

    const collectionsConfig = {
        buttonsId: 'collections-buttons',
        gridId: 'collections-grid',
        paginationId: 'collections-pagination',
        addUrl: '/Collection/AddCollection',
        editUrl: '/Collection/EditCollection',
        emptyMessage: 'Bạn chưa tạo bộ sưu tập nào.',
        fetchData: () => api.collections.getByUser(CURRENT_USER_ID),
        deleteAction: (id) => api.collections.delete(id),
        onItemClick: (collectionId) => {
            window.location.href = `/Collection/CollectionDetail/${collectionId}`;
        },
        renderItem: (item, mode) => `
            <div class="item-card" data-id="${item.id}">
                <img src="${item.thumbnailUrl || 'https://via.placeholder.com/300x200'}" alt="${item.name}" />
                <div class="item-card-title">${item.name}</div>
                <div class="item-card-info">${item.imageCount || 0} ảnh</div>
                ${(mode !== 'normal') ? `
                    <div class="action-overlay">
                        <i data-lucide="${mode === 'edit' ? 'edit-3' : 'trash-2'}"></i>
                    </div>
                ` : ''}
            </div>
        `
    };

    const imagesConfig = {
        buttonsId: 'images-buttons',
        gridId: 'images-grid',
        paginationId: 'images-pagination',
        addUrl: '/Image/AddImage',
        editUrl: '/Image/EditImage',
        emptyMessage: 'Bạn chưa tải lên ảnh nào.',
        fetchData: () => api.images.getByUser(CURRENT_USER_ID),
        deleteAction: (id) => api.images.delete(id),
        onItemClick: (imageId) => {
            if (typeof openModal === 'function') openModal(imageId);
        },
        renderItem: (item, mode) => {
            const imageUrl = item.thumbnailUrl || item.url;
            return `
                 <div class="item-card" data-id="${item.id}">
                     <img src="${imageUrl}" alt="${item.title}" />
                     <div class="item-card-title">${item.title}</div>
                     ${(mode !== 'normal') ? `
                         <div class="action-overlay">
                             <i data-lucide="${mode === 'edit' ? 'edit-3' : 'trash-2'}"></i>
                         </div>
                     ` : ''}
                 </div>
             `;
        }
    };

    // --- KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN ---

    // ✅ THAY ĐỔI 2: Lưu lại tham chiếu đến các section
    const collectionSection = createManagementSection(collectionsConfig);
    const imageSection = createManagementSection(imagesConfig);

    // ✅ THAY ĐỔI 3: Thêm đoạn code lắng nghe sự kiện xóa ảnh
    document.addEventListener('imageDeleted', (event) => {
        // Khi một ảnh bị xóa từ modal, imageSection sẽ tự động tải lại dữ liệu
        if (imageSection && typeof imageSection.reloadData === 'function') {
            imageSection.reloadData();
        }
    });
});