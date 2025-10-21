document.addEventListener("DOMContentLoaded", () => {
    // --- Khai báo các biến trạng thái ---
    let formState = {
        name: "",
        description: "",
        isPublic: true,
        imageIds: [], // Chỉ cần mảng ID ảnh đã chọn
    };

    // --- Lấy các phần tử DOM ---
    const form = document.getElementById("add-collection-form");
    const nameInput = document.getElementById("collection-name");
    const descriptionInput = document.getElementById("collection-description");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
    const addImageBtn = document.getElementById("add-image-btn");
    const imagePreviewContainer = document.getElementById("image-preview-container");
    const cancelBtn = document.getElementById("cancel-btn");
    const submitBtn = form.querySelector('button[type="submit"]');

    const selectPhotosModal = document.getElementById('select-photos-modal');
    const selectPhotosCloseBtn = document.getElementById('select-photos-close-btn');
    const myPhotosGrid = document.getElementById('my-photos-grid');
    const selectionCounter = document.getElementById('selection-counter');
    const addSelectedPhotosBtn = document.getElementById('add-selected-photos-btn');

    let tempSelectedIds = [];

    // --- Các hàm xử lý Modal ---
    const openSelectPhotosModal = async () => {
        selectPhotosModal.classList.remove('hidden');
        myPhotosGrid.innerHTML = '<div class="loader">Đang tải ảnh của bạn...</div>';
        tempSelectedIds = [...formState.imageIds];
        updateSelectionCounter();

        try {
            const allUserImages = await api.images.getByUser(CURRENT_USER_ID);
            const approvedImages = allUserImages.filter(img => img.status && img.status.toLowerCase() === 'approved');

            myPhotosGrid.innerHTML = '';
            if (approvedImages.length === 0) {
                myPhotosGrid.innerHTML = '<p>Bạn chưa có ảnh nào được duyệt để thêm.</p>';
                return;
            }

            approvedImages.forEach(img => {
                const item = document.createElement('div');
                item.className = 'my-photos-item';
                item.dataset.imageId = img.id;
                item.innerHTML = `<img src="${img.thumbnailUrl}" alt="${img.title}" />`;
                if (tempSelectedIds.includes(img.id)) {
                    item.classList.add('selected');
                }
                item.addEventListener('click', () => toggleImageSelection(item));
                myPhotosGrid.appendChild(item);
            });
        } catch (error) {
            myPhotosGrid.innerHTML = `<p class="error">Lỗi khi tải ảnh: ${error.message}</p>`;
        }
    };
    const closeSelectPhotosModal = () => selectPhotosModal.classList.add('hidden');

    const toggleImageSelection = (item) => {
        item.classList.toggle('selected');
        const imageId = parseInt(item.dataset.imageId);
        if (item.classList.contains('selected')) {
            if (!tempSelectedIds.includes(imageId)) tempSelectedIds.push(imageId);
        } else {
            tempSelectedIds = tempSelectedIds.filter(id => id !== imageId);
        }
        updateSelectionCounter();
    };

    const updateSelectionCounter = () => {
        selectionCounter.textContent = `Đã chọn: ${tempSelectedIds.length} ảnh`;
        addSelectedPhotosBtn.disabled = tempSelectedIds.length === 0;
    };


    // --- Hàm render ảnh xem trước ---
    async function renderPreviewImages() {
        imagePreviewContainer.innerHTML = ''; // Xóa preview cũ
        if (formState.imageIds.length > 0) {
            const imageInfoPromises = formState.imageIds.map(id => api.images.getById(id));
            try {
                const imagesData = await Promise.all(imageInfoPromises);
                const previewItems = imagesData.map(imgData => `
                    <div class="image-preview-item" data-image-id="${imgData.id}">
                        <img src="${imgData.thumbnailUrl}" />
                        <button type="button" class="remove-btn">&times;</button>
                    </div>
                `).join('');
                imagePreviewContainer.innerHTML = previewItems;
            } catch (e) { console.error("Lỗi render preview", e); }
        }
        imagePreviewContainer.appendChild(addImageBtn);
    }

    // --- Xử lý sự kiện ---
    addImageBtn.addEventListener('click', openSelectPhotosModal); // Nút "Thêm ảnh" giờ trực tiếp mở modal chọn ảnh
    selectPhotosCloseBtn.addEventListener('click', closeSelectPhotosModal);
    selectPhotosModal.addEventListener('click', (e) => { if (e.target === selectPhotosModal) closeSelectPhotosModal(); });

    addSelectedPhotosBtn.addEventListener('click', () => {
        formState.imageIds = [...tempSelectedIds];
        renderPreviewImages();
        closeSelectPhotosModal();
    });

    imagePreviewContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const item = removeBtn.closest('.image-preview-item');
            const imageId = parseInt(item.dataset.imageId);
            formState.imageIds = formState.imageIds.filter(id => id !== imageId);
            renderPreviewImages();
        }
    });

    // --- Hàm Submit Form ---
    async function handleSubmit(event) {
        event.preventDefault();
        formState.name = nameInput.value;
        formState.description = descriptionInput.value;

        if (!formState.name.trim()) {
            alert("Vui lòng nhập tên bộ sưu tập!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang lưu...';
        lucide.createIcons();

        try {
            const collectionData = {
                Name: formState.name,
                Description: formState.description,
                IsPublic: formState.isPublic,
                UserId: parseInt(CURRENT_USER_ID),
                ImageIds: formState.imageIds // Chỉ gửi danh sách ID đã chọn
            };

            await api.collections.create(collectionData);

            alert("✅ Tạo bộ sưu tập thành công!");
            window.history.back();

        } catch (error) {
            alert(`❌ Lỗi khi tạo bộ sưu tập: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Lưu bộ sưu tập';
            lucide.createIcons();
        }
    }
    function preloadInitialImage() {
        // Các biến này được truyền từ AddCollection.cshtml
        if (typeof INITIAL_IMAGE_ID !== 'undefined' && INITIAL_IMAGE_ID) {
            formState.imageIds.push(parseInt(INITIAL_IMAGE_ID));
            renderPreviewImages();
        }
    }

    // --- Gán các sự kiện còn lại ---
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy? Mọi thay đổi sẽ bị mất.")) {
            window.history.back();
        }
    });

    const privacyStatusText = document.getElementById("privacy-status-text");
    privacyToggleBtn.addEventListener('click', () => {
        formState.isPublic = !formState.isPublic;
        const newText = formState.isPublic ? 'Công khai' : 'Riêng tư';
        const newIcon = formState.isPublic ? 'globe' : 'lock';
        privacyStatusText.textContent = newText;
        privacyToggleBtn.innerHTML = `<i data-lucide="${newIcon}"></i><span>${newText}</span>`;
        lucide.createIcons();
    });
    preloadInitialImage();
});