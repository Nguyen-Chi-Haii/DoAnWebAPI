// home.js: Logic dành riêng cho trang chủ

function initializeHomePage() {
    console.log("Home page script loaded and initialized.");

    const shortcuts = document.querySelectorAll('.shortcut-card');

    shortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', function () {
            const pageName = this.dataset.page;
            if (!pageName) return;

            // Tìm nút tương ứng trên sidebar
            const sidebarButton = document.querySelector(`.sidebar-item[data-page="${pageName}"]`);

            if (sidebarButton) {
                console.log(`Shortcut clicked: Navigating to ${pageName}`);
                // Kích hoạt sự kiện click của nút sidebar để tái sử dụng logic
                sidebarButton.click();
            } else {
                console.warn(`No sidebar button found for page: ${pageName}`);
            }
        });
    });
}

// Chạy hàm khởi tạo
initializeHomePage();
