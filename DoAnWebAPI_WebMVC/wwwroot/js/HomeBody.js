// File: wwwroot/js/HomeBody.js
document.addEventListener('DOMContentLoaded', () => {
    // --- BIẾN TOÀN CỤC ---
    let images = [];
    let currentPage = 1;
    let totalPages = 1;
    const imagesPerPage = 8;

    let currentSearchQuery = "";
    let currentTagId = null;     // <-- THÊM DÒNG NÀY
    let currentTopicId = null;
    // --- LẤY PHẦN TỬ DOM ---
    const imageGrid = document.getElementById('image-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoDisplay = document.getElementById('page-info-display');

    // Modal cho Collect (giữ nguyên)
    const collectModal = document.getElementById('collect-modal');
    const collectModalBody = document.getElementById('collect-modal-body');
    const collectModalCloseBtn = document.getElementById('collect-modal-close');
    const createCollectionLink = document.getElementById('create-collection-link');
    let collectingImageInfo = { id: null, title: null, previewUrl: null };
    // --- HÀM TIỆN ÍCH ---
    const formatLikes = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;

    // --- HÀM CHÍNH ---

    async function fetchAndRenderImages(page = 1, query = "", tagId = null, topicId = null) {
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        imageGrid.innerHTML = '';
        try {
            const params = {
                status: "approved",
                isPublic: true,
                page: page,
                pageSize: imagesPerPage
            };

            if (tagId) {
                params.tagId = tagId; // Gửi tagId nếu có
            } else if (topicId) {
                params.topicId = topicId; // Gửi topicId nếu có
            } else if (query) {
                params.search = query; // Chỉ gửi search nếu không có tagId/topicId
            }

            const pagedResult = await api.images.getAll(params);

            images = pagedResult.items || [];
            currentPage = pagedResult.page || 1;
            totalPages = pagedResult.totalPages || 1;

            renderImages();
            updatePaginationUI();
        } catch (error) {
            console.error("Lỗi khi tải ảnh:", error);
            imageGrid.innerHTML = `<p class="text-center text-red-500">Không thể tải dữ liệu ảnh: ${error.message}</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
        }
    }

    function renderImages() {
        if (!images || images.length === 0) {
            imageGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full">Chưa có ảnh nào.</p>';
            return;
        }
        imageGrid.innerHTML = images.map(renderImageCard).join('');
        lucide.createIcons();
    }

    function updatePaginationUI() {
        // Cập nhật hiển thị số trang
        if (pageInfoDisplay)
            pageInfoDisplay.innerHTML = `Trang <b>${currentPage}</b> / ${totalPages}`;

        // Bật/tắt nút
        if (prevPageBtn)
            prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn)
            nextPageBtn.disabled = currentPage >= totalPages;
    }

    // --- TẠO THẺ ẢNH ---
    const renderImageCard = (image) => {
        const isLiked = image.isLikedByCurrentUser;
        const likeCount = image.likeCount || 0;
        const imageUrl = image.thumbnailUrl || image.fileUrl;

        let likeButtonClasses = 'p-2 rounded-full transition drop-shadow-md flex items-center gap-1.5 action-button';
        likeButtonClasses += isLiked
            ? ' bg-red-500 text-white hover:bg-red-600'
            : ' bg-black/50 text-white hover:bg-black/70';

        return `
        <div class="image-card-wrapper break-inside-avoid">
            <a href="#" class="image-card-link block" data-id="${image.id}">
                <div class="image-card bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl group flex flex-col">
                    <div class="relative image-area">
                        <img src="${imageUrl}" alt="${image.title || 'Ảnh'}" class="w-full h-auto object-cover block" loading="lazy"/>
                        <div class="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button data-action="collect" data-id="${image.id}" data-title="${image.title || 'Ảnh'}"
                                    class="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    title="Thêm vào Bộ sưu tập">
                                <i data-lucide="folder-plus" class="w-[18px] h-[18px]"></i>
                            </button>
                            <button data-action="like" data-id="${image.id}" class="${likeButtonClasses}" title="${isLiked ? 'Bỏ thích' : 'Thích'}">
                                <i data-lucide="heart" class="w-[18px] h-[18px]" style="fill:${isLiked ? 'white' : 'none'};stroke:white;"></i>
                                <span class="text-sm font-medium">${formatLikes(likeCount)}</span>
                            </button>
                        </div>
                    </div>
                    <div class="p-4 flex justify-between items-center info-area">
                        <div class="flex-grow min-w-0 pr-4">
                            <h3 class="font-semibold text-base text-gray-800 truncate" title="${image.title || ''}">
                                ${image.title || '(Chưa có tiêu đề)'}
                            </h3>
                        </div>
                        <div class="flex-shrink-0">
                            <button data-action="download" data-id="${image.id}" data-title="${image.title || 'image'}"
                                    class="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    title="Tải xuống">
                                <i data-lucide="download" class="w-[18px] h-[18px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
    };

    // --- PHÂN TRANG ---
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            fetchAndRenderImages(currentPage - 1);
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            fetchAndRenderImages(currentPage + 1);
        }
    });

    // --- LIKE / DOWNLOAD / COLLECT ---
    const handleActionClick = async (button) => {
        const action = button.dataset.action;
        const imageId = parseInt(button.dataset.id);
        const title = button.dataset.title || 'untitled';

        if ((action === 'like' || action === 'collect') && (!CURRENT_USER_ID)) {
            alert("Bạn cần đăng nhập để thực hiện chức năng này.");
            window.location.href = "/Account/Login";
            return;
        }

        switch (action) {
            case 'like':
                const image = images.find(img => img.id === imageId);
                if (!image) return;

                const oldLiked = image.isLikedByCurrentUser;
                const oldCount = image.likeCount;

                image.isLikedByCurrentUser = !oldLiked;
                image.likeCount = oldLiked ? oldCount - 1 : oldCount + 1;

                const card = button.closest('.image-card-wrapper');
                if (card) {
                    card.outerHTML = renderImageCard(image);
                    lucide.createIcons();
                }

                try {
                    if (oldLiked) await api.likes.remove(imageId);
                    else await api.likes.add(imageId);
                } catch (error) {
                    console.error("Lỗi like/unlike:", error);
                    image.isLikedByCurrentUser = oldLiked;
                    image.likeCount = oldCount;
                    if (card) {
                        card.outerHTML = renderImageCard(image);
                        lucide.createIcons();
                    }
                }
                break;

            case 'download':
                const btn = button;
                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="w-[18px] h-[18px] animate-spin"></i>';
                lucide.createIcons();

                try {
                    await api.images.download(imageId, title);
                } catch (error) {
                    alert(`Không thể tải ảnh "${title}".`);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                    await api.images.incrementDownloadCount(imageId);
                }
                break;

            case 'collect':
                const imgEl = button.closest('.image-card').querySelector('img');
                collectingImageInfo = {
                    id: imageId,
                    title: title,
                    previewUrl: imgEl ? imgEl.src : ''
                };
                openCollectModal();
                break;
        }
    };

    imageGrid.addEventListener('click', (e) => {
        const actionButton = e.target.closest('button[data-action]');
        const link = e.target.closest('.image-card-link');
        e.preventDefault();
        if (actionButton) handleActionClick(actionButton);
        else if (link && typeof openModal === 'function') openModal(link.dataset.id);
    });

    // --- MODAL COLLECT (Giữ nguyên các hàm liên quan) ---
    async function openCollectModal() {
        if (!collectModal) return;
        collectModal.classList.remove('hidden');
        collectModalBody.innerHTML = '<p class="text-center text-gray-500">Đang tải bộ sưu tập...</p>';
        createCollectionLink.href = `/Collection/AddCollection?initialImageId=${collectingImageInfo.id}&previewUrl=${encodeURIComponent(collectingImageInfo.previewUrl)}`;
        try {
            const collections = await api.collections.getByUser(CURRENT_USER_ID);
            renderCollectionListInModal(collections);
        } catch (error) {
            collectModalBody.innerHTML = `<p class="text-center text-red-500">Lỗi khi tải bộ sưu tập.</p>`;
        }
    }

    function closeCollectModal() {
        if (collectModal) collectModal.classList.add('hidden');
    }

    function renderCollectionListInModal(collections) {
        if (!collections || collections.length === 0) {
            collectModalBody.innerHTML = '<p class="text-center text-gray-500">Bạn chưa có bộ sưu tập nào.</p>';
            return;
        }
        collectModalBody.innerHTML = collections.map(c => `
            <button class="collection-list-item flex items-center w-full p-3 hover:bg-gray-100 rounded-lg" data-collection-id="${c.id}">
                <img src="${c.thumbnailUrl || '/img/placeholder-image.png'}" class="w-12 h-12 object-cover rounded-md mr-3">
                <span class="font-medium text-gray-800 truncate">${c.name}</span>
            </button>`).join('');
    }

    collectModalBody?.addEventListener('click', (e) => {
        const item = e.target.closest('.collection-list-item');
        if (item) handleAddToExistingCollection(item.dataset.collectionId);
    });
    collectModalCloseBtn?.addEventListener('click', closeCollectModal);
    collectModal?.addEventListener('click', e => { if (e.target === collectModal) closeCollectModal(); });

    async function handleAddToExistingCollection(collectionId) {
        const { id, title } = collectingImageInfo;
        try {
            await api.collections.addImage(collectionId, id);
            alert(`Đã thêm ảnh "${title}" vào bộ sưu tập!`);
            closeCollectModal();
        } catch (error) {
            alert(`Lỗi khi thêm ảnh: ${error.message}`);
        }
    }

    // --- KHỞI TẠO ---
    fetchAndRenderImages();
    // ✅ Lắng nghe ngay khi script được load
    // ✅ Lắng nghe ngay khi script được load
    document.addEventListener("searchChanged", (e) => {
        const filterInfo = e.detail;
        currentPage = 1; // Luôn reset về trang 1

        // Reset các bộ lọc cũ
        currentSearchQuery = "";
        currentTagId = null;
        currentTopicId = null;

        // Áp dụng bộ lọc mới dựa trên type
        if (typeof filterInfo === 'string') { // Trường hợp dự phòng nếu chỉ gửi string
            currentSearchQuery = filterInfo;
        } else {
            switch (filterInfo.type) {
                case 'tag':
                    currentTagId = filterInfo.id;
                    currentSearchQuery = filterInfo.query; // Vẫn giữ query để hiển thị
                    break;
                case 'topic':
                    currentTopicId = filterInfo.id;
                    currentSearchQuery = filterInfo.query; // Vẫn giữ query để hiển thị
                    break;
                case 'all':
                    // Không cần làm gì, các bộ lọc đã được reset
                    currentSearchQuery = ""; // Đảm bảo ô search cũng trống
                    break;
                case 'search': // Từ ô input search
                default:
                    currentSearchQuery = filterInfo.query;
                    break;
            }
        }


        // Gọi fetch với các tham số lọc mới
        fetchAndRenderImages(currentPage, currentSearchQuery, currentTagId, currentTopicId);
    });
});

