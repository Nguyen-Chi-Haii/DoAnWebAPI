document.addEventListener("DOMContentLoaded", () => {
    // --- Lấy các phần tử DOM ---
    const container = document.getElementById('collection-container');
    const collectionNameEl = document.getElementById('collection-name');
    const collectionDescriptionEl = document.getElementById('collection-description');
    const imageGrid = document.getElementById('image-grid');
    const actionsContainer = document.getElementById('actions-container');

    // Biến COLLECTION_ID và CURRENT_USER_ID được truyền từ View
    if (!COLLECTION_ID) {
        container.innerHTML = "<h1>Lỗi: Không tìm thấy ID của bộ sưu tập.</h1>";
        return;
    }

    /**
     * Render các nút hành động (nút Sửa)
     * @param {object} collection - Dữ liệu chi tiết của bộ sưu tập
     */
    function renderActions(collection) {
        actionsContainer.innerHTML = ''; // Xóa các nút cũ

        // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu không
        const isOwner = collection.userId.toString() === CURRENT_USER_ID;

        if (isOwner) {
            // Nếu là chủ sở hữu, tạo và chèn nút "Sửa"
            const editButton = document.createElement('a');
            editButton.href = `/Collection/EditCollection/${collection.id}`;
            editButton.className = 'btn btn-blue'; // Dùng class CSS đã có
            editButton.innerHTML = `
                <i data-lucide="edit"></i>
                <span>Sửa bộ sưu tập</span>
            `;
            actionsContainer.appendChild(editButton);
            lucide.createIcons(); // Render icon mới
        }
    }

    /**
     * Render lưới ảnh
     * @param {Array} images - Mảng các đối tượng ảnh
     */
    function renderImages(images) {
        imageGrid.innerHTML = ''; // Xóa ảnh cũ

        if (!images || images.length === 0) {
            imageGrid.innerHTML = '<p class="empty-message">Bộ sưu tập này chưa có ảnh nào.</p>';
            return;
        }

        images.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.dataset.imageId = image.id;
            imageItem.innerHTML = `
                <img src="${image.thumbnailUrl}" alt="${image.title}">
                <div class="overlay">
                    <span class="title">${image.title}</span>
                </div>
            `;
            // Gán sự kiện click để mở modal chi tiết
            imageItem.addEventListener('click', () => openModal(image.id));
            imageGrid.appendChild(imageItem);
        });
    }

    /**
     * Hàm chính để tải dữ liệu trang
     */
    async function loadCollectionDetail() {
        imageGrid.innerHTML = '<p class="loading-message">Đang tải ảnh...</p>';
        try {
            // Gọi API để lấy dữ liệu chi tiết, bao gồm cả danh sách ảnh
            const collectionData = await api.collections.getById(COLLECTION_ID);

            // Cập nhật tên và mô tả
            collectionNameEl.textContent = collectionData.name;
            collectionDescriptionEl.textContent = collectionData.description || '';

            // Render các nút hành động và lưới ảnh
            renderActions(collectionData);
            renderImages(collectionData.images);

        } catch (error) {
            console.error("Lỗi khi tải chi tiết bộ sưu tập:", error);
            container.innerHTML = `<h1>Lỗi: ${error.message}</h1>`;
        }
    }

    // --- KHỞI CHẠY ---
    loadCollectionDetail();
});