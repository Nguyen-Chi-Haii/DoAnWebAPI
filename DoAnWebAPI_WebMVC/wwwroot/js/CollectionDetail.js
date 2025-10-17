document.addEventListener("DOMContentLoaded", async () => {
    // --- BƯỚC 1: Lấy các phần tử DOM quan trọng ngay từ đầu ---
    const container = document.getElementById("collection-container");

    if (!container) {
        console.error("Lỗi nghiêm trọng: Không tìm thấy #collection-container trong HTML.");
        return;
    }

    // ✅ SỬA: Thay Firebase bằng kiểm tra token
    const isAuthenticated = !!getToken();
    if (!isAuthenticated) {
        container.innerHTML = '<h2>Vui lòng đăng nhập để xem chi tiết.</h2>';
        return;
    }

    // --- BƯỚC 2: Lấy dữ liệu và kiểm tra ---
    const collectionId = container.dataset.collectionId;

    let collectionData;
    try {
        collectionData = await request(`/collections/${collectionId}`, 'GET');
    } catch (e) {
        console.error(e);
        container.innerHTML = "<h2>Lỗi khi tải bộ sưu tập.</h2>";
        return;
    }

    // --- BƯỚC 3: Khai báo các biến và phần tử DOM ---
    let images = [...collectionData.images];
    let mode = "normal";

    let currentPage = 1;
    const itemsPerPage = 6;
    let isLoading = false;
    let hasMoreImages = images.length > itemsPerPage;

    const nameEl = document.getElementById("collection-name");
    const descriptionEl = document.getElementById("collection-description");
    const imageGrid = document.getElementById("image-grid");
    const addBtn = document.getElementById("add-image-btn");
    const deleteModeBtn = document.getElementById("delete-mode-btn");
    const doneBtn = document.getElementById("done-btn");
    const normalModeButtons = document.getElementById("normal-mode-buttons");
    const deleteModeButtons = document.getElementById("delete-mode-buttons");

    const imageDetailModal = document.getElementById("image-detail-modal");
    const modalExitButton = document.getElementById("modal-exit-button");
    const modalMainImage = document.getElementById("modal-main-image");
    const modalImageTitle = document.getElementById("modal-image-title");
    const modalImageId = document.getElementById("modal-image-id");
    const modalImageDescription = document.getElementById("modal-image-description");

    // --- Hàm render UI ---
    function renderUIUpdates() {
        nameEl.textContent = collectionData.name;
        descriptionEl.textContent = collectionData.description || "Không có mô tả";

        imageGrid.innerHTML = images.slice(0, currentPage * itemsPerPage).map(img => `
            <div class="image-card" data-image-id="${img.id}">
                <img src="${img.url}" alt="${img.title}">
                <p>${img.title}</p>
            </div>
        `).join('');

        if (!isAuthenticated) {
            normalModeButtons.innerHTML = '<p>Vui lòng đăng nhập để quản lý.</p>';
            deleteModeButtons.style.display = 'none';
            return;
        }

        normalModeButtons.innerHTML = `
            <a href="/Collection/EditCollection?collectionId=${collectionId}" class="btn btn-warning">Sửa</a>
            <a href="/Collection/DeleteCollection?collectionId=${collectionId}" class="btn btn-red">Xóa</a>
            <a href="/Image/AddImage?collectionId=${collectionId}" id="add-image-btn" class="btn btn-blue">Thêm ảnh</a>
            <button id="delete-mode-btn" class="btn btn-red">Xóa ảnh</button>
        `;

        normalModeButtons.style.display = mode === 'normal' ? 'flex' : 'none';
        deleteModeButtons.style.display = mode === 'delete' ? 'flex' : 'none';
    }

    // --- Hàm tải thêm ảnh ---
    async function loadMoreImages() {
        if (isLoading || !hasMoreImages) return;
        isLoading = true;
        try {
            const newImages = await request(`/collections/${collectionId}/images?page=${currentPage + 1}`, 'GET');
            if (newImages.length === 0) hasMoreImages = false;
            images = [...images, ...newImages];
            currentPage++;
            renderUIUpdates();
        } catch (e) {
            console.error(e);
            hasMoreImages = false;
        }
        isLoading = false;
    }

    // --- Xóa ảnh ---
    async function handleRemoveImage(imageIdStr) {
        try {
            await request(`/collections/${collectionId}/images/${imageIdStr}`, 'DELETE');
            images = images.filter(img => String(img.id) !== imageIdStr);
            renderUIUpdates();
            alert(`Đã xóa ảnh ID: ${imageIdStr}`);
        } catch (e) {
            alert('Lỗi khi xóa ảnh');
        }
    }

    // --- Mở modal chi tiết ảnh ---
    function openImageDetailModal(imageData) {
        modalMainImage.src = imageData.url;
        modalImageTitle.textContent = imageData.title;
        modalImageId.textContent = imageData.id;
        modalImageDescription.textContent = imageData.description;
        imageDetailModal.style.display = 'block';
    }

    // --- Đóng modal ---
    function closeImageDetailModal() {
        imageDetailModal.style.display = 'none';
    }

    // --- Gán sự kiện ---
    deleteModeBtn.addEventListener("click", () => { mode = 'delete'; renderUIUpdates(); });
    doneBtn.addEventListener("click", () => { mode = 'normal'; renderUIUpdates(); });

    modalExitButton.addEventListener("click", closeImageDetailModal);
    imageDetailModal.addEventListener("click", (event) => {
        if (event.target === imageDetailModal) closeImageDetailModal();
    });

    imageGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.image-card');
        if (!card) return;

        const imageId = card.dataset.imageId;
        if (mode === 'delete') {
            handleRemoveImage(imageId);
        } else {
            const imageData = images.find(img => String(img.id) === imageId);
            openImageDetailModal(imageData);
        }
    });

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            loadMoreImages();
        }
    });

    // Khởi tạo
    renderUIUpdates();
});