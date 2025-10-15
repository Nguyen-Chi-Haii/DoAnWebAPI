document.addEventListener("DOMContentLoaded", async () => {
    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ DOM ---
    let formState = {
        title: "",
        description: "",
        isPublic: true,
        file: null,
        tags: [],
        topics: [],
    };
    let allTags = [];
    let allTopics = [];

    const submitBtn = form.querySelector('button[type="submit"]');
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

    /// --- LẤY DỮ LIỆU BAN ĐẦU TỪ API ---
    try {
        allTags = await api.tags.getAll();
        allTopics = await api.topics.getAll();
    } catch (error) {
        console.error("Lỗi khi tải tags/topics:", error);
        alert("Không thể tải danh sách thẻ và chủ đề. Vui lòng thử lại.");
    }

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

    // MODIFIED: Cập nhật hàm handleSubmit
    async function handleSubmit(event) {
        event.preventDefault();
        formState.title = titleInput.value;
        formState.description = descriptionInput.value;

        if (!formState.title.trim() || !formState.file) {
            alert("⚠️ Vui lòng nhập tiêu đề và chọn ảnh!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang lưu...';
        lucide.createIcons();

        const formData = new FormData();
        formData.append('Title', formState.title);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);
        formData.append('File', formState.file); // API mong đợi key là 'File'
        formState.tags.forEach(tag => formData.append('TagIds', tag.id));
        formState.topics.forEach(topic => formData.append('TopicIds', topic.id));

        try {
            const newImage = await api.images.create(formData);
            alert(`✅ Ảnh "${newImage.title}" đã được thêm thành công!`);
            window.location.href = '/Collection/Collection'; // Chuyển hướng về trang collection
        } catch (error) {
            alert(`❌ Lỗi: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Lưu ảnh';
            lucide.createIcons();
        }
    }


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