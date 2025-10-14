// Biến để lưu trữ dữ liệu của ảnh đang được hiển thị
let currentImageData = null;

/**
 * Mở và hiển thị modal với dữ liệu của một ảnh cụ thể.
 * @param {object} imageData - Đối tượng chứa thông tin ảnh.
 */
function openModal(imageData) {
    const modalOverlay = document.getElementById('image-detail-modal');
    if (!modalOverlay) return;

    // Lưu lại dữ liệu ảnh hiện tại
    currentImageData = imageData;

    // Cập nhật các phần tử trong modal với dữ liệu mới, sử dụng ID chuyên biệt
    document.getElementById('modal-main-image').src = imageData.url;
    document.getElementById('modal-main-image').alt = imageData.title;
    document.getElementById('modal-image-title').textContent = imageData.title;
    document.getElementById('modal-image-id').textContent = `ID: ${imageData.id}`;
    document.getElementById('modal-image-description').textContent = imageData.description || "Không có mô tả cho ảnh này.";

    // Cập nhật trạng thái và số lượt thích
    const likeButton = document.getElementById('modal-like-button');
    likeButton.isLiked = imageData.isLiked || false;
    likeButton.likeCount = imageData.likes || 0;

    // Render tags và topics
    renderItems(document.getElementById('modal-tags-container'), imageData.tags || [], true);
    renderItems(document.getElementById('modal-topics-container'), imageData.topics || []);

    // Cập nhật giao diện nút Like
    updateLikeButton();

    // Tạo lại các icon sau khi đã cập nhật HTML
    if (window.lucide) {
        lucide.createIcons();
    }

    // Hiển thị modal
    modalOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');
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

    if (!likeButton || !likeText || !likeCountSpan || !likeIcon) return;

    likeCountSpan.textContent = likeButton.likeCount;
    if (likeButton.isLiked) {
        likeButton.classList.add('liked');
        likeText.textContent = 'Đã thích';
        likeIcon.style.fill = 'white';
    } else {
        likeButton.classList.remove('liked');
        likeText.textContent = 'Thích';
        likeIcon.style.fill = 'currentColor';
    }
};


// Trong file wwwroot/js/ImageDetail.js

// ... (các hàm openModal, closeModal, renderItems, updateLikeButton giữ nguyên) ...


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
    if (likeButton) {
        likeButton.addEventListener('click', () => {
            likeButton.isLiked = !likeButton.isLiked;
            likeButton.likeCount += likeButton.isLiked ? 1 : -1;
            updateLikeButton();
            // TODO: Gửi yêu cầu cập nhật lượt thích lên server
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            if (currentImageData) alert("Bắt đầu tải xuống: " + currentImageData.title);
        });
    }

    if (collectionButton) {
        collectionButton.addEventListener('click', () => {
            if (currentImageData) alert("Thêm ảnh '" + currentImageData.title + "' vào bộ sưu tập.");
        });
    }

    // Chỉ gán sự kiện cho nút Sửa nếu nó tồn tại trên trang
    if (editButton) {
        editButton.addEventListener('click', () => {
            if (currentImageData) {
                window.location.href = `/Image/EditImage?id=${currentImageData.id}`;
            } else {
                alert("Lỗi: Không có thông tin ảnh để chỉnh sửa.");
            }
        });
    }
});