// Chờ cho toàn bộ cây DOM của trang được tải xong
document.addEventListener('DOMContentLoaded', function () {
    setupSidebarInteractions();
});

// Hàm thiết lập các sự kiện cho sidebar
function setupSidebarInteractions() {
    // --- PHẦN 1: XỬ LÝ ĐÓNG/MỞ SIDEBAR TRÊN MOBILE (Giữ nguyên) ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');

    if (mobileMenuButton && sidebar && backdrop) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('-translate-x-full');
            backdrop.classList.toggle('hidden');
        };
        mobileMenuButton.addEventListener('click', toggleSidebar);
        backdrop.addEventListener('click', toggleSidebar);
    } else {
        console.error('Không tìm thấy một trong các thành phần của sidebar: mobile-menu-button, sidebar, hoặc backdrop.');
    }

    // --- PHẦN 2: TỰ ĐỘNG SET ACTIVE STATE DỰA TRÊN URL (Logic mới) ---
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const currentPath = window.location.pathname; // Lấy đường dẫn hiện tại, ví dụ: "/Admin/Stats"

    let activeItemFound = false;

    sidebarItems.forEach(item => {
        // Lấy href từ thẻ <a> (hoặc button nếu bạn chưa đổi)
        const itemPath = item.getAttribute('href');
        // Xóa trạng thái active cũ để đảm bảo sạch sẽ
        item.classList.remove('active', 'bg-blue-100', 'text-blue-600');

        // So sánh đường dẫn của item với đường dẫn hiện tại
        // So sánh không phân biệt hoa thường để tránh lỗi
        if (itemPath && currentPath.toLowerCase() === itemPath.toLowerCase()) {
            item.classList.add('active', 'bg-blue-100', 'text-blue-600');
            activeItemFound = true;
        }
    });

    // Trường hợp đặc biệt: Nếu đang ở trang chủ (ví dụ /Admin hoặc /) nhưng không khớp link nào
    // thì vẫn set active cho nút Trang chủ
    if (!activeItemFound && (currentPath === '/Admin' || currentPath === '/Admin/' || currentPath === '/')) {
        const homeButton = document.querySelector('.sidebar-item[data-page="Trang chủ"]');
        if (homeButton) {
            homeButton.classList.add('active', 'bg-blue-100', 'text-blue-600');
        }
    }
}