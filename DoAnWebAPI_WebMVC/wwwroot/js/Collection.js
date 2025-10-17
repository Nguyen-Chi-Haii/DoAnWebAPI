document.addEventListener('DOMContentLoaded', () => {

    /**
     * Factory function: Tạo ra một khu vực quản lý hoàn chỉnh với phân trang.
     */
    const createManagementSection = (config) => {
        let mode = 'normal';
        let data = config.initialData || [];
        let currentPage = 1;
        const itemsPerPage = 8;

        const buttonsContainer = document.getElementById(config.buttonsId);
        const gridContainer = document.getElementById(config.gridId);
        const paginationContainer = document.getElementById(config.paginationId);

        if (!buttonsContainer || !gridContainer || !paginationContainer) {
            console.error(`Lỗi khởi tạo section: Thiếu container HTML. IDs - buttons: ${config.buttonsId}, grid: ${config.gridId}, pagination: ${config.paginationId}`);
            return null;
        }

        // ✅ Bỏ kiểm tra token - cho phép truy cập mà không cần đăng nhập
        console.log('Management section initialized');

        // --- CÁC HÀM RENDER ---

        const renderButtons = () => {
            console.log('renderButtons called, mode:', mode);

            // ✅ Bỏ kiểm tra xác thực - cho phép mọi người quản lý
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
            console.log('Buttons rendered successfully');
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

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);

            if (paginatedData.length === 0 && currentPage > 1) {
                currentPage--;
                renderGrid();
                renderPagination();
                return;
            }

            gridContainer.innerHTML = paginatedData.map(item => config.renderItem(item, mode)).join('');

            if (paginatedData.length === 0) {
                gridContainer.innerHTML = `<p class="text-center col-span-full">${config.emptyMessage}</p>`;
            }

            if (window.lucide) lucide.createIcons();
        };

        // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

        const handleButtonClick = (action) => {
            if (action === 'edit') mode = 'edit';
            if (action === 'delete') mode = 'delete';
            if (action === 'cancel') mode = 'normal';
            renderButtons();
            renderGrid();
        };

        const handleGridClick = (e) => {
            const card = e.target.closest('.item-card');
            if (!card) return;

            const id = card.dataset.id;
            if (mode === 'edit') {
                window.location.href = `${config.editUrl}?id=${id}`;
            } else if (mode === 'delete') {
                if (confirm('Xác nhận xóa?')) {
                    data = data.filter(item => item.id !== id);
                    renderGrid();
                    renderPagination();
                }
            } else {
                if (config.onItemClick) config.onItemClick(id);
            }
        };

        const handlePaginationClick = (e) => {
            const pageItem = e.target.closest('.page-item');
            if (!pageItem || pageItem.classList.contains('disabled')) return;

            const page = pageItem.dataset.page;
            if (page === 'prev') currentPage--;
            else if (page === 'next') currentPage++;
            else currentPage = parseInt(page);

            renderGrid();
            renderPagination();
        };

        // --- HÀM TẢI DỮ LIỆU ---
        const loadData = async () => {
            try {
                if (config.fetchData) {
                    data = await config.fetchData();
                } else if (config.initialData) {
                    data = config.initialData;
                }

                if (config.gridId === 'collections-grid') {
                    localStorage.setItem('allCollectionsData', JSON.stringify(data));
                }

                renderGrid();
                renderPagination();
            } catch (error) {
                console.error(`Lỗi khi tải dữ liệu cho ${config.gridId}:`, error);
                gridContainer.innerHTML = `<p class="text-center text-red-500 col-span-full">Tải dữ liệu thất bại. ${error.message}</p>`;
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
        renderButtons(); // Render nút ngay lập tức
        loadData(); // Load dữ liệu sau
    };

    // --- KHỞI TẠO CÁC SECTION ---
    const collectionsConfig = {
        buttonsId: 'collections-buttons',
        gridId: 'collections-grid',
        paginationId: 'collections-pagination',
        addUrl: '/Collection/AddCollection',
        editUrl: '/Collection/EditCollection',
        emptyMessage: 'Bạn chưa tạo bộ sưu tập nào.',
        fetchData: () => api.collections.getAll(),
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

    createManagementSection(collectionsConfig);
    createManagementSection(imagesConfig);
});