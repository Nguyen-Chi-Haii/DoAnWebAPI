// search.js
let searchQuery = "";

const searchInputDesktop = document.getElementById('search-input-desktop');
const searchInputMobile = document.getElementById('search-input-mobile');
const currentSearchDisplay = document.getElementById('current-search');

const updateSearchDisplay = () => {
    if (currentSearchDisplay) currentSearchDisplay.textContent = `"${searchQuery}"`;
};

const handleSearchInput = (e) => {
    searchQuery = e.target.value;
    if (e.target.id === 'search-input-desktop' && searchInputMobile) searchInputMobile.value = searchQuery;
    if (e.target.id === 'search-input-mobile' && searchInputDesktop) searchInputDesktop.value = searchQuery;
    updateSearchDisplay();
};

document.addEventListener('DOMContentLoaded', () => {
    // --- PHẦN LOGIC CHO DROPDOWN MENU ---
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
    }

    // --- PHẦN LOGIC CHO THANH TÌM KIẾM (SEARCH) ---
    const searchInputDesktop = document.getElementById('search-input-desktop');
    const searchInputMobile = document.getElementById('search-input-mobile');

    const handleSearchInput = (e) => {
        const searchQuery = e.target.value;
        if (e.target.id === 'search-input-desktop' && searchInputMobile) {
            searchInputMobile.value = searchQuery;
        }
        if (e.target.id === 'search-input-mobile' && searchInputDesktop) {
            searchInputDesktop.value = searchQuery;
        }
        // Thêm logic cập nhật hiển thị kết quả tìm kiếm ở đây nếu cần
    };

    if (searchInputDesktop) {
        searchInputDesktop.addEventListener('input', handleSearchInput);
    }
    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', handleSearchInput);
    }

    // --- GỌI LUCIDE MỘT LẦN DUY NHẤT Ở CUỐI CÙNG ---
    // Điều này đảm bảo tất cả các sự kiện đã được gán trước khi icon được thay thế.
    lucide.createIcons();
});
