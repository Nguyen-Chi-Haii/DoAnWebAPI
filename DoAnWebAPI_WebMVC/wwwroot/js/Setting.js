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

    let activeTabName = 'profile';
    let isAnimating = false;

    // --- CÁC HÀM XỬ LÝ ---

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

    // --- GÁN SỰ KIỆN (Không thay đổi logic, chỉ sử dụng biến mới) ---

    navButtons.forEach(button => {
        button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });

    uploadAvatarBtn.addEventListener("click", () => avatarFileInput.click());
    avatarFileInput.addEventListener("change", handleAvatarUpload);

    profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const profileData = {
            name: profileName.value,
            email: profileEmail.value,
            avatarFile: avatarFileInput.files[0]
        };
        console.log("Submitting Profile Data:", profileData);
        alert("✅ Hồ sơ đã được cập nhật!");
    });

    passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (newPassword.value !== confirmPassword.value) {
            alert("⚠️ Mật khẩu mới không khớp!");
            return;
        }
        const passwordData = {
            current: currentPassword.value,
            newPass: newPassword.value
        };
        console.log("Changing password with data:", passwordData);
        alert("🔑 Mật khẩu đã được thay đổi!");
    });

    logoutBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            alert("Đã đăng xuất!");
        }
    });

    // --- KHỞI TẠO ---
    lucide.createIcons();
});