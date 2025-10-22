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
                // Sửa khối if/else này
                if (user.avatarUrl && user.avatarUrl !== "default-avatar.png") {
                    // Nếu có avatarUrl VÀ nó KHÔNG PHẢI là 'default-avatar.png'
                    avatarImg.src = user.avatarUrl;
                } else {
                    // Ngược lại (nếu avatarUrl là null, rỗng, HOẶC là 'default-avatar.png')
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

        // ✅ SỬA LỖI: Cấu trúc lại
        // Khối if/else này CHỈ xử lý việc tải info user hoặc hiển thị "Khách"
        if (currentUserId && currentUserId !== '') {
            loadUserInfo(currentUserId);
        } else {
            console.warn("Không tìm thấy window.CURRENT_USER_ID. User có thể chưa đăng nhập.");
            const userNameSpan = document.getElementById('user-name');
            if (userNameSpan) {
                userNameSpan.textContent = "Khách";
                // document.getElementById('user-menu-button').style.display = 'none';
            }
        }

        // --- SEARCH INPUT ---
        // ✅ SỬA LỖI: Di chuyển ra ngoài khối else
        const searchInputDesktop = document.getElementById('search-input-desktop');
        if (searchInputDesktop) {
            searchInputDesktop.addEventListener('input', handleSearchInput);
            console.log("✅ Desktop search input ready");
        }

        // --- DROPDOWN MENU USER ---
        // ✅ SỬA LỖI: Di chuyển ra ngoài khối else
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');

        if (userMenuButton && userMenuDropdown) {
            userMenuButton.addEventListener('click', (event) => {
                event.stopPropagation();
                userMenuDropdown.classList.toggle('hidden');
            });
            window.addEventListener('click', () => {
                if (!userMenuDropdown.classList.contains('hidden')) {
                    userMenuDropdown.classList.add('hidden');
                }
            });
            userMenuDropdown.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            console.log("✅ User menu dropdown ready");
        }

        // --- PILL FILTER BAR ---
        // ✅ SỬA LỖI: Di chuyển ra ngoài khối else
        const pillContainer = document.getElementById('pill-container');

        async function loadAndRenderPills() {
            if (!pillContainer) {
                console.warn("Không tìm thấy #pill-container.");
                return;
            }

            try {
                // 1. Fetch dữ liệu
                const [topics, tags] = await Promise.all([
                    api.topics.getAll(),
                    api.tags.getAll()
                ]);

                // 2. Gộp
                const allFilters = [
                    ...topics.map(t => ({ id: t.id, name: t.name, type: 'topic' })),
                    ...tags.map(t => ({ id: t.id, name: t.name, type: 'tag' }))
                ];

                // 3. Xáo trộn
                for (let i = allFilters.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allFilters[i], allFilters[j]] = [allFilters[j], allFilters[i]];
                }

                // 4. Chọn 12 cái + thêm "Tất cả"
                const pillsToShow = [
                    { name: "Tất cả", type: 'all' },
                    ...allFilters.slice(0, 12)
                ];

                // 5. Render
                pillContainer.innerHTML = ''; // Xóa chữ "Đang tải..."
                pillsToShow.forEach((item, index) => {
                    const pill = document.createElement('button');
                    pill.className = 'filter-pill';
                    pill.textContent = item.name;
                    pill.dataset.type = item.type;
                    pill.dataset.id = item.id;
                    pill.dataset.name = item.name;

                    if (item.type === 'all') {
                        pill.classList.add('active');
                        pill.dataset.filter = "";
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
        // ✅ SỬA LỖI: Di chuyển ra ngoài khối else
        const filterPillBar = document.getElementById('filter-pill-bar');
        if (filterPillBar) {
            filterPillBar.addEventListener('click', (e) => {
                const clickedPill = e.target.closest('.filter-pill');
                if (!clickedPill) return;

                const currentActive = filterPillBar.querySelector('.filter-pill.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                clickedPill.classList.add('active');

                const filterInfo = {
                    type: clickedPill.dataset.type,
                    id: clickedPill.dataset.id ? parseInt(clickedPill.dataset.id) : null,
                    query: clickedPill.dataset.name
                };

                // Gọi hàm setSearchQuery đã export
                window.HeaderModule.setSearchQuery(filterInfo);
            });
        }

        // --- NOTIFICATION DROPDOWN (nếu có) ---
        // ✅ SỬA LỖI: Di chuyển ra ngoài khối else
        const notificationButton = document.getElementById('notification-button');
        const notificationDropdown = document.getElementById('notification-dropdown');

        if (notificationButton && notificationDropdown) {
            notificationButton.addEventListener('click', (event) => {
                event.stopPropagation();
                notificationDropdown.classList.toggle('hidden');
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
