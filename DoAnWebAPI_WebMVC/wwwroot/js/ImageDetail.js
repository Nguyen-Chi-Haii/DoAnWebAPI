// Biến để lưu trữ dữ liệu của ảnh đang được hiển thị
let currentImageId = null;

/**
 * Mở và hiển thị modal với dữ liệu của một ảnh cụ thể.
 *@param {string} imageId- Đối tượng chứa thông tin ảnh.
 */
async function openModal(imageId) { // THAY ĐỔI: Nhận vào imageId
    const modalOverlay = document.getElementById('image-detail-modal');
    if (!modalOverlay) return;

    currentImageId = imageId;

    // Hiển thị loading...
    document.getElementById('modal-image-title').textContent = "Đang tải...";
    document.getElementById('modal-main-image').src = "";

    modalOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    try {
        const imageData = await api.images.getById(imageId);
        await api.stats.incrementView(imageId); // Tăng lượt xem

        // Cập nhật các phần tử trong modal
        document.getElementById('modal-main-image').src = imageData.fileUrl; // Dùng fileUrl cho chất lượng cao
        document.getElementById('modal-main-image').alt = imageData.title;
        document.getElementById('modal-image-title').textContent = imageData.title;
        document.getElementById('modal-image-id').textContent = `ID: ${imageData.id}`;
        document.getElementById('modal-image-description').textContent = imageData.description || "Không có mô tả.";

        // Cập nhật trạng thái và số lượt thích
        const likeButton = document.getElementById('modal-like-button');
        likeButton.dataset.isLiked = imageData.isLikedByCurrentUser;
        likeButton.dataset.likeCount = imageData.likeCount;

        renderItems(document.getElementById('modal-tags-container'), imageData.tags || []);
        renderItems(document.getElementById('modal-topics-container'), imageData.topics || []);
        updateLikeButton();

        // Gán URL cho nút download
        const downloadButton = document.getElementById('modal-download-button');
        downloadButton.dataset.downloadUrl = imageData.fileUrl;
        downloadButton.dataset.fileName = imageData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Ẩn/hiện nút Edit dựa trên quyền
        const editButton = document.getElementById('modal-edit-button');
        const token = getToken(); // Giả định có hàm này
        // Logic đơn giản: Nếu có token và UserId khớp thì hiện
        // Cần có userId trong JWT payload hoặc lấy từ một endpoint /me
        // Tạm thời luôn hiển thị nếu có nút
        if (editButton) {
            // Logic phức tạp hơn có thể được thêm ở đây
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
const renderItems = (container, items, hasIcon = false) => {
    if (!container) return;
    if (items && items.length > 0) {
        container.innerHTML = items.map(item => `
            <span class="tag-item tag-${item.color || 'gray'}">
                ${hasIcon ? '<i data-lucide="hash" style="width: 12px; height: 12px;"></i>' : ''}
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
    const likeText = document.getElementById('modal-like-text');
    const likeCountSpan = document.getElementById('modal-like-count');
    const likeIcon = likeButton.querySelector('i') || likeButton.querySelector('svg');
    const isLiked = likeButton.dataset.isLiked === 'true';
    likeCountSpan.textContent = likeButton.dataset.likeCount;


    if (!likeButton || !likeText || !likeCountSpan || !likeIcon) return;

    likeCountSpan.textContent = likeButton.dataset.likeCount; // Sửa ở đây
    if (isLiked) { // Sửa ở đây, dùng biến đã khai báo
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
    // Tìm các phần tử bằng ID. Chúng có thể tồn tại hoặc không.
    const modalOverlay = document.getElementById('image-detail-modal');
    const exitButton = document.getElementById('modal-exit-button');
    const likeButton = document.getElementById('modal-like-button');
    const downloadButton = document.getElementById('modal-download-button');
    const collectionButton = document.getElementById('modal-collection-button');
    const editButton = document.getElementById('modal-edit-button'); // Có thể là null

    // Chỉ kiểm tra các phần tử cốt lõi
    if (!modalOverlay || !exitButton) {
        console.error("Lỗi: Không tìm thấy các phần tử CỐT LÕI của modal (#image-detail-modal, #modal-exit-button).");
        return;
    }

    // --- GÁN SỰ KIỆN ĐÓNG MODAL ---
    exitButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

    // --- GÁN SỰ KIỆN CHO CÁC NÚT BÊN TRONG MODAL (KIỂM TRA SỰ TỒN TẠI TRƯỚC KHI GÁN) ---

    // Chỉ gán sự kiện nếu nút tồn tại
    // MODIFIED: Gán sự kiện cho các nút
    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            if (!currentImageId) return;
            const isLiked = likeButton.dataset.isLiked === 'true';

            try {
                if (isLiked) {
                    await api.likes.remove(currentImageId);
                    likeButton.dataset.likeCount = parseInt(likeButton.dataset.likeCount) - 1;
                } else {
                    await api.likes.add(currentImageId);
                    likeButton.dataset.likeCount = parseInt(likeButton.dataset.likeCount) + 1;
                }
                likeButton.dataset.isLiked = !isLiked;
                updateLikeButton();
            } catch (error) {
                alert(`Lỗi: ${error.message}`);
            }
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            const url = downloadButton.dataset.downloadUrl;
            const filename = downloadButton.dataset.fileName || 'image.jpg';
            if (!url) {
                alert("Lỗi: Không tìm thấy URL để tải xuống.");
                return;
            }
            // Tạo một thẻ a ẩn để thực hiện việc tải xuống
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            if (currentImageId) {
                window.location.href = `/Image/EditImage/${currentImageId}`; // Route chuẩn hơn
            }
        });
    }
});