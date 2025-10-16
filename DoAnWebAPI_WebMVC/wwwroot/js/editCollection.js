document.addEventListener("DOMContentLoaded", () => {
    // --- LẤY DỮ LIỆU BAN ĐẦU ---
    const container = document.getElementById("edit-collection-form").closest('.form-container');
    const collectionId = container.dataset.collectionId;
    const allCollectionsData = JSON.parse(localStorage.getItem('allCollectionsData'));
    const initialData = allCollectionsData ? allCollectionsData.find(c => c.id === collectionId) : null;

    if (!initialData) {
        container.innerHTML = "<h2>Lỗi: Không tìm thấy dữ liệu của bộ sưu tập này.</h2>";
        return;
    }

    // --- KHAI BÁO CÁC BIẾN TRẠNG THÁI ---
    let formState = {
        name: initialData.name,
        description: initialData.description,
        isPublic: initialData.isPublic ?? true,
    };
    // Mảng quản lý các ảnh sẽ hiển thị trên UI
    let displayedImages = initialData.images.map(img => ({ ...img, isNew: false, src: img.thumbnail }));

    // Mảng quản lý các file mới cần tải lên
    let newFilesToUpload = [];
    // Mảng quản lý ID của các ảnh cũ cần xóa
    let deletedImageIds = [];


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
            img.src = image.src; // src có thể là thumbnail cũ hoặc blob URL mới
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

        // Nếu là ảnh cũ (không phải mới thêm), ghi nhận ID để xóa ở server
        if (!imageToRemove.isNew) {
            deletedImageIds.push(idToRemove);
        } else {
            // Nếu là ảnh mới, tìm và xóa file tương ứng trong newFilesToUpload
            newFilesToUpload = newFilesToUpload.filter(file => file.tempId !== idToRemove);
            URL.revokeObjectURL(imageToRemove.src); // Giải phóng bộ nhớ
        }

        // Cập nhật lại mảng ảnh hiển thị
        displayedImages = displayedImages.filter(img => img.id !== idToRemove);
        renderPreviewImages();
    }

    function handleImageUpload(event) {
        const newFiles = Array.from(event.target.files);
        if (newFiles.length === 0) return;

        const newImageObjects = newFiles.map(file => {
            const tempId = `new_${Date.now()}_${Math.random()}`;
            file.tempId = tempId; // Gán ID tạm cho file để xóa nếu cần
            return {
                id: tempId,
                src: URL.createObjectURL(file),
                isNew: true, // Đánh dấu đây là ảnh mới
            };
        });

        newFilesToUpload.push(...newFiles);
        displayedImages.push(...newImageObjects);
        renderPreviewImages();
        fileInput.value = "";
    }

    function handleSubmit(event) {
        event.preventDefault();
        // ... (validation)

        const formData = new FormData();
        formData.append('Id', collectionId); // Gửi ID của bộ sưu tập đang sửa
        formData.append('Name', formState.name);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);

        // Gửi danh sách ID ảnh cần xóa
        deletedImageIds.forEach(id => {
            formData.append('DeletedImageIds', id);
        });

        // Gửi danh sách file ảnh mới cần thêm
        newFilesToUpload.forEach(file => {
            formData.append('NewImages', file, file.name);
        });

        console.log("Dữ liệu cập nhật sẵn sàng để gửi:", {
            ...formState,
            id: collectionId,
            deletedImageIds,
            newImageCount: newFilesToUpload.length
        });

        alert("✅ Đã cập nhật bộ sưu tập! (Kiểm tra console để xem FormData)");
        // fetch(`/api/collections/${collectionId}`, { method: 'PUT', body: formData })...
        window.location.href = "/Collection/Collection";
    }

    function populateForm() {
        nameInput.value = formState.name;
        descriptionInput.value = formState.description;

        // Cập nhật nút privacy
        const isPublic = formState.isPublic;
        privacyStatusText.textContent = isPublic ? "Công khai" : "Riêng tư";
        privacyToggleBtn.innerHTML = `<i data-lucide="${isPublic ? 'globe' : 'lock'}"></i><span>${isPublic ? 'Công khai' : 'Riêng tư'}</span>`;
        privacyToggleBtn.className = `btn ${isPublic ? 'btn-blue' : 'btn-gray'}`;

        renderPreviewImages();
    }

    // --- GÁN SỰ KIỆN ---
    // (Các sự kiện input, toggle, cancel, submit tương tự như file addCollection.js)
    nameInput.addEventListener('input', (e) => formState.name = e.target.value);
    descriptionInput.addEventListener('input', (e) => formState.description = e.target.value);
    privacyToggleBtn.addEventListener('click', () => {
        formState.isPublic = !formState.isPublic;
        populateForm(); // Gọi lại để cập nhật UI
    });
    addImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy? Mọi thay đổi sẽ không được lưu.")) {
            window.location.href = "/Collection/Collection";
        }
    });

    // --- KHỞI TẠO ---
    populateForm(); // Điền dữ liệu ban đầu vào form
});
