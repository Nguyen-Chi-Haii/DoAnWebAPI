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

        // Đồng bộ giá trị giữa desktop và mobile
        syncSearchInputs(value, e.target.id);

        // Debounce: đợi 500ms sau khi user ngừng gõ
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            dispatchSearchEvent(value);
        }, 500);
    };

    // Đồng bộ giá trị giữa 2 ô input
    const syncSearchInputs = (value, sourceId) => {
        const searchInputDesktop = document.getElementById('search-input-desktop');
        const searchInputMobile = document.getElementById('search-input-mobile');

        if (sourceId === 'search-input-desktop' && searchInputMobile) {
            searchInputMobile.value = value;
        }
        if (sourceId === 'search-input-mobile' && searchInputDesktop) {
            searchInputDesktop.value = value;
        }
    };

    // --- KHỞI TẠO ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("🎯 Header module initialized");

        // --- SEARCH INPUT ---
        const searchInputDesktop = document.getElementById('search-input-desktop');
        const searchInputMobile = document.getElementById('search-input-mobile');

        if (searchInputDesktop) {
            searchInputDesktop.addEventListener('input', handleSearchInput);
            console.log("✅ Desktop search input ready");
        }
        if (searchInputMobile) {
            searchInputMobile.addEventListener('input', handleSearchInput);
            console.log("✅ Mobile search input ready");
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

        // --- MOBILE MENU TOGGLE (nếu có) ---
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
            console.log("✅ Mobile menu ready");
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
            const searchInputMobile = document.getElementById('search-input-mobile');
            if (searchInputDesktop) searchInputDesktop.value = "";
            if (searchInputMobile) searchInputMobile.value = "";
            dispatchSearchEvent("");
        },
        setSearchQuery: (query) => {
            const searchInputDesktop = document.getElementById('search-input-desktop');
            const searchInputMobile = document.getElementById('search-input-mobile');
            if (searchInputDesktop) searchInputDesktop.value = query;
            if (searchInputMobile) searchInputMobile.value = query;
            dispatchSearchEvent(query);
        }
    };
})();