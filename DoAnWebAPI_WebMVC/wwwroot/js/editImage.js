document.addEventListener("DOMContentLoaded", () => {
    // --- LẤY DỮ LIỆU BAN ĐẦU ---
    const container = document.getElementById("edit-image-form").closest('.form-container');
    const imageId = container.dataset.imageId;
    const myImagesData = JSON.parse(localStorage.getItem('myImagesData'));
    const initialData = myImagesData ? myImagesData.find(img => img.id === imageId) : null;

    if (!initialData) {
        container.innerHTML = "<h2>Lỗi: Không tìm thấy dữ liệu của ảnh này.</h2>";
        return;
    }

    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ DOM ---
    let formState = {
        title: initialData.title || "",
        description: initialData.description || "",
        isPublic: initialData.isPublic ?? true,
        file: null,
        tags: (initialData.tags || []).map(t => t.name),
        topics: (initialData.topics || []).map(t => t.name),
    };

    const tagSuggestions = ["Phong cảnh", "Động vật", "Con người", "Nghệ thuật", "Kiến trúc"];
    const topicSuggestions = ["Mùa hè", "Du lịch", "Đời sống", "Tự nhiên", "Tết"];

    // Lấy các phần tử DOM
    const form = document.getElementById("edit-image-form");
    const titleInput = document.getElementById("image-title");
    const descriptionInput = document.getElementById("image-description");
    const imagePreview = document.getElementById("image-preview");
    const uploadImageBtn = document.getElementById("upload-image-btn");
    const fileInput = document.getElementById("file-input");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
    const privacyStatusText = document.getElementById("privacy-status-text");
    const tagInput = document.getElementById("tag-input");
    const tagSuggestionsEl = document.getElementById("tag-suggestions");
    const selectedTagsEl = document.getElementById("selected-tags");
    const topicInput = document.getElementById("topic-input");
    const topicSuggestionsEl = document.getElementById("topic-suggestions");
    const selectedTopicsEl = document.getElementById("selected-topics");
    const cancelBtn = document.getElementById("cancel-btn");

    // --- HÀM ĐIỀN DỮ LIỆU BAN ĐẦU VÀO FORM ---
    function populateForm() {
        titleInput.value = formState.title;
        descriptionInput.value = formState.description;

        // Hiển thị ảnh cũ
        imagePreview.src = initialData.thumbnail || initialData.url;
        imagePreview.classList.remove('hidden');

        // Cập nhật nút privacy
        const isPublic = formState.isPublic;
        privacyStatusText.textContent = isPublic ? "Công khai" : "Riêng tư";
        privacyToggleBtn.innerHTML = `<i data-lucide="${isPublic ? 'globe' : 'lock'}"></i><span>${isPublic ? 'Công khai' : 'Riêng tư'}</span>`;
        privacyToggleBtn.className = `btn ${isPublic ? 'btn-blue' : 'btn-gray'}`;

        // Render tags và topics ban đầu
        renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
        renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);

        if (window.lucide) lucide.createIcons();
    }

    // --- CÁC HÀM RENDER VÀ XỬ LÝ (Tái sử dụng từ addImage.js) ---
    // Các hàm renderPills, renderSuggestions, add/remove Tag/Topic, handleImageUpload
    // giống hệt như trong file addImage.js. Bạn có thể sao chép chúng vào đây.
    const renderPills = (container, pills, pillClass, onRemove) => {
        container.innerHTML = pills.map(text => `<span class="${pillClass}" data-value="${text}">${text}<i data-lucide="x" class="pill-remove-btn"></i></span>`).join('');
        if (window.lucide) lucide.createIcons();
        container.querySelectorAll('.pill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => onRemove(btn.closest('span').dataset.value));
        });
    };
    const renderSuggestions = (container, suggestions, onAdd) => {
        container.innerHTML = '';
        suggestions.forEach(text => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = text;
            item.onclick = () => onAdd(text);
            container.appendChild(item);
        });
    };
    const addTag = (tag) => {
        tag = tag.trim();
        if (tag && !formState.tags.includes(tag)) {
            formState.tags.push(tag);
            renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
        }
        tagInput.value = '';
        updateTagSuggestions();
    };
    const removeTag = (tag) => {
        formState.tags = formState.tags.filter(t => t !== tag);
        renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
    };
    const updateTagSuggestions = () => {
        const query = tagInput.value.toLowerCase();
        const filtered = query ? tagSuggestions.filter(t => !formState.tags.includes(t) && t.toLowerCase().includes(query)) : [];
        renderSuggestions(tagSuggestionsEl, filtered, addTag);
    };
    const addTopic = (topic) => {
        topic = topic.trim();
        if (topic && !formState.topics.includes(topic)) {
            formState.topics.push(topic);
            renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);
        }
        topicInput.value = '';
        updateTopicSuggestions();
    };
    const removeTopic = (topic) => {
        formState.topics = formState.topics.filter(t => t !== topic);
        renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);
    };
    const updateTopicSuggestions = () => {
        const query = topicInput.value.toLowerCase();
        const filtered = query ? topicSuggestions.filter(t => !formState.topics.includes(t) && t.toLowerCase().includes(query)) : [];
        renderSuggestions(topicSuggestionsEl, filtered, addTopic);
    };
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            formState.file = file;
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.classList.remove('hidden');
        }
    }
    function updatePrivacyButton(isPublic) {
        privacyStatusText.textContent = isPublic ? "Công khai" : "Riêng tư";
        privacyToggleBtn.innerHTML = `<i data-lucide="${isPublic ? 'globe' : 'lock'}"></i><span>${isPublic ? 'Công khai' : 'Riêng tư'}</span>`;
        privacyToggleBtn.className = `btn ${isPublic ? 'btn-blue' : 'btn-gray'}`;
        if (window.lucide) lucide.createIcons();
    }
    function handleSubmit(event) {
        event.preventDefault();
        // ... (validation)

        const formData = new FormData();
        formData.append('Id', imageId); // Gửi ID của ảnh đang sửa
        formData.append('Title', formState.title);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);

        // Chỉ gửi file nếu người dùng đã chọn file mới
        if (formState.file) {
            formData.append('ImageFile', formState.file);
        }

        formState.tags.forEach(tag => formData.append('Tags', tag));
        formState.topics.forEach(topic => formData.append('Topics', topic));

        console.log("Dữ liệu cập nhật sẵn sàng gửi đi:", Object.fromEntries(formData.entries()));
        alert("✅ Ảnh đã được cập nhật thành công!");
    }

    // --- GÁN SỰ KIỆN ---
    titleInput.addEventListener('input', (e) => formState.title = e.target.value);
    descriptionInput.addEventListener('input', (e) => formState.description = e.target.value);

    privacyToggleBtn.addEventListener('click', () => {
        formState.isPublic = !formState.isPublic;
        updatePrivacyButton(formState.isPublic);
    });

    uploadImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);

    tagInput.addEventListener('input', updateTagSuggestions);
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(e.target.value);
        }
    });

    topicInput.addEventListener('input', updateTopicSuggestions);
    topicInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic(e.target.value);
        }
    });

    form.addEventListener('submit', handleSubmit);

    // ====> SỬA LẠI LOGIC NÚT HỦY <====
    cancelBtn.addEventListener('click', () => {
        // Hỏi xác nhận trước khi hủy để tránh mất dữ liệu đã sửa
        if (confirm("Bạn có chắc muốn hủy? Mọi thay đổi sẽ không được lưu.")) {
            // Điều hướng thẳng về trang Collection
            window.location.href = "/Collection/Collection";
        }
    });
    // --- KHỞI TẠO ---
    populateForm(); // Gọi hàm này để điền dữ liệu vào form khi trang tải xong

    // Để cho ngắn gọn, bạn có thể sao chép toàn bộ các hàm và khối gán sự kiện từ `addImage.js`
    // vì chúng có logic và ID phần tử giống hệt nhau.
});