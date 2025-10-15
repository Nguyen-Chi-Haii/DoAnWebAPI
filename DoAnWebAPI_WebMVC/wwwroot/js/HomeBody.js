// HomeBody.js
let images = []; 

const initialLoadCount = 8;
const loadMoreCount = 4;
let visibleImageCount = initialLoadCount;
let isProcessingScroll = false;
let pressedButton = null;

const contentContainer = document.getElementById('content-container');
const imageGrid = document.getElementById('image-grid');
const loadingIndicator = document.getElementById('loading-indicator');

const formatLikes = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;

async function fetchAndRenderImages() {
    const loadingMessage = document.createElement('p');
    loadingMessage.className = 'text-center text-gray-500';
    loadingMessage.textContent = 'Đang tải dữ liệu từ server...';
    imageGrid.appendChild(loadingMessage);

    try {
        // Sử dụng apiService đã tạo để gọi API
        const fetchedImages = await api.images.getAll();
        images = fetchedImages; // Lưu dữ liệu thật vào biến global
        imageGrid.innerHTML = ''; // Xóa thông báo loading
        renderInitialImages(); // Bắt đầu render những ảnh đầu tiên
    } catch (error) {
        console.error("Lỗi khi tải ảnh:", error);
        imageGrid.innerHTML = `<p class="text-center text-red-500">Không thể tải dữ liệu ảnh. Vui lòng thử lại sau.</p>`;
    }
}
/**
 * ===================================================================
 * [CẬP NHẬT 1] - Bọc thẻ ảnh trong một thẻ <a> để kích hoạt modal
 * ===================================================================
 */
// File: wwwroot/js/HomeBody.js

const renderImageCard = (image) => {
    // Lấy dữ liệu từ API object
    const isLiked = image.isLikedByCurrentUser;
    const likeCount = image.likeCount;
    const imageUrl = image.thumbnailUrl;

    let likeButtonClasses = 'p-2 rounded-full transition drop-shadow-md flex items-center gap-1.5 action-button';
    if (isLiked) {
        likeButtonClasses += ' bg-red-500 text-white hover:bg-red-600';
    } else {
        likeButtonClasses += ' bg-black/50 text-white hover:bg-black/70';
    }

    // Đây là template HTML đầy đủ, bao gồm cả nút "Thêm vào Bộ sưu tập"
    return `
    <div class="image-card-wrapper">
        <a href="#" class="image-card-link" data-id="${image.id}">
            <div id="image-${image.id}" class="image-card bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl group flex flex-col">
                <div class="relative image-area">
                    <img src="${imageUrl}" alt="${image.title}" class="w-full h-auto aspect-[4/3] object-cover"/>
                    <div class="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        
                        <button data-action="collect" data-id="${image.id}" data-title="${image.title}"
                                class="p-2 rounded-full transition drop-shadow-md action-button bg-black/50 text-white hover:bg-black/70" 
                                title="Thêm vào Bộ sưu tập">
                            <div data-lucide="folder-plus" class="w-[18px] h-[18px]"></div>
                        </button>

                        <button data-action="like" data-id="${image.id}" class="${likeButtonClasses}" title="${isLiked ? 'Bỏ thích' : 'Thích'}">
                            <div data-lucide="heart" class="w-[18px] h-[18px]" style="fill: ${isLiked ? 'white' : 'none'};"></div>
                            <span class="text-sm font-medium">${formatLikes(likeCount)}</span>
                        </button>
                    </div>
                </div>
                <div class="p-4 flex justify-between items-center info-area">
                    <div class="flex-grow min-w-0 pr-4">
                        <h3 class="font-semibold text-base text-gray-800 truncate" title="${image.title}">
                            ${image.title}
                        </h3>
                    </div>
                    <div class="flex-shrink-0">
                        <button data-action="download" data-id="${image.id}" data-title="${image.title}" 
                                class="p-2 rounded-full transition action-button bg-gray-100 text-gray-700 hover:bg-gray-200" 
                                title="Tải xuống">
                            <div data-lucide="download" class="w-[18px] h-[18px]"></div>
                        </button>
                    </div>
                </div>
            </div>
        </a>
    </div>
    `;
};


const loadMoreImages = () => {
    if (visibleImageCount >= images.length || isProcessingScroll) {
        loadingIndicator.classList.add('hidden');
        return;
    }
    isProcessingScroll = true;
    loadingIndicator.classList.remove('hidden');

    setTimeout(() => {
        const newImagesStartIndex = visibleImageCount;
        visibleImageCount = Math.min(visibleImageCount + loadMoreCount, images.length);
        const newImagesToRender = images.slice(newImagesStartIndex, visibleImageCount);

        imageGrid.insertAdjacentHTML('beforeend', newImagesToRender.map(renderImageCard).join(''));
        lucide.createIcons();
        isProcessingScroll = false;

        if (visibleImageCount >= images.length) {
            loadingIndicator.classList.add('hidden');
        }
        checkAndLoadUntilScroll();
    }, 500);
};

const checkAndLoadUntilScroll = () => {
    if (isProcessingScroll || visibleImageCount >= images.length || contentContainer.scrollHeight > contentContainer.clientHeight) {
        return;
    }
    loadMoreImages();
};

const renderInitialImages = () => {
    const initialImages = images.slice(0, visibleImageCount);
    imageGrid.innerHTML = initialImages.map(renderImageCard).join('');
    lucide.createIcons();
    checkAndLoadUntilScroll();
};

const handleScroll = () => {
    if (isProcessingScroll) return;
    const isNearBottom = contentContainer.scrollTop + contentContainer.clientHeight >= contentContainer.scrollHeight - 300;
    if (isNearBottom && visibleImageCount < images.length) {
        loadMoreImages();
    }
};

const handleActionClick = async (button) => {
    const action = button.dataset.action;
    const imageId = parseInt(button.dataset.id);

    if (action === 'like') {
        const imageToUpdate = images.find(img => img.id === imageId);
        if (!imageToUpdate) return;

        // Lưu trạng thái cũ để rollback nếu API lỗi
        const originalLikedState = imageToUpdate.isLikedByCurrentUser;
        const originalLikeCount = imageToUpdate.likeCount;

        // Cập nhật giao diện ngay lập tức (Optimistic UI)
        imageToUpdate.isLikedByCurrentUser = !originalLikedState;
        imageToUpdate.likeCount = originalLikedState ? originalLikeCount - 1 : originalLikeCount + 1;

        const cardWrapper = button.closest('.image-card-wrapper');
        if (cardWrapper) {
            cardWrapper.outerHTML = renderImageCard(imageToUpdate);
            lucide.createIcons();
        }

        try {
            // Gọi API tương ứng
            if (originalLikedState) {
                await api.likes.remove(imageId);
            } else {
                await api.likes.add(imageId);
            }
        } catch (error) {
            console.error("Lỗi khi like/unlike:", error);
            alert("Đã xảy ra lỗi. Vui lòng thử lại.");

            // Rollback lại trạng thái nếu API thất bại
            imageToUpdate.isLikedByCurrentUser = originalLikedState;
            imageToUpdate.likeCount = originalLikeCount;
            if (cardWrapper) {
                cardWrapper.outerHTML = renderImageCard(imageToUpdate);
                lucide.createIcons();
            }
        }
        return; // Dừng hàm sau khi xử lý like
    }

    // Giữ nguyên logic cho các action khác
    switch (action) {
        case 'download': alert(`Bắt đầu tải xuống ảnh: ${button.dataset.title}`); break;
        case 'collect': alert(`Thêm ảnh: ${button.dataset.title} vào Bộ sưu tập.`); break;
    }
};

/**
 * ===================================================================
 * [CẬP NHẬT 2] - Lắng nghe sự kiện trên cả grid để mở modal
 * ===================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    if (!contentContainer || !imageGrid || !loadingIndicator) {
        console.error("Lỗi: Không tìm thấy #content-container, #image-grid, hoặc #loading-indicator.");
        return;
    }

    fetchAndRenderImages();
    contentContainer.addEventListener('scroll', handleScroll);

    // Lắng nghe sự kiện click trên toàn bộ grid
    imageGrid.addEventListener('click', async (e) => {
        const link = e.target.closest('.image-card-link');
        const actionButton = e.target.closest('button[data-action]');

        // Ngăn hành vi mặc định của thẻ <a>
        e.preventDefault();

        // Ưu tiên 1: Nếu click vào nút action (like, download...)
        if (actionButton) {
            await handleActionClick(actionButton); // Thêm await
            return;
        }

        // Ưu tiên 2: Nếu click vào thẻ ảnh (để mở modal)
        if (link) {
            const imageId = link.dataset.id; // Lấy ID (dưới dạng chuỗi là đủ)

            // Kiểm tra xem hàm openModal đã tồn tại chưa (từ file detail-modal.js)
            if (imageId && typeof openModal === 'function') {
                openModal(imageId); // Đúng: chỉ truyền ID
            } else {
                console.error("Hàm openModal() không được tìm thấy. Hãy chắc chắn file detail-modal.js đã được tải.");
            }
        }
    });
});