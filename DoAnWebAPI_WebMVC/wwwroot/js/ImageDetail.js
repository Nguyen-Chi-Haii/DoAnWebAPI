// Biến để lưu trữ dữ liệu của ảnh đang được hiển thị
let currentImageId = null;

/**
 * Mở và hiển thị modal với dữ liệu của một ảnh cụ thể.
 * @param {string} imageId - ID của ảnh cần hiển thị.
 */
async function openModal(imageId) {
    const modalOverlay = document.getElementById('image-detail-modal');
    if (!modalOverlay) return;

    currentImageId = imageId;

    // Reset và hiển thị modal với trạng thái loading
    resetModalToLoading();
    modalOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    try {
        // Gọi API để lấy dữ liệu ảnh
        const imageData = await api.images.getById(imageId);
        // Tăng lượt xem (không chặn hiển thị nếu lỗi)
        api.stats.incrementView(imageId).catch(console.error);

        // Render dữ liệu đã lấy được vào modal
        renderModalData(imageData);

    } catch (error) {
        console.error("Lỗi khi tải chi tiết ảnh:", error);
        document.getElementById('modal-image-title').textContent = "Không thể tải dữ liệu";
    }
}

/**
 * Đóng modal và dọn dẹp.
 */
function closeModal() {
    const modalOverlay = document.getElementById('image-detail-modal');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
    document.body.classList.remove('no-scroll');
    currentImageId = null;
}

/**
 * Đưa modal về trạng thái loading ban đầu.
 */
function resetModalToLoading() {
    document.getElementById('modal-main-image').src = "";
    document.getElementById('modal-image-title').textContent = "Đang tải...";
    document.getElementById('modal-image-id').textContent = "";
    document.getElementById('modal-image-description').textContent = "";
    document.getElementById('modal-tags-container').innerHTML = "";
    document.getElementById('modal-topics-container').innerHTML = "";
    document.getElementById('modal-pending-status').classList.add('hidden'); // Ẩn banner pending
}

/**
 * Hàm render dữ liệu chi tiết của ảnh vào modal.
 * @param {object} image - Dữ liệu ảnh từ API.
 */
const renderModalData = (image) => {
    // Lấy các phần tử DOM một lần
    const mainImage = document.getElementById('modal-main-image');
    const title = document.getElementById('modal-image-title');
    const id = document.getElementById('modal-image-id');
    const description = document.getElementById('modal-image-description');
    const tagsContainer = document.getElementById('modal-tags-container');
    const topicsContainer = document.getElementById('modal-topics-container');
    const likeButton = document.getElementById('modal-like-button');
    const downloadButton = document.getElementById('modal-download-button');
    const collectionButton = document.getElementById('modal-collection-button');
    const pendingBanner = document.getElementById('modal-pending-status');

    // ✅ BẮT ĐẦU: LOGIC XỬ LÝ TRẠNG THÁI "PENDING"
    const isPending = image.status === 'pending';

    pendingBanner.classList.toggle('hidden', !isPending); // Hiển thị banner nếu isPending là true

    // Vô hiệu hóa/Kích hoạt các nút dựa trên trạng thái pending
    [likeButton, downloadButton, collectionButton].forEach(button => {
        if (button) {
            button.disabled = isPending;
            button.classList.toggle('disabled-button', isPending);
        }
    });
    // ✅ KẾT THÚC LOGIC

    // Điền dữ liệu vào các phần tử
    mainImage.src = image.fileUrl || image.url;
    mainImage.alt = image.title;
    title.textContent = image.title || "Không có tiêu đề";
    id.textContent = `ID: ${image.id}`;
    description.textContent = image.description || "Không có mô tả.";

    // Render tags
    tagsContainer.innerHTML = image.tags?.map(tag => `<span class="image-detail-modal__tag">${tag.name}</span>`).join('') || 'Không có';

    // Render topics
    topicsContainer.innerHTML = image.topics?.map(topic => `<span class="image-detail-modal__tag image-detail-modal__tag--topic">${topic.name}</span>`).join('') || 'Không có';

    // Cập nhật trạng thái nút Like
    if (likeButton) {
        likeButton.dataset.isLiked = image.isLikedByCurrentUser;
        likeButton.dataset.likeCount = image.likeCount;
        updateLikeButton();
    }

    // Cập nhật thông tin cho nút Download
    if (downloadButton) {
        downloadButton.dataset.downloadUrl = image.fileUrl;
        downloadButton.dataset.fileName = image.title.replace(/[^a-z0-9]/gi, '_'); // Tạo tên file an toàn
    }
};

/**
 * Cập nhật giao diện nút Like.
 */
function updateLikeButton() {
    const likeButton = document.getElementById('modal-like-button');
    if (!likeButton) return;

    const isLiked = likeButton.dataset.isLiked === 'true';
    const likeCount = likeButton.dataset.likeCount;
    const likeIcon = likeButton.querySelector('i');
    const likeText = document.getElementById('modal-like-text');
    const likeCountSpan = document.getElementById('modal-like-count');

    likeText.textContent = isLiked ? 'Đã thích' : 'Thích';
    likeCountSpan.textContent = likeCount;
    likeButton.classList.toggle('modal-button--liked', isLiked);
    if (likeIcon) {
        likeIcon.style.fill = isLiked ? 'currentColor' : 'none';
    }
}


// --- GÁN SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    const exitButton = document.getElementById('modal-exit-button');
    const likeButton = document.getElementById('modal-like-button');
    const downloadButton = document.getElementById('modal-download-button');
    const editButton = document.getElementById('modal-edit-button');

    if (exitButton) {
        exitButton.addEventListener('click', closeModal);
    }

    // Đóng modal khi click ra ngoài
    const modalOverlay = document.getElementById('image-detail-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

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
            const filename = downloadButton.dataset.fileName || 'image';
            if (!url) {
                alert("Lỗi: Không tìm thấy URL để tải xuống.");
                return;
            }
            api.images.download(currentImageId, filename).catch(error => {
                alert(`Không thể tải xuống: ${error.message}`);
            });
        });
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            if (currentImageId) {
                window.location.href = `/Image/EditImage?id=${currentImageId}`;
            }
        });
    }
});