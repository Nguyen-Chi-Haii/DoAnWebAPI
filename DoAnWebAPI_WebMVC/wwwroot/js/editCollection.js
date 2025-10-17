document.addEventListener("DOMContentLoaded", () => {
    // ✅ SỬA: Thay Firebase bằng kiểm tra token
    const isAuthenticated = !!getToken();
    if (!isAuthenticated) {
        document.body.innerHTML = '<h2>Vui lòng đăng nhập để chỉnh sửa.</h2>';
        return;
    }

    // --- LẤY DỮ LIỆU BAN ĐẦU ---
    const container = document.getElementById("edit-collection-form").closest('.form-container');
    const collectionId = container.dataset.collectionId;
    let initialData;

    async function loadInitialData() {
        let allCollectionsData = JSON.parse(localStorage.getItem('allCollectionsData'));
        initialData = allCollectionsData ? allCollectionsData.find(c => c.id === collectionId) : null;

        if (!initialData) {
            try {
                initialData = await request(`/collections/${collectionId}`, 'GET');
                const storedData = JSON.parse(localStorage.getItem('allCollectionsData') || '[]');
                const updatedData = [...storedData.filter(c => c.id !== collectionId), initialData];
                localStorage.setItem('allCollectionsData', JSON.stringify(updatedData));
            } catch (e) {
                console.error(e);
                container.innerHTML = "<h2>Lỗi khi tải bộ sưu tập.</h2>";
                return;
            }
        }

        initializeForm();
    }

    // --- KHAI BÁO CÁC BIẾN TRẠNG THÁI ---
    let formState = {
        name: '',
        description: '',
        isPublic: true,
    };
    let displayedImages = [];
    let newFilesToUpload = [];
    let deletedImageIds = [];

    function initializeForm() {
        formState = {
            name: initialData.name,
            description: initialData.description,
            isPublic: initialData.isPublic ?? true,
        };
        displayedImages = initialData.images.map(img => ({ ...img, isNew: false, src: img.thumbnail }));

        populateForm();
    }

    // --- LẤY CÁC PHẦN TỬ DOM ---
    const form = document.getElementById("edit-collection-form");
    const nameInput = document.getElementById("collection-name");
    const descriptionInput = document.getElementById("collection-description");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
    const privacyStatusText = document.getElementById("privacy-status-text");
    const fileInput = document.getElementById("file-input");
    const addImageBtn = document.getElementById("add-image-btn");
    const imagePreviewContainer = document.getElementById("image-preview-container");
    const cancelBtn = document.getElementById("cancel-btn");

    // --- CÁC HÀM RENDER VÀ XỬ LÝ ---
    function renderPreviewImages() {
        imagePreviewContainer.innerHTML = '';
        displayedImages.forEach((image) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            const img = document.createElement('img');
            img.src = image.src;
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => handleRemoveImage(image.id);
            item.appendChild(img);
            item.appendChild(removeBtn);
            imagePreviewContainer.appendChild(item);
        });
        imagePreviewContainer.appendChild(addImageBtn);
        lucide.createIcons();
    }

    function handleRemoveImage(idToRemove) {
        const imageToRemove = displayedImages.find(img => img.id === idToRemove);
        if (!imageToRemove) return;

        if (!imageToRemove.isNew) {
            deletedImageIds.push(idToRemove);
        } else {
            const fileIndex = newFilesToUpload.findIndex(file => file.tempId === idToRemove);
            if (fileIndex > -1) newFilesToUpload.splice(fileIndex, 1);
        }

        displayedImages = displayedImages.filter(img => img.id !== idToRemove);
        renderPreviewImages();
    }

    function handleImageUpload(e) {
        const newFiles = Array.from(e.target.files);
        const tempIdStart = Date.now();
        const newImageObjects = newFiles.map((file, index) => {
            const tempId = tempIdStart + index;
            return {
                id: tempId,
                src: URL.createObjectURL(file),
                isNew: true,
            };
        });

        newFilesToUpload.push(...newFiles);
        displayedImages.push(...newImageObjects);
        renderPreviewImages();
        fileInput.value = "";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData();
        formData.append('Id', collectionId);
        formData.append('Name', formState.name);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);

        deletedImageIds.forEach(id => {
            formData.append('DeletedImageIds', id);
        });

        newFilesToUpload.forEach(file => {
            formData.append('NewImages', file, file.name);
        });

        try {
            await request(`/collections/${collectionId}`, 'PUT', formData);
            alert("✅ Đã cập nhật bộ sưu tập!");
            window.location.href = "/Collection/Collection";
        } catch (e) {
            alert("Lỗi khi cập nhật bộ sưu tập");
        }
    }

    function populateForm() {
        nameInput.value = formState.name;
        descriptionInput.value = formState.description;

        const isPublic = formState.isPublic;
        privacyStatusText.textContent = isPublic ? "Công khai" : "Riêng tư";
        privacyToggleBtn.innerHTML = `<i data-lucide="${isPublic ? 'globe' : 'lock'}"></i><span>${isPublic ? 'Công khai' : 'Riêng tư'}</span>`;
        privacyToggleBtn.className = `btn ${isPublic ? 'btn-blue' : 'btn-gray'}`;

        renderPreviewImages();
    }

    // --- GÁN SỰ KIỆN ---
    nameInput.addEventListener('input', (e) => formState.name = e.target.value);
    descriptionInput.addEventListener('input', (e) => formState.description = e.target.value);
    privacyToggleBtn.addEventListener('click', () => {
        formState.isPublic = !formState.isPublic;
        populateForm();
    });
    addImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy?")) {
            window.location.href = "/Collection/Collection";
        }
    });

    // --- KHỞI TẠO ---
    loadInitialData();
});