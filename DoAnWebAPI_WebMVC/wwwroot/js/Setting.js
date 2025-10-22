document.addEventListener("DOMContentLoaded", () => {
    // ====> CẬP NHẬT LẠI TOÀN BỘ KHỐI KHAI BÁO BIẾN DOM <====
    const settingsNav = document.getElementById("settings-nav");
    const navButtons = settingsNav.querySelectorAll(".nav-button[data-tab]");
    const tabsContainer = document.querySelector(".tabs-container");

    // Profile Tab
    const profileForm = document.getElementById("settings-profile-form");
    const avatarPreview = document.getElementById("settings-avatar-preview");
    const uploadAvatarBtn = document.getElementById("settings-upload-avatar-btn");
    const avatarFileInput = document.getElementById("settings-avatar-file-input");
    const profileName = document.getElementById("settings-profile-name");
    const profileEmail = document.getElementById("settings-profile-email");

    // Password Tab
    const passwordForm = document.getElementById("settings-password-form");
    const currentPassword = document.getElementById("settings-current-password");
    const newPassword = document.getElementById("settings-new-password");
    const confirmPassword = document.getElementById("settings-confirm-password");

    // Nút khác
    const logoutBtn = document.getElementById("settings-logout-btn");
    // Lấy ID người dùng (giả định biến này có sẵn toàn cục)
    const CURRENT_USER_ID = window.CURRENT_USER_ID;
    let activeTabName = 'profile'; // Tab mặc định là 'profile'
    let isAnimating = false;

    // ====> CẬP NHẬT LOGIC TÌM TAB TRONG HÀM NÀY <====
    function setActiveTab(newTabName) {
        if (newTabName === activeTabName || isAnimating) return;
        isAnimating = true;

        // Tìm tab cũ và tab mới với ID đã có tiền tố 'settings-'
        const oldTab = document.getElementById(`settings-${activeTabName}-tab`);
        const newTab = document.getElementById(`settings-${newTabName}-tab`);

        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === newTabName);
        });

        if (oldTab) oldTab.classList.add('is-exiting');
        if (newTab) {
            newTab.classList.remove('is-exiting');
            newTab.classList.add('is-active');
        }

        setTimeout(() => {
            if (oldTab) oldTab.classList.remove('is-active', 'is-exiting');
            activeTabName = newTabName;
            isAnimating = false;
        }, 300);
    }

    function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            avatarPreview.src = previewUrl;
        }
    }
    async function loadUserProfile() {
        if (!CURRENT_USER_ID) {
            console.error("Không tìm thấy CURRENT_USER_ID");
            alert("Lỗi: Không thể xác thực người dùng.");
            return;
        }

        try {
            // Giả định api.users.getById('me') sẽ tự động lấy user đã đăng nhập
            // Hoặc dùng: const user = await api.users.getById(CURRENT_USER_ID);
            const user = await api.users.getById(CURRENT_USER_ID);

            profileName.value = user.username;
            profileEmail.value = user.email;
            // Sửa khối if/else này
            if (user.avatarUrl && user.avatarUrl !== "default-avatar.png") {
                // Nếu có avatarUrl VÀ nó KHÔNG PHẢI là 'default-avatar.png'
                avatarImg.src = user.avatarUrl;
            } else {
                // Ngược lại (nếu avatarUrl là null, rỗng, HOẶC là 'default-avatar.png')
                avatarImg.src = "/Logo.png";
            }
        } catch (error) {
            console.error("Lỗi khi tải hồ sơ:", error);
            alert(`Không thể tải thông tin của bạn: ${error.message}`);
        }
    }
    // --- GÁN SỰ KIỆN (Không thay đổi logic, chỉ sử dụng biến mới) ---

    navButtons.forEach(button => {
        button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });

    uploadAvatarBtn.addEventListener("click", () => avatarFileInput.click());
    avatarFileInput.addEventListener("change", handleAvatarUpload);
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const saveButton = profileForm.querySelector('button[type="submit"]');
        const originalButtonText = saveButton.innerHTML;
        saveButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang lưu...';
        lucide.createIcons();
        saveButton.disabled = true;

        try {
            let avatarUrl = null;

            // ⚡ Nếu người dùng upload ảnh mới
            if (avatarFileInput.files[0]) {
                const imageFormData = new FormData();
                imageFormData.append("file", avatarFileInput.files[0]);
                imageFormData.append("title", `avatar_${profileName.value}`);
                imageFormData.append("description", "Ảnh đại diện người dùng");
                imageFormData.append("isPublic", false); // chỉ mình người dùng này thấy
                imageFormData.append("status", "approved"); // hoặc "pending" tùy hệ thống
                imageFormData.append("tags", JSON.stringify([]));
                imageFormData.append("topics", JSON.stringify([]));

                // ✅ Gọi API tạo ảnh
                
                const createdImage = await api.images.create(imageFormData);

                // Nếu thành công thì lấy fileUrl để dùng cập nhật user
                avatarUrl = createdImage.fileUrl;
            }

            // ⚙️ Cập nhật hồ sơ người dùng
            const updateData = new FormData();
            updateData.append("Username", profileName.value);
            updateData.append("AvatarUrl", avatarUrl || avatarPreview.src);
            updateData.append("NewPassword", "");
            console.log("➡️ Dữ liệu gửi lên API:", updateData);
            await api.users.update(CURRENT_USER_ID, updateData);

            alert("✅ Hồ sơ đã được cập nhật thành công!");
            if (avatarUrl) avatarPreview.src = avatarUrl;

        } catch (error) {
            console.error("Lỗi cập nhật hồ sơ:", error);
            alert(`❌ Lỗi khi lưu: ${error.message}`);
        } finally {
            saveButton.innerHTML = originalButtonText;
            lucide.createIcons();
            saveButton.disabled = false;
        }
    });

    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (newPassword.value !== confirmPassword.value) {
            alert("⚠️ Mật khẩu mới không khớp!");
            return;
        }
        if (!currentPassword.value || !newPassword.value) {
            alert("⚠️ Vui lòng điền đầy đủ mật khẩu!");
            return;
        }

        const updateButton = passwordForm.querySelector('button[type="submit"]');
        const originalButtonText = updateButton.innerHTML;
        updateButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Đang cập nhật...';
        lucide.createIcons();
        updateButton.disabled = true;

        // Xây dựng FormData giống như form profile
        const updateData = new FormData();

        // 1. Gửi thông tin profile (lấy từ tab kia) để API không ghi đè
        updateData.append("Username", profileName.value);
        updateData.append("AvatarUrl", avatarPreview.src);

        // 2. Gửi thông tin mật khẩu
        // Endpoint 'update' của bạn phải được lập trình để hiểu các trường này
        updateData.append("CurrentPassword", currentPassword.value);
        updateData.append("NewPassword", newPassword.value);

        try {
            // Gọi_đúng_ endpoint `update`
            await api.users.update(CURRENT_USER_ID, updateData);

            alert("🔑 Mật khẩu đã được thay đổi thành công!");
            passwordForm.reset(); // Xóa các trường mật khẩu

        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            // API của bạn nên trả về lỗi 400 hoặc 403 nếu mật khẩu cũ sai
            if (error.message.includes("400") || error.message.includes("403")) {
                alert("Lỗi: Mật khẩu hiện tại không đúng.");
            } else {
                alert(`Lỗi: ${error.message}`);
            }
        } finally {
            updateButton.innerHTML = originalButtonText;
            lucide.createIcons();
            updateButton.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            alert("Đã đăng xuất!");
        }
    });

    // --- KHỞI TẠO ---
    lucide.createIcons();
    loadUserProfile();
});