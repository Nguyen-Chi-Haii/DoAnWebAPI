// footer-nav.js
const siteName = "Image For Free";
const footerInfo = "© 2025 My Gallery. All rights reserved.";
const container = document.getElementById('footer-and-nav-container');

const renderFooterAndNav = () => {
    const footerHtml = `
        <footer class="hidden md:flex flex-col items-center justify-center bg-gray-900 text-gray-300 p-4 border-t border-gray-700 w-full fixed bottom-0 left-0 right-0">
            <div class="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl text-sm gap-2">
                <div class="font-semibold">${siteName}</div>
                <div class="flex items-center gap-4 text-gray-600 text-sm">
                    <a href="#" class="hover:underline">Giới thiệu</a>
                    <a href="#" class="hover:underline">Liên hệ</a>
                    <a href="#" class="hover:underline">Điều khoản</a>
                    <a href="#" class="hover:underline">Chính sách</a>
                </div>
                <div class="text-xs text-gray-500">${footerInfo}</div>
            </div>
        </footer>
    `;

    const navBarHtml = `
        <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl flex justify-around items-center py-2 z-50">
            <button class="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <div data-lucide="home" class="w-6 h-6"></div>
                <span class="text-xs">Home</span>
            </button>
            <button class="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <div data-lucide="image" class="w-6 h-6"></div>
                <span class="text-xs">Bộ sưu tập</span>
            </button>
            <button class="relative -translate-y-3 bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition shadow-lg ring-4 ring-blue-200">
                <div data-lucide="plus-circle" class="w-7 h-7"></div>
            </button>
            <button class="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <div data-lucide="bar-chart-3" class="w-6 h-6"></div>
                <span class="text-xs">Thống kê</span>
            </button>
            <button class="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <div data-lucide="user-cog" class="w-6 h-6"></div>
                <span class="text-xs">Cá nhân</span>
            </button>
        </nav>
    `;

    container.innerHTML = footerHtml + navBarHtml;
};

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    renderFooterAndNav();
    lucide.createIcons();
});
