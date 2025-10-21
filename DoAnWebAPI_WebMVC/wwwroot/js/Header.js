// File: wwwroot/js/header.js
// Logic cho header: dropdown menu, search, notification...
(function () {
    // --- BIẾN TOÀN CỤC ---
    let searchTimer;
    let currentSearchQuery = "";
  

    // --- HÀM TÌM KIẾM ---
    // Phát event tìm kiếm
    // Phát event tìm kiếm
    const dispatchSearchEvent = (filterData) => { // Sửa 'query' thành 'filterData'
        // Cập nhật query hiện tại (chỉ lấy phần text để hiển thị)
        currentSearchQuery = (typeof filterData === 'string') ? filterData : filterData.query;

        const searchEvent = new CustomEvent("searchChanged", {
            detail: filterData // Gửi toàn bộ object hoặc string
        });
        document.dispatchEvent(searchEvent);
        console.log("🔍 searchChanged event fired:", filterData);

        // Cập nhật hiển thị search hiện tại
        updateSearchDisplay(currentSearchQuery); // Chỉ hiển thị text
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
                    avatarImg.src = "/Logo.png";
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
            const userNameSpan = document.getElementById('user-name'); // Lấy element
            if (userNameSpan) { // Chỉ cập nhật nếu element tồn tại
                userNameSpan.textContent = "Khách";
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
            const pillContainer = document.getElementById('pill-container');

            async function loadAndRenderPills() {
                if (!pillContainer) {
                    console.warn("Không tìm thấy #pill-container.");
                    return;
                }

                try {
                    // 1. Fetch dữ liệu song song
                    const [topics, tags] = await Promise.all([
                        api.topics.getAll(),
                        api.tags.getAll() //
                    ]);

                    // 2. Map và Gộp dữ liệu
                    const allFilters = [
                        ...topics.map(t => ({ id: t.id, name: t.name, type: 'topic' })), // <-- Thêm id: t.id
                        ...tags.map(t => ({ id: t.id, name: t.name, type: 'tag' }))    // <-- Thêm id: t.id
                    ];

                    // 3. Xáo trộn (Shuffle) - Thuật toán Fisher-Yates đơn giản
                    for (let i = allFilters.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [allFilters[i], allFilters[j]] = [allFilters[j], allFilters[i]];
                    }

                    // 4. Chọn một số lượng giới hạn + thêm pill "Tất cả"
                    const pillsToShow = [
                        { name: "Tất cả", type: 'all' },
                        ...allFilters.slice(0, 12) // Lấy ngẫu nhiên 12 cái
                    ];

                    // 5. Render Pills
                    pillContainer.innerHTML = ''; // Xóa chữ "Đang tải..."
                    pillsToShow.forEach((item, index) => {
                        const pill = document.createElement('button');
                        pill.className = 'filter-pill';
                        pill.textContent = item.name;
                        pill.dataset.type = item.type; // 'topic', 'tag', hoặc 'all'
                        pill.dataset.id = item.id;     // ID của topic/tag (hoặc null cho 'all')
                        pill.dataset.name = item.name; // Lưu tên vào data attribute


                        // Pill "Tất cả" là active mặc định
                        if (item.type === 'all') {
                            pill.classList.add('active');
                            pill.dataset.filter = ""; // Giá trị rỗng cho "Tất cả"
                        }

                        pillContainer.appendChild(pill);
                    });

                } catch (error) {
                    console.error("Lỗi khi tải bộ lọc:", error);
                    if (pillContainer) {
                        pillContainer.innerHTML = '<span class="text-sm text-red-500 italic">Lỗi tải bộ lọc.</span>';
                    }
                }
            }

            // Gọi hàm để tải và render pills
            loadAndRenderPills();

            // 6. Gắn Event Listener (Delegation) cho Pill Bar
            const filterPillBar = document.getElementById('filter-pill-bar');
            if (filterPillBar) {
                filterPillBar.addEventListener('click', (e) => {
                    const clickedPill = e.target.closest('.filter-pill');
                    if (!clickedPill) return; // Bỏ qua nếu không click vào pill


                    // Bỏ active ở pill cũ
                    const currentActive = filterPillBar.querySelector('.filter-pill.active');
                    if (currentActive) {
                        currentActive.classList.remove('active');
                    }

                    // Thêm active cho pill mới click
                    clickedPill.classList.add('active');

                    // Lấy giá trị filter và gọi hàm setSearchQuery (đã có trong HeaderModule)
                    const filterInfo = {
                        type: clickedPill.dataset.type,
                        id: clickedPill.dataset.id ? parseInt(clickedPill.dataset.id) : null, // Chuyển id sang số nếu có
                        query: clickedPill.dataset.name // Vẫn gửi tên để hiển thị lên ô search
                    };

                    window.HeaderModule.setSearchQuery(filterInfo);
                });
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
        setSearchQuery: (queryOrInfo) => {
            const searchInputDesktop = document.getElementById('search-input-desktop');
            let filterDataToSend;
            let queryToDisplay;

            if (typeof queryOrInfo === 'string') {
                // Nếu là string (từ ô search), tạo object mặc định
                filterDataToSend = { type: 'search', query: queryOrInfo, id: null };
                queryToDisplay = queryOrInfo;
            } else {
                // Nếu là object (từ pill)
                filterDataToSend = queryOrInfo;
                // Nếu là pill "Tất cả", ô search hiển thị rỗng
                queryToDisplay = (queryOrInfo.type === 'all') ? "" : queryOrInfo.query;
            }

            // Cập nhật giá trị ô search
            if (searchInputDesktop) {
                searchInputDesktop.value = queryToDisplay;
            }
            // Gửi sự kiện đi
            dispatchSearchEvent(filterDataToSend);
        }
    };
})();
