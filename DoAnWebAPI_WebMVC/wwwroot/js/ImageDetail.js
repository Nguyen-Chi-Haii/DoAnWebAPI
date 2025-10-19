// Biến để lưu trữ ID của ảnh đang được hiển thị
let currentImageId = null;

/**
 * Mở và hiển thị modal với dữ liệu của một ảnh cụ thể.
 * @param {string} imageId - ID của ảnh cần hiển thị.
 */
async function openModal(imageId) {
    const modalOverlay = document.getElementById('image-detail-modal');
    if (!modalOverlay) return;

    currentImageId = imageId;

    // Lấy các nút bấm trực tiếp trong hàm để đảm bảo phạm vi
    const likeButton = document.getElementById('modal-like-button');
    const collectionButton = document.getElementById('modal-collection-button');
    const editButton = document.getElementById('modal-edit-button');
    const deleteButton = document.getElementById('modal-delete-button');
    const pendingBanner = document.getElementById('modal-pending-status');

    // --- Reset trạng thái của modal ---
    document.getElementById('modal-image-title').textContent = "Đang tải...";
    document.getElementById('modal-main-image').src = "";

    // Luôn ẩn các thành phần có điều kiện khi mở lại
    if (pendingBanner) pendingBanner.classList.add('hidden');
    if (editButton) editButton.classList.add('hidden');
    if (deleteButton) deleteButton.classList.add('hidden');

    // Luôn kích hoạt lại các nút tương tác khi mở lại
    if (likeButton) {
        likeButton.disabled = false;
        likeButton.classList.remove('disabled-button');
    }
    if (collectionButton) {
        collectionButton.disabled = false;
        collectionButton.classList.remove('disabled-button');
    }

    modalOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    try {
        const imageData = await api.images.getById(imageId);
        await api.stats.incrementView(imageId);

        // Cập nhật các phần tử trong modal
        document.getElementById('modal-main-image').src = imageData.fileUrl;
        document.getElementById('modal-main-image').alt = imageData.title;
        document.getElementById('modal-image-title').textContent = imageData.title;
        document.getElementById('modal-image-id').textContent = `ID: ${imageData.id}`;
        document.getElementById('modal-image-description').textContent = imageData.description || "Không có mô tả.";

        if (likeButton) {
            likeButton.dataset.isLiked = imageData.isLikedByCurrentUser;
            likeButton.dataset.likeCount = imageData.likeCount;
            updateLikeButton();
        }

        renderItems(document.getElementById('modal-tags-container'), imageData.tags || []);
        renderItems(document.getElementById('modal-topics-container'), imageData.topics || []);

        const downloadButton = document.getElementById('modal-download-button');
        if (downloadButton) {
            downloadButton.dataset.downloadUrl = imageData.fileUrl;
            downloadButton.dataset.fileName = imageData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        }

        // 1. Kiểm tra trạng thái ảnh để hiển thị banner và vô hiệu hóa nút
        if (imageData.status && imageData.status.toLowerCase() === 'pending') {
            if (pendingBanner) pendingBanner.classList.remove('hidden');
            if (likeButton) {
                likeButton.disabled = true;
                likeButton.classList.add('disabled-button');
            }
            if (collectionButton) {
                collectionButton.disabled = true;
                collectionButton.classList.add('disabled-button');
            }
            if (downloadButton) {
                downloadButton.disabled = true;
                downloadButton.classList.add('disabled-button');
            }
        }

        // 2. Kiểm tra quyền sở hữu để hiển thị nút "Sửa" và "Xóa"
        if (typeof CURRENT_USER_ID !== 'undefined' && imageData.userId.toString() === CURRENT_USER_ID) {
            if (editButton) editButton.classList.remove('hidden');
            if (deleteButton) deleteButton.classList.remove('hidden');
        }

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        document.getElementById('modal-image-title').textContent = "Lỗi khi tải ảnh";
        document.getElementById('modal-image-description').textContent = error.message;
    }
}

/**
 * Đóng modal.
 */
function closeModal() {
    const modalOverlay = document.getElementById('image-detail-modal');
    if (!modalOverlay) return;
    modalOverlay.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

// Hàm render tags/topics (hàm phụ)
const renderItems = (container, items) => {
    if (!container) return;
    if (items && items.length > 0) {
        container.innerHTML = items.map(item => `
            <span class="tag-item tag-${item.color || 'gray'}">
                ${item.name}
            </span>
        `).join('');
    } else {
        container.innerHTML = `<span class="placeholder">Chưa có thông tin.</span>`;
    }
};

// Hàm cập nhật giao diện nút Like
const updateLikeButton = () => {
    const likeButton = document.getElementById('modal-like-button');
    if (!likeButton) return;
    const likeText = document.getElementById('modal-like-text');
    const likeCountSpan = document.getElementById('modal-like-count');
    const likeIcon = likeButton.querySelector('i') || likeButton.querySelector('svg');
    const isLiked = likeButton.dataset.isLiked === 'true';

    if (!likeText || !likeCountSpan || !likeIcon) return;

    likeCountSpan.textContent = likeButton.dataset.likeCount;
    if (isLiked) {
        likeButton.classList.add('liked');
        likeText.textContent = 'Đã thích';
        likeIcon.style.fill = 'white';
    } else {
        likeButton.classList.remove('liked');
        likeText.textContent = 'Thích';
        likeIcon.style.fill = 'currentColor';
    }
};

// Chỉ gán sự kiện một lần khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    // Tìm các phần tử bằng ID
    const modalOverlay = document.getElementById('image-detail-modal');
    const exitButton = document.getElementById('modal-exit-button');
    const likeButton = document.getElementById('modal-like-button');
    const downloadButton = document.getElementById('modal-download-button');
    const editButton = document.getElementById('modal-edit-button');
    const deleteButton = document.getElementById('modal-delete-button'); // Lấy nút Xóa
    // === THÊM SỰ KIỆN "THÊM VÀO BỘ SƯU TẬP" CHO NÚT TRONG MODAL ===
    const collectionButton = document.getElementById('modal-collection-button');
    const collectModal = document.getElementById('collect-modal');
    const collectModalBody = document.getElementById('collect-modal-body');
    const collectModalCloseBtn = document.getElementById('collect-modal-close');
    const createCollectionLink = document.getElementById('create-collection-link');

    let isLikeProcessing = false;

    if (collectionButton && collectModal) {
        collectionButton.addEventListener('click', async () => {
            if (!window.CURRENT_USER_ID || window.CURRENT_USER_ID === "null" || window.CURRENT_USER_ID === "") {
                alert("Vui lòng đăng nhập để sử dụng tính năng này!");
                window.location.href = "/Account/Login"; // 👉 chuyển đến trang đăng nhập
                return;
            }
            if (!currentImageId) return;

            // Hiện modal
            collectModal.classList.remove('hidden');
            collectModalBody.innerHTML = '<p class="loader">Đang tải bộ sưu tập của bạn...</p>';

            // Lưu thông tin ảnh hiện tại
            const imageData = await api.images.getById(currentImageId);
            const previewUrl = imageData.fileUrl;

            // Liên kết tới trang tạo mới bộ sưu tập
            if (createCollectionLink)
                createCollectionLink.href = `/Collection/AddCollection?initialImageId=${currentImageId}&previewUrl=${encodeURIComponent(previewUrl)}`;

            try {
                // Lấy danh sách bộ sưu tập của người dùng hiện tại
                const collections = await api.collections.getByUser(CURRENT_USER_ID);
                renderCollectionList(collections);
            } catch (error) {
                collectModalBody.innerHTML = `<p class="error">Lỗi khi tải bộ sưu tập: ${error.message}</p>`;
            }
        });
    }

    // Hàm render danh sách bộ sưu tập
    function renderCollectionList(collections) {
        if (!collectModalBody) return;
        if (collections.length === 0) {
            collectModalBody.innerHTML = '<p class="loader">Bạn chưa có bộ sưu tập nào.</p>';
            return;
        }
        collectModalBody.innerHTML = collections.map(collection => `
        <div class="collection-list-item" data-collection-id="${collection.id}">
            <img src="${collection.thumbnailUrl || 'https://via.placeholder.com/100'}" alt="${collection.name}">
            <span class="collection-list-item-name">${collection.name}</span>
        </div>
    `).join('');
    }

    // Hàm xử lý khi chọn một bộ sưu tập để thêm ảnh
    if (collectModalBody) {
        collectModalBody.addEventListener('click', async (e) => {
            const listItem = e.target.closest('.collection-list-item');
            if (listItem) {
                const collectionId = listItem.dataset.collectionId;
                listItem.innerHTML = '<p class="loader">Đang thêm...</p>';
                try {
                    await api.collections.addImage(collectionId, currentImageId);
                    alert("Ảnh đã được thêm vào bộ sưu tập thành công!");
                    collectModal.classList.add('hidden');
                } catch (error) {
                    alert("Ảnh đã tồn tại trong bộ sưu tập này.");
                    collectModal.classList.add('hidden');
                }
            }
        });
    }

    // Đóng modal khi bấm ra ngoài hoặc nút đóng
    if (collectModalCloseBtn) {
        collectModalCloseBtn.addEventListener('click', () => collectModal.classList.add('hidden'));
    }
    collectModal.addEventListener('click', (e) => {
        if (e.target === collectModal) collectModal.classList.add('hidden');
    });


    if (!modalOverlay || !exitButton) {
        console.error("Lỗi: Không tìm thấy các phần tử CỐT LÕI của modal.");
        return;
    }

    // Gán sự kiện đóng modal
    exitButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Gán sự kiện cho các nút hành động (Like, Download, Edit)
    // [SỬA LỖI TRONG tệp ImageDetail.js]

    // [TRONG ImageDetail.js]
    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            if (!currentImageId) return;

            // ✅ BƯỚC 2: Kiểm tra cờ. Nếu đang xử lý, không làm gì cả.
            if (isLikeProcessing) {
                return;
            }

            // ✅ BƯỚC 3: Khóa cờ và vô hiệu hóa nút
            isLikeProcessing = true;
            likeButton.disabled = true;

            // [Phần code Optimistic Update của bạn vẫn giữ nguyên]
            const oldLikeState = likeButton.dataset.isLiked === 'true';
            const oldLikeCount = parseInt(likeButton.dataset.likeCount);

            const newLikeState = !oldLikeState;
            const newLikeCount = oldLikeState ? oldLikeCount - 1 : oldLikeCount + 1;

            // Cập nhật dataset và UI ngay
            likeButton.dataset.isLiked = newLikeState;
            likeButton.dataset.likeCount = newLikeCount;
            updateLikeButton();

            try {
                // [Gọi API]
                if (oldLikeState) {
                    await api.likes.remove(currentImageId);
                } else {
                    await api.likes.add(currentImageId);
                }
                // [Phát sự kiện]
                const likeUpdateEvent = new CustomEvent('likeStatusChanged', {
                    detail: {
                        imageId: parseInt(currentImageId),
                        isLiked: newLikeState,
                        likeCount: newLikeCount
                    }
                });
                document.dispatchEvent(likeUpdateEvent);

            } catch (error) {
                // [Hoàn tác (Rollback) nếu API lỗi]
                console.error("Lỗi API, hoàn tác UI:", error);
                alert("Đã xảy ra lỗi. Vui lòng thử lại.");

                likeButton.dataset.isLiked = oldLikeState;
                likeButton.dataset.likeCount = oldLikeCount;
                updateLikeButton();
            } finally {
                // ✅ BƯỚC 4: Mở khóa cờ và kích hoạt lại nút
                // (Khối 'finally' luôn chạy dù 'try' hay 'catch' xảy ra)
                isLikeProcessing = false;
                likeButton.disabled = false;
            }
        });
    }
    // File: wwwroot/js/ImageDetail.js

    if (downloadButton) {
        downloadButton.addEventListener('click', async () => { // Thêm "async" ở đây
            if (!currentImageId) return;

            const originalIcon = downloadButton.innerHTML;
            const imageTitle = document.getElementById('modal-image-title').textContent || 'image';

            // 1. Vô hiệu hóa nút và hiển thị icon loading
            downloadButton.disabled = true;
            downloadButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang xử lý...';
            if (window.lucide) lucide.createIcons();

            try {
                // 2. Gọi hàm download từ apiService
                // Hàm này đã bao gồm logic tạo thẻ <a> và tự động click
                await api.images.download(currentImageId, imageTitle);

            } catch (error) {
                // 3. Xử lý nếu có lỗi
                console.error('Lỗi khi tải xuống:', error);
                alert(`Không thể tải ảnh. Lỗi: ${error.message}`);
            } finally {
                // 4. Khôi phục lại trạng thái của nút sau khi hoàn tất (dù thành công hay thất bại)
                await api.stats.incrementDownload(currentImageId);
                downloadButton.disabled = false;
                downloadButton.innerHTML = originalIcon;
                if (window.lucide) lucide.createIcons();
                
            }
        });
    }
    if (editButton) {
        editButton.addEventListener('click', () => {
            if (currentImageId) {
                window.location.href = `/Image/EditImage/${currentImageId}`;
            }
        });
    }

    // ✅ THÊM LẠI SỰ KIỆN CHO NÚT XÓA
    // File: wwwroot/js/ImageDetail.js

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (!currentImageId) return;

            if (confirm("Bạn có chắc chắn muốn xóa ảnh này không? Hành động này không thể hoàn tác.")) {
                try {
                    await api.images.delete(currentImageId);
                    alert("Đã xóa ảnh thành công!");

                    // ✅ THAY ĐỔI Ở ĐÂY: Phát đi một sự kiện tùy chỉnh
                    // Tín hiệu này mang theo ID của ảnh vừa bị xóa
                    document.dispatchEvent(new CustomEvent('imageDeleted', { detail: { imageId: currentImageId } }));

                    closeModal(); // Đóng modal như bình thường
                    // window.location.reload(); // Xóa dòng này đi

                } catch (error) {
                    alert(`Lỗi khi xóa ảnh: ${error.message}`);
                }
            }
        });
    }

});