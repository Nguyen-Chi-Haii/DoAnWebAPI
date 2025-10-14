document.addEventListener("DOMContentLoaded", () => {
    // --- Khai báo các biến trạng thái ---
    let formState = {
        name: "",
        description: "",
        isPublic: true,
    };
    let filesToUpload = []; // Mảng chứa các đối tượng File thật sự để gửi đi
    let previewImageUrls = []; // Mảng chứa các URL tạm thời để xem trước

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
        // Xóa tất cả ảnh cũ (trừ nút "Thêm ảnh")
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

        // Luôn thêm lại nút "Thêm ảnh" vào cuối
        imagePreviewContainer.appendChild(addImageBtn);
        lucide.createIcons(); // Cập nhật lại các icon
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
        privacyToggleBtn.className = `btn ${isPublic ? 'btn-blue' : 'btn-gray'}`;
        lucide.createIcons();
    }

    function handleImageUpload(event) {
        const newFiles = Array.from(event.target.files);
        if (newFiles.length === 0) return;

        // Thêm file mới vào mảng
        filesToUpload.push(...newFiles);

        // Tạo URL xem trước cho các file mới
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        previewImageUrls.push(...newUrls);

        renderPreviewImages();

        // Reset input để có thể chọn lại cùng 1 file
        fileInput.value = "";
    }

    function handleRemoveImage(index) {
        // Thu hồi URL cũ để giải phóng bộ nhớ
        URL.revokeObjectURL(previewImageUrls[index]);

        // Xóa file và URL xem trước tại vị trí index
        filesToUpload.splice(index, 1);
        previewImageUrls.splice(index, 1);

        renderPreviewImages();
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!formState.name.trim()) {
            alert("Vui lòng nhập tên bộ sưu tập!");
            nameInput.focus();
            return;
        }

        // Tạo đối tượng FormData để gửi đi (bao gồm cả file)
        const formData = new FormData();
        formData.append('Name', formState.name);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);

        // Thêm từng file ảnh vào FormData
        filesToUpload.forEach((file, index) => {
            formData.append('Images', file, file.name);
        });

        console.log("Dữ liệu sẵn sàng để gửi lên server:", formState);
        console.log("Số lượng ảnh:", filesToUpload.length);

        // --- Logic gửi formData lên server của bạn sẽ ở đây ---
        // Ví dụ:
        // fetch('/api/collections', {
        //     method: 'POST',
        //     body: formData 
        // }).then(...);

        alert("✅ Đã tạo bộ sưu tập mới! (Kiểm tra console để xem dữ liệu)");
        // Chuyển hướng hoặc reset form sau khi thành công
        // window.location.href = "/Collection";
    }

    // --- Gán sự kiện ---
    nameInput.addEventListener('input', (e) => handleInputChange('name', e.target.value));
    descriptionInput.addEventListener('input', (e) => handleInputChange('description', e.target.value));
    privacyToggleBtn.addEventListener('click', handlePrivacyToggle);
    addImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy? Mọi thay đổi sẽ bị mất.")) {
            window.location.href = "/Collection/Collection"; // Hoặc trang trước đó
        }
    });
    cancelBtn.addEventListener('click', () => {
        // 1. Hiển thị hộp thoại xác nhận để tránh mất dữ liệu
        if (confirm("Bạn có chắc muốn hủy? Mọi thay đổi sẽ bị mất.")) {

            // 2. Nếu người dùng nhấn "OK", chuyển hướng về trang Collection
            window.location.href = "/Collection/Collection";
        }
        // 3. Nếu người dùng nhấn "Cancel", không làm gì cả
    });

    // --- Khởi tạo ---
    lucide.createIcons(); // Render icon lần đầu
});