// File: wwwroot/js/HomeBody.js
document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN TOÀN CỤC CHO SCRIPT ---
    let images = []; // Mảng này sẽ LƯU TRỮ TẤT CẢ ảnh đã tải
    let currentPage = 1;
    let totalPages = 1; // Sẽ được cập nhật từ API
    const initialLoadCount = 8; // Số ảnh tải lần đầu
    const loadMoreCount = 4;   // Số ảnh tải mỗi lần "tải thêm"
    let isProcessingScroll = false; // Cờ để tránh gọi API liên tục khi cuộn
    let collectingImageInfo = { id: null, title: null, previewUrl: null }; // Thông tin ảnh cho modal "collect"

    // --- LẤY CÁC PHẦN TỬ DOM ---
    const contentContainer = document.getElementById('content-container'); // Container chính có thanh cuộn
    const imageGrid = document.getElementById('image-grid');         // Nơi hiển thị lưới ảnh
    const loadingIndicator = document.getElementById('loading-indicator'); // Spinner "Đang tải thêm"

    // DOM cho modal "Thêm vào bộ sưu tập" (Giữ nguyên)
    const collectModal = document.getElementById('collect-modal');
    const collectModalBody = document.getElementById('collect-modal-body');
    const collectModalCloseBtn = document.getElementById('collect-modal-close');
    const createCollectionLink = document.getElementById('create-collection-link');

    // Kiểm tra các phần tử DOM quan trọng
    if (!contentContainer || !imageGrid) {
        console.error("Lỗi: Không tìm thấy #content-container hoặc #image-grid.");
        return;
    }

    // --- CÁC HÀM TIỆN ÍCH ---
    const formatLikes = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;

    // --- CÁC HÀM TẢI VÀ RENDER ẢNH (ĐÃ CẬP NHẬT) ---

    /**
     * Tải dữ liệu trang đầu tiên và hiển thị.
     */
    async function fetchAndRenderInitialImages() {
        // Hiển thị thông báo đang tải ban đầu
        if (loadingIndicator) loadingIndicator.classList.remove('hidden'); // Hiện spinner chính (nếu có)
        isProcessingScroll = true; // Chặn scroll load tạm thời

        try {
            // ✅ Gọi API trang 1 với các tham số lọc cho trang chủ
            const pagedResult = await api.images.getAll({ //
                status: "approved", // Chỉ lấy ảnh đã duyệt
                isPublic: true,     // Chỉ lấy ảnh public
                page: 1,
                pageSize: initialLoadCount
            });

            // ✅ Lấy dữ liệu từ kết quả phân trang
            images = pagedResult.items; // Khởi tạo mảng toàn cục
            currentPage = pagedResult.page;
            totalPages = pagedResult.totalPages;

            imageGrid.innerHTML = ''; // Xóa thông báo "Đang tải"

            if (images.length > 0) {
                // Hiển thị ảnh trang đầu tiên
                imageGrid.innerHTML = images.map(renderImageCard).join('');
                lucide.createIcons(); // Khởi tạo icons
                // Tải thêm nếu màn hình còn trống (không có thanh cuộn)
                checkAndLoadUntilScroll();
            } else {
                imageGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full">Chưa có ảnh nào.</p>';
                if (loadingIndicator) loadingIndicator.classList.add('hidden'); // Ẩn spinner nếu không có ảnh
            }

        } catch (error) {
            console.error("Lỗi khi tải ảnh:", error);
            imageGrid.innerHTML = `<p class="text-center text-red-500 col-span-full">Không thể tải dữ liệu ảnh. ${error.message}</p>`;
            if (loadingIndicator) loadingIndicator.classList.add('hidden'); // Ẩn spinner khi lỗi
        } finally {
            isProcessingScroll = false; // Mở lại scroll load
            // Ẩn spinner nếu đã tải xong trang cuối cùng ngay lần đầu
            if (currentPage >= totalPages && loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

    /**
     * Tạo chuỗi HTML cho một thẻ ảnh.
     * @param {object} image - Dữ liệu ảnh từ ImageDTO.
     * @returns {string} - Chuỗi HTML.
     */
    const renderImageCard = (image) => {
        // Dữ liệu like/collect lấy trực tiếp từ DTO do Repository cung cấp
        const isLiked = image.isLikedByCurrentUser;
        const likeCount = image.likeCount || 0; // Đảm bảo có giá trị mặc định
        // Ưu tiên thumbnail, nếu không có thì dùng ảnh gốc
        const imageUrl = image.thumbnailUrl || image.fileUrl;

        let likeButtonClasses = 'p-2 rounded-full transition drop-shadow-md flex items-center gap-1.5 action-button';
        likeButtonClasses += isLiked ? ' bg-red-500 text-white hover:bg-red-600' : ' bg-black/50 text-white hover:bg-black/70';

        return `
        <div class="image-card-wrapper break-inside-avoid"> <a href="#" class="image-card-link block" data-id="${image.id}">
                <div id="image-${image.id}" class="image-card bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl group flex flex-col">
                    <div class="relative image-area">
                        <img src="${imageUrl}" alt="${image.title || 'Ảnh'}" class="w-full h-auto object-cover block" loading="lazy"/> <div class="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button data-action="collect" data-id="${image.id}" data-title="${image.title || 'Ảnh'}"
                                    class="p-2 rounded-full transition drop-shadow-md action-button bg-black/50 text-white hover:bg-black/70"
                                    title="Thêm vào Bộ sưu tập">
                                <i data-lucide="folder-plus" class="w-[18px] h-[18px]"></i>
                            </button>
                            <button data-action="like" data-id="${image.id}" class="${likeButtonClasses}" title="${isLiked ? 'Bỏ thích' : 'Thích'}">
                                <i data-lucide="heart" class="w-[18px] h-[18px]" style="fill: ${isLiked ? 'white' : 'none'}; stroke: white;"></i> <span class="text-sm font-medium">${formatLikes(likeCount)}</span>
                            </button>
                        </div>
                    </div>
                    <div class="p-4 flex justify-between items-center info-area">
                        <div class="flex-grow min-w-0 pr-4">
                            <h3 class="font-semibold text-base text-gray-800 truncate" title="${image.title || ''}">${image.title || '(Chưa có tiêu đề)'}</h3>
                            </div>
                        <div class="flex-shrink-0">
                             <button data-action="download" data-id="${image.id}" data-title="${image.title || 'image'}"
                                    class="p-2 rounded-full transition action-button bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    title="Tải xuống">
                                <i data-lucide="download" class="w-[18px] h-[18px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
    };

    /**
     * Tải thêm ảnh khi cuộn xuống gần cuối.
     */
    const loadMoreImages = async () => {
        // Nếu đã hết trang hoặc đang tải thì không làm gì cả
        if (currentPage >= totalPages || isProcessingScroll) {
            if (loadingIndicator) loadingIndicator.classList.add('hidden'); // Ẩn spinner nếu hết ảnh
            return;
        }

        isProcessingScroll = true; // Đánh dấu đang xử lý
        if (loadingIndicator) loadingIndicator.classList.remove('hidden'); // Hiện spinner "tải thêm"

        currentPage++; // Tăng trang lên để gọi API

        try {
            // ✅ Gọi API cho trang tiếp theo
            const pagedResult = await api.images.getAll({ //
                status: "approved",
                isPublic: true,
                page: currentPage,
                pageSize: loadMoreCount // Tải ít hơn mỗi lần scroll
            });

            totalPages = pagedResult.totalPages; // Cập nhật lại tổng số trang (có thể thay đổi)

            if (pagedResult.items && pagedResult.items.length > 0) {
                // Thêm ảnh mới vào mảng toàn cục 'images'
                images.push(...pagedResult.items);

                // Nối HTML của ảnh mới vào cuối grid
                imageGrid.insertAdjacentHTML('beforeend', pagedResult.items.map(renderImageCard).join(''));
                lucide.createIcons(); // Khởi tạo icons cho ảnh mới
            }

        } catch (error) {
            console.error("Lỗi khi tải thêm ảnh:", error);
            currentPage--; // Trả lại trang cũ nếu gọi API thất bại
            if (loadingIndicator) loadingIndicator.classList.add('hidden'); // Ẩn spinner khi lỗi
        } finally {
            isProcessingScroll = false; // Mở khóa xử lý
            // Ẩn spinner nếu đã tải đến trang cuối
            if (currentPage >= totalPages && loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            // Gọi lại để kiểm tra nếu màn hình vẫn còn trống sau khi tải xong
            // Dùng setTimeout nhỏ để tránh gọi liên tục nếu API quá nhanh
            setTimeout(checkAndLoadUntilScroll, 100);
        }
    };

    /**
     * Kiểm tra xem màn hình còn trống không, nếu có thì tải thêm ảnh.
     */
    const checkAndLoadUntilScroll = () => {
        // Điều kiện dừng: đang xử lý, đã hết ảnh, hoặc đã có thanh cuộn
        if (isProcessingScroll || currentPage >= totalPages || (contentContainer && contentContainer.scrollHeight > contentContainer.clientHeight)) {
            // Nếu đã hết ảnh, ẩn spinner đi
            if (currentPage >= totalPages && loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            return;
        }
        // Nếu không có thanh cuộn (nội dung ít), gọi tải thêm
        loadMoreImages();
    };

    // --- Các hàm xử lý Modal "Thêm vào bộ sưu tập" ---
    // (Giữ nguyên không đổi)
    async function openCollectModal() {
        if (!collectModal || !collectModalBody || !createCollectionLink) return;
        collectModal.classList.remove('hidden');
        collectModalBody.innerHTML = '<p class="text-center text-gray-500">Đang tải bộ sưu tập...</p>';

        const { id, previewUrl, title } = collectingImageInfo; // Lấy thêm title
        // Cập nhật link tạo collection mới
        createCollectionLink.href = `/Collection/AddCollection?initialImageId=${id}&previewUrl=${encodeURIComponent(previewUrl)}`;

        try {
            const collections = await api.collections.getByUser(CURRENT_USER_ID); //
            renderCollectionListInModal(collections); // Đổi tên hàm render
        } catch (error) {
            collectModalBody.innerHTML = `<p class="text-center text-red-500">Lỗi khi tải bộ sưu tập: ${error.message}</p>`;
        }
    }
    function closeCollectModal() {
        if (collectModal) collectModal.classList.add('hidden');
    }
    // Đổi tên hàm render để tránh nhầm lẫn
    function renderCollectionListInModal(collections) {
        if (!collectModalBody) return;
        if (!collections || collections.length === 0) {
            collectModalBody.innerHTML = '<p class="text-center text-gray-500">Bạn chưa có bộ sưu tập nào.</p>';
            return;
        }
        // Render danh sách các collection hiện có
        collectModalBody.innerHTML = collections.map(collection => `
            <button class="collection-list-item flex items-center w-full p-3 hover:bg-gray-100 rounded-lg transition text-left" data-collection-id="${collection.id}">
                <img src="${collection.thumbnailUrl || '/img/placeholder-image.png'}" alt="${collection.name}" class="w-12 h-12 object-cover rounded-md mr-3 flex-shrink-0">
                <span class="collection-list-item-name font-medium text-gray-800 truncate">${collection.name}</span>
            </button>
        `).join('');
    }
    async function handleAddToExistingCollection(collectionId) {
        const { id, title } = collectingImageInfo;
        const listItem = collectModalBody.querySelector(`[data-collection-id="${collectionId}"]`);

        // Hiển thị trạng thái đang thêm (ví dụ: thay đổi text nút)
        if (listItem) {
            listItem.disabled = true;
            listItem.innerHTML = `
                <img src="${listItem.querySelector('img')?.src || '/img/placeholder-image.png'}" alt="..." class="w-12 h-12 object-cover rounded-md mr-3 flex-shrink-0 opacity-50">
                <span class="collection-list-item-name font-medium text-gray-500 truncate">Đang thêm...</span>
            `;
        }

        try {
            await api.collections.addImage(collectionId, id); //
            alert(`Đã thêm ảnh "${title}" vào bộ sưu tập thành công!`);
            closeCollectModal();
        } catch (error) {
            // Kiểm tra lỗi cụ thể (ví dụ: ảnh đã tồn tại)
            if (error.message && error.message.includes("đã tồn tại")) { // Giả sử API trả về lỗi này
                alert(`Ảnh "${title}" đã có trong bộ sưu tập này.`);
            } else {
                alert(`Lỗi khi thêm ảnh vào bộ sưu tập: ${error.message}`);
            }
            // Tải lại danh sách để người dùng thử lại hoặc thấy trạng thái đúng
            openCollectModal();
        }
        // Không cần kích hoạt lại nút vì modal sẽ được render lại hoặc đóng
    }


    // --- Hàm xử lý các hành động trên thẻ ảnh ---
    const handleActionClick = async (button) => {
        const action = button.dataset.action;
        const imageId = parseInt(button.dataset.id); // Chuyển sang số
        const title = button.dataset.title || 'untitled';

        // Kiểm tra đăng nhập cho Like và Collect
        if (action === 'like' || action === 'collect') {
            // Kiểm tra biến global CURRENT_USER_ID (cần được set từ server-side, ví dụ trong _Layout.cshtml)
            if (typeof CURRENT_USER_ID === 'undefined' || !CURRENT_USER_ID) {
                alert("Bạn cần đăng nhập để thực hiện chức năng này.");
                window.location.href = "/Account/Login"; // Chuyển hướng đến trang đăng nhập
                return;
            }
        }

        switch (action) {
            case 'like':
                // Tìm ảnh trong mảng 'images' để cập nhật trạng thái
                const imageToUpdate = images.find(img => img.id === imageId);
                if (!imageToUpdate) {
                    console.warn("Không tìm thấy ảnh để cập nhật like:", imageId);
                    return; // Không tìm thấy ảnh (có thể là lỗi)
                }

                // Lưu trạng thái cũ để hoàn tác nếu API lỗi
                const originalLikedState = imageToUpdate.isLikedByCurrentUser;
                const originalLikeCount = imageToUpdate.likeCount;

                // --- Optimistic Update: Cập nhật UI ngay lập tức ---
                imageToUpdate.isLikedByCurrentUser = !originalLikedState;
                imageToUpdate.likeCount = originalLikedState ? (originalLikeCount - 1) : (originalLikeCount + 1);

                // Tìm card wrapper và render lại chỉ card đó
                const cardWrapperLike = button.closest('.image-card-wrapper');
                if (cardWrapperLike) {
                    cardWrapperLike.outerHTML = renderImageCard(imageToUpdate);
                    lucide.createIcons(); // Cập nhật icon sau khi render lại
                }
                // ------------------------------------------------

                try {
                    // Gọi API tương ứng
                    if (originalLikedState) {
                        await api.likes.remove(imageId); //
                    } else {
                        await api.likes.add(imageId); //
                    }
                    // (Không cần phát sự kiện 'likeStatusChanged' vì chính HomeBody xử lý)
                } catch (error) {
                    console.error("Lỗi khi like/unlike:", error);
                    alert("Đã xảy ra lỗi khi thích ảnh. Vui lòng thử lại.");

                    // --- Rollback: Hoàn tác lại trạng thái nếu API lỗi ---
                    imageToUpdate.isLikedByCurrentUser = originalLikedState;
                    imageToUpdate.likeCount = originalLikeCount;
                    if (cardWrapperLike) { // Render lại lần nữa để về trạng thái cũ
                        cardWrapperLike.outerHTML = renderImageCard(imageToUpdate);
                        lucide.createIcons();
                    }
                    // ----------------------------------------------------
                }
                break;

            case 'download':
                const downloadBtn = button;
                const originalIconHTML = downloadBtn.innerHTML; // Lưu HTML gốc
                downloadBtn.disabled = true; // Vô hiệu hóa nút
                // Hiển thị spinner
                downloadBtn.innerHTML = '<i data-lucide="loader-2" class="w-[18px] h-[18px] animate-spin"></i>';
                lucide.createIcons();

                try {
                    // Gọi API download (apiServices đã xử lý việc tạo link và click)
                    await api.images.download(imageId, title); //
                    // API download trong controller đã tự tăng count
                } catch (error) {
                    console.error('Lỗi khi tải xuống:', error);
                    alert(`Không thể tải ảnh "${title}". Lỗi: ${error.message}`);
                } finally {
                    // Khôi phục lại nút sau khi xong (dù thành công hay lỗi)
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = originalIconHTML;
                    // Không cần gọi lucide.createIcons() lại vì đã khôi phục HTML gốc
                }
                break;

            case 'collect':
                // Lưu thông tin ảnh đang được chọn để thêm vào collection
                collectingImageInfo.id = imageId;
                collectingImageInfo.title = title;
                // Lấy URL ảnh preview từ thẻ img gần nhất
                const imgElement = button.closest('.image-card').querySelector('img');
                collectingImageInfo.previewUrl = imgElement ? imgElement.src : ''; // Lấy src của ảnh

                openCollectModal(); // Mở modal chọn/tạo collection
                break;
        }
    };

    // --- GÁN SỰ KIỆN KHI TRANG ĐƯỢC TẢI ---

    fetchAndRenderInitialImages(); // Bắt đầu tải trang

    // Sự kiện cuộn để tải thêm (infinite scroll)
    contentContainer.addEventListener('scroll', () => {
        if (isProcessingScroll) return; // Nếu đang xử lý thì bỏ qua
        // Kiểm tra xem đã cuộn gần đến cuối chưa
        const isNearBottom = contentContainer.scrollTop + contentContainer.clientHeight >= contentContainer.scrollHeight - 300; // Ngưỡng 300px
        // Nếu gần cuối VÀ còn trang để tải
        if (isNearBottom && currentPage < totalPages) {
            loadMoreImages(); // Gọi hàm tải thêm
        }
    });

    // Sự kiện click chung trên lưới ảnh để xử lý click vào ảnh hoặc nút action
    imageGrid.addEventListener('click', (e) => {
        const link = e.target.closest('.image-card-link');        // Click vào link ảnh (để mở modal chi tiết)
        const actionButton = e.target.closest('button[data-action]'); // Click vào nút action (like, collect, download)

        // Ngăn hành vi mặc định của thẻ <a>
        e.preventDefault();

        if (actionButton) {
            // Nếu click vào nút action, gọi hàm xử lý action
            handleActionClick(actionButton);
        } else if (link) {
            // Nếu click vào link ảnh, lấy ID và mở modal chi tiết
            const imageId = link.dataset.id;
            // Kiểm tra xem hàm openModal (từ ImageDetail.js) có tồn tại không
            if (imageId && typeof openModal === 'function') {
                openModal(imageId); // Gọi hàm mở modal từ ImageDetail.js
            } else if (!imageId) {
                console.warn("Link ảnh không có data-id:", link);
            } else {
                console.warn("Hàm openModal không tồn tại.");
            }
        }
    });

    // Lắng nghe sự kiện 'likeStatusChanged' được gửi từ ImageDetail.js
    document.addEventListener('likeStatusChanged', (event) => {
        const { imageId, isLiked, likeCount } = event.detail; // Lấy dữ liệu từ sự kiện

        // 1. Cập nhật trạng thái trong mảng 'images' của HomeBody
        const imageToUpdate = images.find(img => img.id === imageId);
        if (!imageToUpdate) {
            return; // Ảnh không có trên grid hiện tại (có thể chưa tải đến)
        }
        imageToUpdate.isLikedByCurrentUser = isLiked;
        imageToUpdate.likeCount = likeCount;

        // 2. Cập nhật trực tiếp UI (DOM) của card ảnh tương ứng
        const cardWrapper = imageGrid.querySelector(`.image-card-link[data-id="${imageId}"]`)?.closest('.image-card-wrapper');
        if (cardWrapper) {
            // Render lại HTML cho card đó với dữ liệu mới
            cardWrapper.outerHTML = renderImageCard(imageToUpdate);
            lucide.createIcons(); // Cần gọi lại để icon hiển thị đúng
        }
    });

    // Lắng nghe sự kiện 'imageDeleted' được gửi từ ImageDetail.js
    document.addEventListener('imageDeleted', (event) => {
        const { imageId } = event.detail; // Lấy ID ảnh đã xóa

        // 1. Xóa ảnh khỏi mảng 'images'
        images = images.filter(img => img.id !== imageId);

        // 2. Xóa card ảnh khỏi DOM
        const cardWrapper = imageGrid.querySelector(`.image-card-link[data-id="${imageId}"]`)?.closest('.image-card-wrapper');
        if (cardWrapper) {
            cardWrapper.remove();
        }
        // Kiểm tra nếu grid rỗng sau khi xóa
        if (images.length === 0) {
            imageGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full">Chưa có ảnh nào.</p>';
        }
    });


    // Gán sự kiện cho modal "Thêm vào bộ sưu tập"
    if (collectModal) {
        // Nút đóng modal
        collectModalCloseBtn.addEventListener('click', closeCollectModal);
        // Click ra ngoài modal để đóng
        collectModal.addEventListener('click', (e) => {
            if (e.target === collectModal) closeCollectModal();
        });
        // Click vào một collection trong danh sách
        collectModalBody.addEventListener('click', (e) => {
            const listItem = e.target.closest('.collection-list-item');
            if (listItem) {
                const collectionId = listItem.dataset.collectionId;
                handleAddToExistingCollection(collectionId);
            }
        });
    } else {
        console.warn("Modal 'collect-modal' hoặc các thành phần con không tồn tại.");
    }
});