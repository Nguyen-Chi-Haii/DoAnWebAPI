document.addEventListener("DOMContentLoaded", () => {
    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ DOM ---
    let formState = {
        title: "",
        description: "",
        isPublic: true,
        file: null,
        tags: [],
        topics: [],
    };
    const tagSuggestions = ["Phong cảnh", "Động vật", "Con người", "Nghệ thuật", "Kiến trúc"];
    const topicSuggestions = ["Mùa hè", "Du lịch", "Đời sống", "Tự nhiên", "Tết"];

    const form = document.getElementById("add-image-form");
    const titleInput = document.getElementById("image-title");
    const descriptionInput = document.getElementById("image-description"); // Lấy thêm input này
    const imagePreview = document.getElementById("image-preview");
    const uploadImageBtn = document.getElementById("upload-image-btn");
    const fileInput = document.getElementById("file-input");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn"); // Lấy nút này
    const privacyStatusText = document.getElementById("privacy-status-text"); // Lấy text này
    const tagInput = document.getElementById("tag-input");
    const tagSuggestionsEl = document.getElementById("tag-suggestions");
    const selectedTagsEl = document.getElementById("selected-tags");
    const topicInput = document.getElementById("topic-input");
    const topicSuggestionsEl = document.getElementById("topic-suggestions");
    const selectedTopicsEl = document.getElementById("selected-topics");
    const cancelBtn = document.getElementById("cancel-btn");

    // --- CÁC HÀM RENDER ---
    const renderPills = (container, pills, pillClass, onRemove) => {
        // Bước 1: Tạo toàn bộ HTML cho các "pill"
        container.innerHTML = pills.map(text => `
        <span class="${pillClass}" data-value="${text}">
            ${text}
            <i data-lucide="x" class="pill-remove-btn"></i>
        </span>
    `).join('');

        // Bước 2: Gọi Lucide để nó chuyển đổi tất cả thẻ <i> thành <svg>
        if (window.lucide) {
            lucide.createIcons();
        }

        // Bước 3: SAU KHI icon đã được tạo, tìm tất cả các nút xóa và gán sự kiện click
        container.querySelectorAll('.pill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Lấy giá trị từ thuộc tính data-value của thẻ span cha
                const valueToRemove = btn.closest('span').dataset.value;
                onRemove(valueToRemove);
            });
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

    // --- CÁC HÀM XỬ LÝ ---
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
        // Thay đổi class để đổi màu nút
        privacyToggleBtn.className = `btn ${isPublic ? 'btn-blue' : 'btn-gray'}`;
        if (window.lucide) lucide.createIcons();
    }

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
        const filtered = query ? tagSuggestions.filter(
            t => !formState.tags.includes(t) && t.toLowerCase().includes(query)
        ) : [];
        renderSuggestions(tagSuggestionsEl, filtered, addTag);
    };

    // Tương tự cho Topic
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
        const filtered = query ? topicSuggestions.filter(
            t => !formState.topics.includes(t) && t.toLowerCase().includes(query)
        ) : [];
        renderSuggestions(topicSuggestionsEl, filtered, addTopic);
    };

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            formState.file = file;
            const previewUrl = URL.createObjectURL(file);
            imagePreview.src = previewUrl;
            imagePreview.classList.remove('hidden');
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        formState.title = titleInput.value;
        if (!formState.title.trim() || !formState.file) {
            alert("⚠️ Vui lòng nhập tiêu đề và chọn ảnh!");
            return;
        }

        const formData = new FormData();
        formData.append('Title', formState.title);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);
        formData.append('ImageFile', formState.file);
        formState.tags.forEach(tag => formData.append('Tags', tag));
        formState.topics.forEach(topic => formData.append('Topics', topic));

        console.log("Dữ liệu sẵn sàng gửi đi:", Object.fromEntries(formData.entries()));
        alert("✅ Ảnh đã được thêm thành công!");
    }
    titleInput.addEventListener('input', (e) => handleInputChange('title', e.target.value));
    descriptionInput.addEventListener('input', (e) => handleInputChange('description', e.target.value));
    privacyToggleBtn.addEventListener('click', handlePrivacyToggle);

    // --- GÁN SỰ KIỆN ---
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
    cancelBtn.addEventListener('click', () => window.history.back());

    // --- KHỞI TẠO ---
    if (window.lucide) lucide.createIcons();
});