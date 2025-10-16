document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("edit-image-form").closest('.form-container');
    const imageId = container.dataset.imageId;

    if (!imageId) {
        container.innerHTML = "<h2>Lỗi: Không tìm thấy ID của ảnh.</h2>";
        return;
    }

    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ DOM ---
    let formState = {};
    let allTags = [];
    let allTopics = [];

    const form = document.getElementById("edit-image-form");
    const submitBtn = form.querySelector('button[type="submit"]');
    const titleInput = document.getElementById("image-title");
    const descriptionInput = document.getElementById("image-description");
    const imagePreview = document.getElementById("image-preview");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
    const privacyStatusText = document.getElementById("privacy-status-text");
    const tagInput = document.getElementById("tag-input");
    const tagSuggestionsEl = document.getElementById("tag-suggestions");
    const selectedTagsEl = document.getElementById("selected-tags");
    const topicInput = document.getElementById("topic-input");
    const topicSuggestionsEl = document.getElementById("topic-suggestions");
    const selectedTopicsEl = document.getElementById("selected-topics");
    const cancelBtn = document.getElementById("cancel-btn");

    // ✅ ĐÃ XÓA CÁC BIẾN uploadImageBtn và fileInput

    // --- CÁC HÀM RENDER VÀ HELPER (Không đổi) ---
    const renderPills = (container, pills, pillClass, onRemove) => { /* ... giữ nguyên ... */ };
    const renderSuggestions = (container, suggestions, onAdd) => { /* ... giữ nguyên ... */ };
    const updatePrivacyStatus = () => { /* ... giữ nguyên ... */ };

    // --- CÁC HÀM XỬ LÝ TAGS/TOPICS (Không đổi) ---
    const addTag = (tagObject) => { /* ... giữ nguyên ... */ };
    const removeTag = (tagId) => { /* ... giữ nguyên ... */ };
    const updateTagSuggestions = () => { /* ... giữ nguyên ... */ };
    const addTopic = (topicObject) => { /* ... giữ nguyên ... */ };
    const removeTopic = (topicId) => { /* ... giữ nguyên ... */ };
    const updateTopicSuggestions = () => { /* ... giữ nguyên ... */ };

    // ✅ ĐÃ XÓA HÀM handleImageUpload

    // --- HÀM TẢI DỮ LIỆU BAN ĐẦU ---
    const populateForm = async () => {
        try {
            const [initialData, fetchedTags, fetchedTopics] = await Promise.all([
                api.images.getById(imageId),
                api.tags.getAll(),
                api.topics.getAll()
            ]);

            allTags = fetchedTags;
            allTopics = fetchedTopics;

            formState = {
                title: initialData.title || "",
                description: initialData.description || "",
                isPublic: initialData.isPublic ?? true,
                status: initialData.status,
                tags: initialData.tags || [],
                topics: initialData.topics || [],
            };

            titleInput.value = formState.title;
            descriptionInput.value = formState.description;
            imagePreview.src = initialData.url || initialData.fileUrl;
            updatePrivacyStatus();
            renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
            renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);

        } catch (error) {
            container.innerHTML = `<h2>Lỗi: ${error.message}</h2><p>Không thể tải dữ liệu ảnh.</p>`;
        }
    };

    // --- HÀM XỬ LÝ SUBMIT FORM ---
    async function handleSubmit(event) {
        event.preventDefault();

        const updatedData = {
            Title: titleInput.value,
            Description: descriptionInput.value,
            IsPublic: formState.isPublic,
            Status: formState.status,
            TagIds: formState.tags.map(t => t.id),
            TopicIds: formState.topics.map(t => t.id)
        };

        if (!updatedData.Title.trim()) {
            alert("⚠️ Vui lòng nhập tiêu đề cho ảnh!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang lưu...';
        if (window.lucide) lucide.createIcons();

        try {
            await api.images.update(imageId, updatedData);
            alert(`✅ Cập nhật thông tin ảnh thành công!`);
            window.location.href = '/Collection/Collection';
        } catch (error) {
            alert(`❌ Lỗi khi cập nhật: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Lưu thay đổi';
            if (window.lucide) lucide.createIcons();
        }
    }

    // --- GÁN SỰ KIỆN ---
    privacyToggleBtn.addEventListener('click', () => {
        formState.isPublic = !formState.isPublic;
        updatePrivacyStatus();
    });
    tagInput.addEventListener('input', updateTagSuggestions);
    topicInput.addEventListener('input', updateTopicSuggestions);
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc muốn hủy bỏ? Mọi thay đổi sẽ không được lưu.")) {
            window.location.href = "/Collection/Collection";
        }
    });

    // ✅ ĐÃ XÓA CÁC SỰ KIỆN CHO uploadImageBtn và fileInput

    // --- KHỞI TẠO ---
    populateForm();
});

// Bạn có thể giữ hoặc xóa các hàm helper không dùng đến