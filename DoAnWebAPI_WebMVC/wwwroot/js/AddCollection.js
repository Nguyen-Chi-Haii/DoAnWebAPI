document.addEventListener("DOMContentLoaded", () => {
    // ✅ Bỏ kiểm tra token - cho phép tạo collection không cần đăng nhập
    console.log('=== AddCollection.js loaded ===');

    // --- Khai báo các biến trạng thái ---
    let formState = {
        name: "",
        description: "",
        isPublic: true,
    };
    let filesToUpload = [];
    let previewImageUrls = [];

    // --- Lấy các phần tử DOM ---
    const form = document.getElementById("add-collection-form");
    const nameInput = document.getElementById("collection-name");
    const descriptionInput = document.getElementById("collection-description");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
    const privacyStatusText = document.getElementById("privacy-status-text");
    const fileInput = document.getElementById("file-input");
    const addImageBtn = document.getElementById("add-image-btn");
    const imagePreviewContainer = document.getElementById("image-preview-container");
    const cancelBtn = document.getElementById("cancel-btn");

    // --- Hàm render ảnh xem trước ---
    function renderPreviewImages() {
        imagePreviewContainer.innerHTML = '';

        previewImageUrls.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';

            const img = document.createElement('img');
            img.src = url;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => handleRemoveImage(index);

            item.appendChild(img);
            item.appendChild(removeBtn);
            imagePreviewContainer.appendChild(item);
        });

        imagePreviewContainer.appendChild(addImageBtn);
        lucide.createIcons();
    }

    // --- Các hàm xử lý sự kiện ---
    function handleInputChange(field, value) {
        formState[field] = value;
    }

    function handlePrivacyToggle() {
        formState.isPublic = !formState.isPublic;
        const isPublic = formState.isPublic;

        privacyStatusText.textContent = isPublic ? "Công khai" : "Riêng tư";
        privacyToggleBtn.innerHTML = `
            <i data-lucide="${isPublic ? 'globe' : 'lock'}"></i>
            <span>${isPublic ? 'Công khai' : 'Riêng tư'}</span>
        `;
    }

    async function handleImageUpload(e) {
        const files = e.target.files;
        for (let file of files) {
            const formData = new FormData();
            formData.append('file', file);
            // Thêm các trường bắt buộc khác nếu API yêu cầu
            formData.append('title', file.name.split('.')[0]); // Dùng tên file làm title tạm
            formData.append('description', '');
            formData.append('tags', JSON.stringify([]));
            formData.append('topicId', ''); // hoặc một giá trị mặc định

            try {
                const uploadedImage = await api.images.create(formData);
                console.log('Uploaded image:', uploadedImage); // Debug

                // API có thể trả về { id, url, ... } hoặc chỉ id
                const imageId = uploadedImage.id || uploadedImage;
                const imageUrl = uploadedImage.url || uploadedImage.thumbnailUrl || URL.createObjectURL(file);

                filesToUpload.push(imageId);
                previewImageUrls.push(imageUrl);
            } catch (error) {
                console.error('Lỗi upload:', error);
                alert(`Lỗi khi upload ảnh: ${error.message}`);
            }
        }
        renderPreviewImages();
        fileInput.value = ''; // Reset input
    }

    function handleRemoveImage(index) {
        filesToUpload.splice(index, 1);
        previewImageUrls.splice(index, 1);
        renderPreviewImages();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!formState.name.trim()) {
            alert("Vui lòng nhập tên bộ sưu tập!");
            nameInput.focus();
            return;
        }

        const data = {
            name: formState.name,
            description: formState.description,
            isPublic: formState.isPublic,
            imageIds: filesToUpload
        };

        console.log('=== DEBUG SUBMIT ===');
        console.log('Data to submit:', data);
        console.log('===================');

        try {
            const response = await api.collections.create(data);
            console.log('Collection created:', response);

            // Cập nhật localStorage
            const storedData = JSON.parse(localStorage.getItem('allCollectionsData') || '[]');
            const newCollection = {
                ...data,
                id: response.id || response,
                thumbnail: previewImageUrls[0] || '/images/default-collection.png',
                images: filesToUpload.map(id => ({ id }))
            };
            localStorage.setItem('allCollectionsData', JSON.stringify([...storedData, newCollection]));

            alert("✅ Đã tạo bộ sưu tập mới!");
            window.location.href = "/Collection/Collection";
        } catch (error) {
            console.error('=== ERROR DETAILS ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('====================');
            alert(`Lỗi khi tạo bộ sưu tập: ${error.message}`);
        }
    }

    // --- Gán sự kiện ---
    nameInput.addEventListener('input', (e) => handleInputChange('name', e.target.value));
    descriptionInput.addEventListener('input', (e) => handleInputChange('description', e.target.value));
    privacyToggleBtn.addEventListener('click', handlePrivacyToggle);
    addImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy?")) {
            window.location.href = "/Collection/Collection";
        }
    });

    // --- Khởi tạo ---
    lucide.createIcons();
});