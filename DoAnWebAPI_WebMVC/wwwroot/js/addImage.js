// File: wwwroot/js/addImage.js (Phiên bản đã sửa cho HTML mới)

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

    // Lấy các phần tử DOM
    const form = document.getElementById("add-image-form");
    if (!form) {
        console.error("Lỗi nghiêm trọng: Không tìm thấy form#add-image-form trên trang.");
        return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const titleInput = document.getElementById("image-title");
    const descriptionInput = document.getElementById("image-description");
    const imagePreview = document.getElementById("image-preview");
    const uploadImageBtn = document.getElementById("upload-image-btn");
    const fileInput = document.getElementById("file-input");
    const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
    const privacyStatusText = document.getElementById("privacy-status-text"); // Chữ bên ngoài
    const tagInput = document.getElementById("tag-input");
    const tagSuggestionsEl = document.getElementById("tag-suggestions");
    const selectedTagsEl = document.getElementById("selected-tags");
    const topicInput = document.getElementById("topic-input");
    const topicSuggestionsEl = document.getElementById("topic-suggestions");
    const selectedTopicsEl = document.getElementById("selected-topics");
    const cancelBtn = document.getElementById("cancel-btn");

    // Kiểm tra các phần tử quan trọng
    if (!privacyToggleBtn || !privacyStatusText) {
        console.error("Lỗi: Không tìm thấy nút #privacy-toggle-btn hoặc #privacy-status-text.");
        return;
    }


    /// --- LẤY DỮ LIỆU BAN ĐẦU TỪ API ---
    /// --- LẤY DỮ LIỆU BAN ĐẦU TỪ API ---
    try {
        allTags = await api.tags.getAll();
        allTopics = await api.topics.getAll();
    } catch (error) {
        // Kiểm tra xem lỗi có phải là lỗi phản hồi từ server và có mã trạng thái 401 không
        if (error.response && error.response.status === 401) {
            // Ghi lại lỗi để debug (tùy chọn)
            console.error("Chưa xác thực (401). Đang chuyển hướng đến trang đăng nhập...");

            // Chuyển hướng người dùng đến trang đăng nhập
            window.location.href = '/Acount/Login'; // <-- Sửa lại đường dẫn nếu cần
        } else {
            // Nếu là lỗi khác (mất mạng, lỗi 500,...), thì hiển thị thông báo như cũ
            console.error("Lỗi khi tải tags/topics:", error);
            alert("Không thể tải danh sách thẻ và chủ đề. Vui lòng thử lại.");
        }
    }

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
    };

    // ✅ HÀM ĐÃ ĐƯỢC VIẾT LẠI HOÀN TOÀN
    const updatePrivacyStatus = () => {
        // Tìm thẻ span và icon BÊN TRONG nút bấm
        const buttonTextSpan = privacyToggleBtn.querySelector('span');

        if (formState.isPublic) {
            const newText = 'Công khai';
            // Cập nhật chữ bên ngoài
            privacyStatusText.textContent = newText;
            // Cập nhật chữ và icon bên trong nút
            privacyToggleBtn.innerHTML = `<i data-lucide="globe"></i><span>${newText}</span>`;
        } else {
            const newText = 'Riêng tư';
            // Cập nhật chữ bên ngoài
            privacyStatusText.textContent = newText;
            // Cập nhật chữ và icon bên trong nút
            privacyToggleBtn.innerHTML = `<i data-lucide="lock"></i><span>${newText}</span>`;
        }
        // Luôn gọi lại sau khi thay đổi innerHTML để render icon
        if (window.lucide) lucide.createIcons();
    };


    // --- CÁC HÀM XỬ LÝ (Không thay đổi) ---
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

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            formState.file = file;
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.classList.remove('hidden');
            // Ẩn nút placeholder sau khi chọn ảnh
            if (uploadImageBtn) uploadImageBtn.classList.add('hidden');
        }
    }

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
        if (window.lucide) lucide.createIcons();

        const formData = new FormData();
        formData.append('Title', formState.title);
        formData.append('Description', formState.description);
        formData.append('IsPublic', formState.isPublic);
        formData.append('File', formState.file);
        formState.tags.forEach(tag => formData.append('TagIds', tag.id));
        formState.topics.forEach(topic => formData.append('TopicIds', topic.id));

        try {
            const newImage = await api.images.create(formData);
            alert(`✅ Ảnh "${newImage.title}" đã được thêm thành công!`);
            window.location.href = '/Collection/Collection';
        } catch (error) {
            alert(`❌ Lỗi: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Lưu ảnh';
            if (window.lucide) lucide.createIcons();
        }
    }


    // --- GÁN SỰ KIỆN ---
    if (uploadImageBtn) uploadImageBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleImageUpload);

    if (privacyToggleBtn) {
        privacyToggleBtn.addEventListener('click', () => {
            formState.isPublic = !formState.isPublic;
            updatePrivacyStatus();
        });
    }

    if (tagInput) {
        tagInput.addEventListener('input', updateTagSuggestions);
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Logic để chọn suggestion đầu tiên nếu có, hoặc thêm tag mới
            }
        });
    }

    if (topicInput) {
        topicInput.addEventListener('input', updateTopicSuggestions);
        topicInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    form.addEventListener('submit', handleSubmit);
    if (cancelBtn) cancelBtn.addEventListener('click', () => window.history.back());

    // --- KHỞI TẠO ---
    if (window.lucide) lucide.createIcons();
});