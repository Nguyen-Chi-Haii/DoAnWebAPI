// File: wwwroot/js/header.js
// Logic cho header: dropdown menu, search, notification...

(function () {
    // --- BIẾN TOÀN CỤC ---
    let searchTimer;
    let currentSearchQuery = "";

    // --- HÀM TÌM KIẾM ---

    // Phát event tìm kiếm
    const dispatchSearchEvent = (query) => {
        currentSearchQuery = query;
        const searchEvent = new CustomEvent("searchChanged", {
            detail: { query: query }
        });
        document.dispatchEvent(searchEvent);
        console.log("🔍 searchChanged event fired:", query);

        // Cập nhật hiển thị search hiện tại (nếu có)
        updateSearchDisplay(query);
    };

    // Cập nhật text hiển thị tìm kiếm hiện tại
    const updateSearchDisplay = (query) => {
        const currentSearchDisplay = document.getElementById('current-search');
        if (currentSearchDisplay) {
            currentSearchDisplay.textContent = query ? `"${query}"` : "";
        }
    };

    // Xử lý input với debounce
    const handleSearchInput = (e) => {
        const value = e.target.value.trim();
        // Debounce: đợi 500ms sau khi user ngừng gõ
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            dispatchSearchEvent(value);
        }, 500);
    };
    async function loadUserInfo(userId) {
        const avatarImg = document.getElementById('user-avatar');
        const userNameSpan = document.getElementById('user-name');

        if (!avatarImg || !userNameSpan) {
            console.error("Không tìm thấy phần tử avatar hoặc tên user.");
            return;
        }

        try {
            // Gọi API bằng object 'api' đã định nghĩa trong file apiServices.js
            const user = await api.users.getById(userId);

            if (user) {
                // Cập nhật tên
                userNameSpan.textContent = user.username || "Người dùng";

                // Cập nhật avatar
                if (user.avatarUrl) {
                    avatarImg.src = user.avatarUrl;
                } else {
                    // ⚠️ SỬA LỖI 404: Đã bỏ dấu '~'
                    avatarImg.src = "/default-avatar.png";
                }
                console.log("✅ Tải thông tin user thành công:", user.name);
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin user:", error);
            userNameSpan.textContent = "Lỗi";

            if (error.message === "Unauthorized") {
                console.warn("Token không hợp lệ hoặc hết hạn.");
                window.location.href = '/Account/Login';
            }
        }
    }


    // --- KHỞI TẠO ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("🎯 Header module initialized");
        const currentUserId = window.CURRENT_USER_ID;

        if (currentUserId && currentUserId !== '') {
            // Nếu có User ID, gọi hàm tải thông tin
            loadUserInfo(currentUserId);
        } else {
            console.warn("Không tìm thấy window.CURRENT_USER_ID. User có thể chưa đăng nhập.");
            // (Tùy chọn) Ẩn nút user hoặc hiển thị "Khách"
            document.getElementById('user-name').textContent = "Khách";
            // document.getElementById('user-menu-button').style.display = 'none';
        }
        // --- SEARCH INPUT ---
        const searchInputDesktop = document.getElementById('search-input-desktop');

        if (searchInputDesktop) {
            searchInputDesktop.addEventListener('input', handleSearchInput);
            console.log("✅ Desktop search input ready");
        }

        // --- DROPDOWN MENU USER ---
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');

        if (userMenuButton && userMenuDropdown) {
            // Click vào avatar/button để toggle menu
            userMenuButton.addEventListener('click', (event) => {
                event.stopPropagation();
                userMenuDropdown.classList.toggle('hidden');
            });

            // Click ra ngoài để đóng menu
            window.addEventListener('click', () => {
                if (!userMenuDropdown.classList.contains('hidden')) {
                    userMenuDropdown.classList.add('hidden');
                }
            });

            // Click vào bên trong dropdown không đóng menu
            userMenuDropdown.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            console.log("✅ User menu dropdown ready");
        }


        // --- NOTIFICATION DROPDOWN (nếu có) ---
        const notificationButton = document.getElementById('notification-button');
        const notificationDropdown = document.getElementById('notification-dropdown');

        if (notificationButton && notificationDropdown) {
            notificationButton.addEventListener('click', (event) => {
                event.stopPropagation();
                notificationDropdown.classList.toggle('hidden');
                // Đóng user menu nếu đang mở
                if (userMenuDropdown && !userMenuDropdown.classList.contains('hidden')) {
                    userMenuDropdown.classList.add('hidden');
                }
            });

            window.addEventListener('click', () => {
                if (!notificationDropdown.classList.contains('hidden')) {
                    notificationDropdown.classList.add('hidden');
                }
            });

            notificationDropdown.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            console.log("✅ Notification dropdown ready");
        }
    });

    // --- EXPORT PUBLIC API (optional) ---
    window.HeaderModule = {
        getCurrentQuery: () => currentSearchQuery,
        clearSearch: () => {
            const searchInputDesktop = document.getElementById('search-input-desktop');
            if (searchInputDesktop) searchInputDesktop.value = "";
            dispatchSearchEvent("");
        },
        setSearchQuery: (query) => {
            const searchInputDesktop = document.getElementById('search-input-desktop');
            if (searchInputDesktop) searchInputDesktop.value = query;
            dispatchSearchEvent(query);
        }
    };
})();