document.addEventListener("DOMContentLoaded", () => {
    // --- Lấy ID từ container ---
    const container = document.querySelector('.form-container');
    const collectionId = container.dataset.collectionId;

    if (!collectionId) {
        container.innerHTML = "<h2>Lỗi: Không tìm thấy ID của bộ sưu tập.</h2>";
        return;
    }

    // --- Khai báo biến trạng thái ---
    let formState = {
        name: "",
        description: "",
        isPublic: true,
        imageIds: [],
    };

    // --- Lấy các phần tử DOM ---
    const form = document.getElementById("edit-collection-form");
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
    const updateSelectedPhotosBtn = document.getElementById('update-selected-photos-btn');

    let tempSelectedIds = [];

    // --- Các hàm xử lý Modal ---
    const openSelectPhotosModal = async () => {
        selectPhotosModal.classList.remove('hidden');
        myPhotosGrid.innerHTML = '<div class="loader">Đang tải ảnh của bạn...</div>';
        tempSelectedIds = [...formState.imageIds];
        updateSelectionCounter();

        try {
            const allUserImages = await api.images.getByUser(CURRENT_USER_ID);

            // ✅ THAY ĐỔI Ở ĐÂY: Lọc để chỉ lấy ảnh đã được duyệt
            const approvedImages = allUserImages.filter(img => img.status && img.status.toLowerCase() === 'approved');

            myPhotosGrid.innerHTML = '';
            if (approvedImages.length === 0) {
                myPhotosGrid.innerHTML = '<p>Bạn chưa có ảnh nào được duyệt để thêm vào bộ sưu tập.</p>';
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
    };

    // --- Hàm render ảnh xem trước ---
    async function renderPreviewImages() {
        imagePreviewContainer.innerHTML = ''; // Xóa sạch preview cũ

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
            } catch (e) {
                console.error("Lỗi khi render ảnh xem trước:", e);
                imagePreviewContainer.innerHTML = '<p class="error">Không thể tải ảnh xem trước.</p>';
            }
        }

        imagePreviewContainer.appendChild(addImageBtn);
    }

    // --- Hàm tải dữ liệu ban đầu ---
    async function loadInitialData() {
        try {
            const collectionData = await api.collections.getById(collectionId);
            const imagesInCollection = collectionData.images || [];

            formState = {
                name: collectionData.name,
                description: collectionData.description,
                isPublic: collectionData.isPublic,
                imageIds: imagesInCollection.map(img => img.id),
            };

            nameInput.value = formState.name;
            descriptionInput.value = formState.description;

            updatePrivacyStatus();
            await renderPreviewImages();
        } catch (error) {
            container.innerHTML = `<h2>Lỗi khi tải dữ liệu bộ sưu tập: ${error.message}</h2>`;
        }
    }

    // --- Các hàm cập nhật UI khác ---
    const updatePrivacyStatus = () => {
        const privacyStatusText = document.getElementById("privacy-status-text");
        const newText = formState.isPublic ? 'Công khai' : 'Riêng tư';
        const newIcon = formState.isPublic ? 'globe' : 'lock';
        privacyStatusText.textContent = newText;
        privacyToggleBtn.innerHTML = `<i data-lucide="${newIcon}"></i><span>${newText}</span>`;
        lucide.createIcons();
    };

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
            const updateDto = {
                Name: formState.name,
                Description: formState.description,
                IsPublic: formState.isPublic,
                ImageIds: formState.imageIds
            };
            await api.collections.update(collectionId, updateDto);
            alert("✅ Cập nhật bộ sưu tập thành công!");
            window.history.back();
        } catch (error) {
            alert(`❌ Lỗi khi cập nhật: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Lưu thay đổi';
            lucide.createIcons();
        }
    }

    // --- Gán sự kiện ---
    addImageBtn.addEventListener('click', openSelectPhotosModal);
    selectPhotosCloseBtn.addEventListener('click', closeSelectPhotosModal);
    selectPhotosModal.addEventListener('click', (e) => { if (e.target === selectPhotosModal) closeSelectPhotosModal(); });

    updateSelectedPhotosBtn.addEventListener('click', async () => {
        formState.imageIds = [...tempSelectedIds];
        await renderPreviewImages();
        closeSelectPhotosModal();
    });

    imagePreviewContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const item = removeBtn.closest('.image-preview-item');
            const imageIdToRemove = parseInt(item.dataset.imageId);

            formState.imageIds = formState.imageIds.filter(id => id !== imageIdToRemove);
            renderPreviewImages();
        }
    });

    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy? Mọi thay đổi sẽ không được lưu.")) {
            window.history.back();
        }
    });

    privacyToggleBtn.addEventListener('click', () => {
        formState.isPublic = !formState.isPublic;
        updatePrivacyStatus();
    });

    // --- KHỞI CHẠY ---
    loadInitialData();
});