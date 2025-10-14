document.addEventListener("DOMContentLoaded", () => {
    // --- BƯỚC 1: Lấy các phần tử DOM quan trọng ngay từ đầu ---
    const container = document.getElementById("collection-container");

    if (!container) {
        console.error("Lỗi nghiêm trọng: Không tìm thấy #collection-container trong HTML.");
        return;
    }

    // --- BƯỚC 2: Lấy dữ liệu và kiểm tra ---
    const collectionId = container.dataset.collectionId;
    const allCollectionsData = JSON.parse(localStorage.getItem('allCollectionsData'));

    if (!allCollectionsData) {
        container.innerHTML = "<h2>Lỗi: Dữ liệu bộ sưu tập không tồn tại. Vui lòng quay lại trang chính.</h2>";
        return;
    }

    const collectionData = allCollectionsData.find(c => c.id === collectionId);

    if (!collectionData) {
        container.innerHTML = `<h2>Không tìm thấy bộ sưu tập với ID: ${collectionId || "trống"}</h2>`;
        console.error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
        return;
    }

    // --- BƯỚC 3: Khai báo các biến và phần tử DOM ---
    let images = [...collectionData.images];
    let mode = "normal";

    // Biến cho cuộn vô hạn
    let currentPage = 1;
    const itemsPerPage = 6;
    let isLoading = false;
    let hasMoreImages = true;

    // Các phần tử DOM của trang chính
    const nameEl = document.getElementById("collection-name");
    const descriptionEl = document.getElementById("collection-description");
    const imageGrid = document.getElementById("image-grid");
    const addBtn = document.getElementById("add-image-btn");
    const deleteModeBtn = document.getElementById("delete-mode-btn");
    const doneBtn = document.getElementById("done-btn");
    const normalModeButtons = document.getElementById("normal-mode-buttons");
    const deleteModeButtons = document.getElementById("delete-mode-buttons");

    // Các phần tử DOM của popup
    const imageDetailModal = document.getElementById("image-detail-modal");
    const modalExitButton = document.getElementById("modal-exit-button");
    const modalMainImage = document.getElementById("modal-main-image");
    const modalImageTitle = document.getElementById("modal-image-title");
    const modalImageId = document.getElementById("modal-image-id");
    const modalImageDescription = document.getElementById("modal-image-description");
    const modalTopicsContainer = document.getElementById("modal-topics-container");
    const modalTagsContainer = document.getElementById("modal-tags-container");
    const modalLikeButton = document.getElementById("modal-like-button");
    const modalLikeText = document.getElementById("modal-like-text");
    const modalLikeCount = document.getElementById("modal-like-count");
    const modalDownloadButton = document.getElementById("modal-download-button");
    const modalCollectionButton = document.getElementById("modal-collection-button");
    const modalEditButton = document.getElementById("modal-edit-button");

    // --- Các hàm chính ---

    function loadMoreImages() {
        if (isLoading || !hasMoreImages) return;
        isLoading = true;

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const imagesToLoad = images.slice(indexOfFirstItem, indexOfLastItem);

        if (imagesToLoad.length === 0) {
            hasMoreImages = false;
            isLoading = false;
            console.log("Đã tải hết ảnh trong bộ sưu tập.");
            return;
        }

        // ĐÃ SỬA: Toàn bộ logic này phải nằm BÊN TRONG hàm loadMoreImages
        const fragment = document.createDocumentFragment();
        imagesToLoad.forEach(image => {
            const card = document.createElement("div");
            card.className = "image-card";
            card.dataset.imageId = image.id;

            const img = document.createElement("img");
            img.src = image.url;
            img.alt = `Ảnh ${image.id}`;
            card.appendChild(img);

            if (mode === 'delete') {
                const overlay = document.createElement('div');
                overlay.className = 'delete-overlay';
                overlay.innerHTML = `<svg class="delete-overlay-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
                card.appendChild(overlay);
            }
            fragment.appendChild(card);
        });

        imageGrid.appendChild(fragment);
        currentPage++;
        isLoading = false;
    }

    function renderUIUpdates() {
        nameEl.textContent = collectionData.name;
        descriptionEl.textContent = collectionData.description;

        if (mode === 'normal') {
            container.classList.remove('delete-mode');
            normalModeButtons.style.display = 'flex';
            deleteModeButtons.style.display = 'none';
        } else {
            container.classList.add('delete-mode');
            normalModeButtons.style.display = 'none';
            deleteModeButtons.style.display = 'flex';
        }

        imageGrid.querySelectorAll('.image-card').forEach(card => {
            const oldOverlay = card.querySelector('.delete-overlay');
            if (oldOverlay) {
                oldOverlay.remove();
            }

            if (mode === 'delete') {
                const overlay = document.createElement('div');
                overlay.className = 'delete-overlay';
                overlay.innerHTML = `<svg class="delete-overlay-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
                card.appendChild(overlay);
            }
        });
        // ĐÃ XÓA: Toàn bộ phần cập nhật pageInfo, prev/next button và if/else thừa
    }

    function openImageDetailModal(imageData) {
        if (!imageData) return;
        modalMainImage.src = imageData.url;
        modalImageTitle.textContent = imageData.title || "Không có tiêu đề";
        modalImageId.textContent = `ID: ${imageData.id}`;
        modalImageDescription.textContent = imageData.description || "Không có mô tả.";
        modalLikeCount.textContent = imageData.likes || 0;
        if (imageData.isLiked) {
            modalLikeButton.classList.add("liked");
            modalLikeText.textContent = "Đã thích";
        } else {
            modalLikeButton.classList.remove("liked");
            modalLikeText.textContent = "Thích";
        }
        modalTagsContainer.innerHTML = (imageData.tags || []).map(tag => `<span class="tag">${tag.name}</span>`).join('');
        modalTopicsContainer.innerHTML = (imageData.topics || []).map(topic => `<span class="tag">${topic.name}</span>`).join('');
        imageDetailModal.classList.remove("hidden");
        if (window.lucide) { lucide.createIcons(); }
    }

    function closeImageDetailModal() {
        imageDetailModal.classList.add("hidden");
    }

    // --- Hàm xử lý sự kiện ---

    function handleAddImage() {
        const newImageId = Date.now();
        const newImageUrl = `https://picsum.photos/400/300?new=${newImageId}`;
        const newImage = { id: newImageId, url: newImageUrl };
        images.push(newImage);

        const card = document.createElement("div");
        card.className = "image-card";
        card.dataset.imageId = newImage.id;
        const img = document.createElement("img");
        img.src = newImage.url;
        img.alt = `Ảnh ${newImage.id}`;
        card.appendChild(img);
        imageGrid.appendChild(card);
        alert("➕ Đã thêm một ảnh mới!");
        hasMoreImages = true;
    }

    function handleRemoveImage(imageId) {
        const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa ảnh này không?");
        if (isConfirmed) {
            // Đổi imageId sang string để so sánh an toàn
            const imageIdStr = String(imageId);
            images = images.filter((img) => String(img.id) !== imageIdStr);

            // ĐÃ SỬA: Xóa card khỏi DOM thay vì gọi render()
            const cardToRemove = imageGrid.querySelector(`.image-card[data-image-id="${imageIdStr}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
            }

            alert(`🗑 Đã xóa ảnh có ID: ${imageId}`);
        }
    }

    function setMode(newMode) {
        mode = newMode;
        // ĐÃ SỬA: Gọi hàm cập nhật UI đã được dọn dẹp
        renderUIUpdates();
    }

    // --- Gán sự kiện cho các phần tử ---
    deleteModeBtn.addEventListener("click", () => setMode('delete'));
    doneBtn.addEventListener("click", () => setMode('normal'));

    // Sự kiện cho popup
    modalExitButton.addEventListener("click", closeImageDetailModal);
    imageDetailModal.addEventListener("click", (event) => {
        if (event.target === imageDetailModal) {
            closeImageDetailModal();
        }
    });
    modalDownloadButton.addEventListener('click', () => alert('Chức năng Tải xuống đang được phát triển!'));
    modalCollectionButton.addEventListener('click', () => alert('Chức năng Thêm vào BST đang được phát triển!'));
    modalEditButton.addEventListener('click', () => alert('Chức năng Chỉnh sửa đang được phát triển!'));
    modalLikeButton.addEventListener('click', () => {
        alert('Bạn vừa like/unlike ảnh này! Logic cập nhật dữ liệu sẽ được thêm ở đây.');
    });

    // ĐÃ SỬA: Gộp 2 listener bị trùng vào làm một
    imageGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.image-card');
        if (!card) return;

        const imageId = card.dataset.imageId;
        if (mode === 'delete') {
            handleRemoveImage(imageId);
        } else if (mode === 'normal') {
            const imageData = images.find(img => String(img.id) === imageId);
            openImageDetailModal(imageData);
        }
    });

    // Sự kiện cuộn vô hạn
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            loadMoreImages();
        }
    });

    // --- Chạy lần đầu để hiển thị giao diện ---
    // ĐÃ SỬA: Thay thế lệnh gọi render() bằng các hàm mới
    renderUIUpdates();
    loadMoreImages();
});