// File: wwwroot/js/editImage.js (Phiên bản đã đồng bộ với CSHTML mới)

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("edit-image-form");
    if (!form) {
        console.error("Lỗi: Không tìm thấy form#edit-image-form.");
        return;
    }
    const container = form.closest('.form-container');
    const imageId = container.dataset.imageId;

    if (!imageId) {
        container.innerHTML = "<h2>Lỗi: Không tìm thấy ID của ảnh.</h2>";
        return;
    }

    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ DOM ---
    let formState = {};
    let allTags = [];
    let allTopics = [];

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

    // --- CÁC HÀM RENDER ---
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
        container.style.display = suggestions.length > 0 ? 'block' : 'none';
    };

    const updatePrivacyStatus = () => {
        const buttonTextSpan = privacyToggleBtn.querySelector('span');
        if (formState.isPublic) {
            const newText = 'Công khai';
            privacyStatusText.textContent = newText;
            privacyToggleBtn.innerHTML = `<i data-lucide="globe"></i><span>${newText}</span>`;
        } else {
            const newText = 'Riêng tư';
            privacyStatusText.textContent = newText;
            privacyToggleBtn.innerHTML = `<i data-lucide="lock"></i><span>${newText}</span>`;
        }
        if (window.lucide) lucide.createIcons();
    };


    // --- CÁC HÀM XỬ LÝ ---
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

    // --- HÀM KHỞI TẠO VÀ TẢI DỮ LIỆU ---
    async function init() {
        try {
            // Tải song song dữ liệu ảnh và danh sách tags/topics
            const [imageData, tagsData, topicsData] = await Promise.all([
                api.images.getById(imageId),
                api.tags.getAll(),
                api.topics.getAll()
            ]);

            allTags = tagsData;
            allTopics = topicsData;
            formState = imageData; // Lưu toàn bộ dữ liệu ảnh, bao gồm cả status

            // Điền dữ liệu vào form
            titleInput.value = formState.title;
            descriptionInput.value = formState.description;
            imagePreview.src = formState.thumbnailUrl;
            imagePreview.classList.remove('hidden');

            // Render trạng thái ban đầu
            updatePrivacyStatus();
            renderPills(selectedTagsEl, formState.tags, 'tag-pill', removeTag);
            renderPills(selectedTopicsEl, formState.topics, 'topic-pill', removeTopic);

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu ảnh:", error);
            container.innerHTML = `<h2>Lỗi: ${error.message}</h2><p>Không thể tải dữ liệu cho ảnh này.</p>`;
        }
    }

    // --- HÀM SUBMIT ---
    async function handleSubmit(event) {
        event.preventDefault();

        // Cập nhật các giá trị từ form vào state trước khi gửi
        formState.title = titleInput.value;
        formState.description = descriptionInput.value;

        const updatedData = {
            Title: formState.title,
            Description: formState.description,
            IsPublic: formState.isPublic,
            // ✅ THÊM DÒNG NÀY VÀO
            Status: formState.status, // Giữ lại status hiện tại của ảnh
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
            window.history.back();
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
            window.location.href = '/Collection/Collection';
        }
    });

    // --- KHỞI CHẠY ---
    init();
});