document.addEventListener('DOMContentLoaded', () => {

    /**
     * Factory function: Tạo ra một khu vực quản lý hoàn chỉnh với phân trang.
     */
    const createManagementSection = (config) => {
        let mode = 'normal';
        let data = config.initialData || [];
        // State cho phân trang
        let currentPage = 1;
        const itemsPerPage = 8;

        const buttonsContainer = document.getElementById(config.buttonsId);
        const gridContainer = document.getElementById(config.gridId);
        const paginationContainer = document.getElementById(config.paginationId);

        if (!buttonsContainer || !gridContainer || !paginationContainer) {
            console.error(`Lỗi khởi tạo section: Thiếu container HTML.`);
            return null;
        }

        // --- CÁC HÀM RENDER ---

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

            // ✅ SỬA LỖI Ở ĐÂY: Cắt (slice) mảng dữ liệu để chỉ lấy các item cho trang hiện tại
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);

            // Xử lý trường hợp xóa hết item ở trang cuối
            if (paginatedData.length === 0 && currentPage > 1) {
                currentPage--;
                renderGrid(); // Gọi lại để render trang trước đó
                renderPagination();
                return;
            }

            if (data.length === 0) {
                gridContainer.innerHTML = `<p class="text-center text-gray-600 col-span-full">${config.emptyMessage}</p>`;
                return;
            }

            // Render dữ liệu đã được phân trang
            gridContainer.innerHTML = paginatedData.map(item => config.renderItem(item, mode)).join('');
            if (window.lucide) lucide.createIcons();
        };

        // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

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
            e.preventDefault();
            const id = targetItem.dataset.id;

            if (mode === 'edit') {
                window.location.href = `${config.editUrl}?id=${id}`;
            } else if (mode === 'delete') {
                if (confirm(`Bạn có chắc chắn muốn xóa mục này không?`)) {
                    try {
                        if (config.gridId === 'images-grid') {
                            await api.images.delete(id);
                        } else {
                            console.log(`Đang xóa bộ sưu tập ${id}`);
                        }
                        alert(`Đã xóa thành công!`);
                        await loadData();
                        mode = 'normal';
                        renderButtons();
                    } catch (error) {
                        alert(`Xóa thất bại: ${error.message}`);
                    }
                }
            } else {
                if (config.onItemClick) {
                    config.onItemClick(id);
                }
            }
        };

        const handlePaginationClick = (e) => {
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
            paginationContainer.innerHTML = '';
            try {
                if (config.fetchData) {
                    data = await config.fetchData();
                }
                currentPage = 1;
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
        paginationContainer.addEventListener('click', handlePaginationClick);

        // --- KHỞI TẠO ---
        renderButtons();
        loadData();
    };

    // --- CẤU HÌNH CHO CÁC KHU VỰC ---

    // Cấu hình cho Section Bộ sưu tập (dùng dữ liệu mẫu)
    const collectionsConfig = {
        buttonsId: 'collections-buttons',
        gridId: 'collections-grid',
        paginationId: 'collections-pagination',
        addUrl: '/Collection/AddCollection',
        editUrl: '/Collection/EditCollection',
        emptyMessage: 'Bạn chưa tạo bộ sưu tập nào.',
        initialData: [
            { id: 1, name: 'Ảnh Du Lịch 2024', thumbnail: 'https://picsum.photos/id/1015/300/200' },
            { id: 2, name: 'Gia Đình & Bạn Bè', thumbnail: 'https://picsum.photos/id/1025/300/200' },
        ],
        renderItem: (item, mode) => `
            <div class="item-card" data-id="${item.id}">
                <img src="${item.thumbnail}" alt="${item.name}" />
                <div class="item-card-title">${item.name}</div>
                ${(mode !== 'normal') ? `
                    <div class="action-overlay">
                        <i data-lucide="${mode === 'edit' ? 'edit-3' : 'trash-2'}"></i>
                    </div>
                ` : ''}
            </div>
        `
    };

    // Cấu hình cho Section Ảnh (dùng API thật)
    const imagesConfig = {
        buttonsId: 'images-buttons',
        gridId: 'images-grid',
        paginationId: 'images-pagination',
        addUrl: '/Image/AddImage',
        editUrl: '/Image/EditImage',
        emptyMessage: 'Bạn chưa tải lên ảnh nào.',
        fetchData: () => api.images.getAll(),
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

    // Khởi tạo cả hai section
    createManagementSection(collectionsConfig);
    createManagementSection(imagesConfig);
});