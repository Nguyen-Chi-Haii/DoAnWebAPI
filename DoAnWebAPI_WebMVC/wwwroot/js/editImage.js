document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("edit-image-form").closest('.form-container');
    const imageId = container.dataset.imageId;

    if (!imageId) {
        container.innerHTML = "<h2>Lỗi: Không tìm thấy ID của ảnh.</h2>";
        return;
    }

    let initialData;
    try {
        initialData = await api.images.getById(imageId);
    } catch (error) {
        container.innerHTML = `<h2>Lỗi: ${error.message}</h2><p>Có thể bạn không có quyền sửa ảnh này.</p>`;
        return;
    }

    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ DOM ---
    let formState = {
        title: initialData.title || "",
        description: initialData.description || "",
        isPublic: initialData.isPublic ?? true,
        // DTO trả về là chi tiết, nên cần lấy đúng cấu trúc
        tags: initialData.tags || [], // [{id, name}, ...]
        topics: initialData.topics || [], // [{id, name}, ...]
    };

    let allTags = [];
    let allTopics = [];
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
    const submitBtn = form.querySelector('button[type="submit"]');

    // --- HÀM ĐIỀN DỮ LIỆU BAN ĐẦU VÀO FORM ---
    try {
        allTags = await api.tags.getAll();
        allTopics = await api.topics.getAll();
    } catch (error) {
        console.error("Lỗi khi tải suggestions:", error);
    }
    function populateForm() {
        titleInput.value = formState.title;
        descriptionInput.value = formState.description;
        imagePreview.src = initialData.thumbnailUrl;
        imagePreview.classList.remove('hidden');
        updatePrivacyButton(formState.isPublic);
        renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
        renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);
        if (window.lucide) lucide.createIcons();
    }

    // --- CÁC HÀM RENDER VÀ XỬ LÝ (Tái sử dụng từ addImage.js) ---
    // Các hàm renderPills, renderSuggestions, add/remove Tag/Topic, handleImageUpload
    // giống hệt như trong file addImage.js. Bạn có thể sao chép chúng vào đây.
    // --- CÁC HÀM RENDER (chỉnh sửa lại để dùng ID và Name) ---
    const renderPills = (container, pills, pillClass, onRemove) => {
        container.innerHTML = pills.map(item => `
        <span class="${pillClass}" data-id="${item.id}">
            ${item.name}
            <i data-lucide="x" class="pill-remove-btn"></i>
        </span>`).join('');
        if (window.lucide) lucide.createIcons();
        container.querySelectorAll('.pill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idToRemove = parseInt(btn.closest('span').dataset.id);
                onRemove(idToRemove);
            });
        });
    };

    const renderSuggestions = (container, suggestions, onAdd) => {
        container.innerHTML = '';
        suggestions.forEach(item => {
            const el = document.createElement('div');
            el.className = 'suggestion-item';
            el.textContent = item.name;
            el.onclick = () => onAdd(item);
            container.appendChild(el);
        });
    };

    // --- CÁC HÀM XỬ LÝ (cập nhật để dùng ID) ---
    const addTag = (tagObject) => {
        if (tagObject && !formState.tags.some(t => t.id === tagObject.id)) {
            formState.tags.push(tagObject);
            renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
        }
        tagInput.value = '';
        updateTagSuggestions();
    };
    const removeTag = (tagId) => {
        formState.tags = formState.tags.filter(t => t.id !== tagId);
        renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
    };
    const updateTagSuggestions = () => {
        const query = tagInput.value.toLowerCase();
        const selectedIds = formState.tags.map(t => t.id);
        const filtered = query ? allTags.filter(
            t => !selectedIds.includes(t.id) && t.name.toLowerCase().includes(query)
        ) : [];
        renderSuggestions(tagSuggestionsEl, filtered, addTag);
    };

    // Tương tự cho Topic
    const addTopic = (topicObject) => {
        if (topicObject && !formState.topics.some(t => t.id === topicObject.id)) {
            formState.topics.push(topicObject);
            renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);
        }
        topicInput.value = '';
        updateTopicSuggestions();
    };
    const removeTopic = (topicId) => {
        formState.topics = formState.topics.filter(t => t.id !== topicId);
        renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);
    };
    const updateTopicSuggestions = () => {
        const query = topicInput.value.toLowerCase();
        const selectedIds = formState.topics.map(t => t.id);
        const filtered = query ? allTopics.filter(
            t => !selectedIds.includes(t.id) && t.name.toLowerCase().includes(query)
        ) : [];
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
    async function handleSubmit(event) {
        event.preventDefault();

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang cập nhật...';
        lucide.createIcons();

        // Dữ liệu gửi đi cho API PUT là object JSON
        const updateData = {
            title: titleInput.value,
            description: descriptionInput.value,
            isPublic: formState.isPublic,
            tagIds: formState.tags.map(t => t.id),
            topicIds: formState.topics.map(t => t.id)
        };

        try {
            await api.images.update(imageId, updateData);
            alert("✅ Cập nhật thông tin ảnh thành công!");
            window.location.href = "/Collection/Collection";
        } catch (error) {
            alert(`❌ Lỗi: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Lưu thay đổi';
            lucide.createIcons();
        }
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