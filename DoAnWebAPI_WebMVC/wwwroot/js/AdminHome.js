// File: wwwroot/js/AdminHome.js

document.addEventListener('DOMContentLoaded', function () {
    console.log("Admin Home script loaded.");

    // DOM Elements for dynamic content
    const pendingBadge = document.getElementById('pending-count-badge');
    // ✅ Get the second badge ID
    const pendingBadgeShortcut = document.getElementById('pending-count-badge-shortcut');
    const logsContainer = document.getElementById('latest-logs-container');
    const logsPlaceholder = document.getElementById('logs-placeholder');

    // --- Function to fetch Pending Image Count ---
    async function fetchPendingCount() {
        try {
            const result = await api.images.getAll({ status: 'pending', page: 1, pageSize: 1 });
            // ✅ ĐÃ SỬA: Đọc đúng thuộc tính 'totalCount' từ API
            const count = result.totalCount || 0;

            console.log("Pending image count:", count);

            // ✅ Update BOTH badges
            const badges = [pendingBadge, pendingBadgeShortcut]; // Array of badge elements
            badges.forEach(badge => {
                if (badge) { // Check if element exists before updating
                    if (count > 0) {
                        badge.textContent = count;
                        badge.classList.remove('hidden');
                        badge.classList.add('inline-flex'); // Keep flex for alignment
                    } else {
                        badge.classList.add('hidden');
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching pending image count:", error);
            // Update both badges on error
            const badges = [pendingBadge, pendingBadgeShortcut];
            badges.forEach(badge => {
                if (badge) {
                    badge.textContent = '!';
                    badge.classList.remove('hidden');
                    badge.classList.add('inline-flex');
                }
            });
        }
    }

    // --- Function to fetch and display Latest Logs ---
    async function fetchLatestLogs() {
        if (!logsContainer || !logsPlaceholder) {
            console.error("Logs container or placeholder not found.");
            return;
        }

        logsPlaceholder.textContent = 'Đang tải thông báo...'; // Show loading

        try {
            const allLogs = await api.adminLogs.getAll();
            console.log("Fetched logs:", allLogs);

            const latestLogs = allLogs.slice(0, 3); // Already sorted by API

            logsContainer.innerHTML = ''; // Clear the container

            if (latestLogs.length === 0) {
                logsContainer.innerHTML = `<p class="text-center text-gray-500 italic">Chưa có thông báo nào.</p>`;
                return;
            }

            latestLogs.forEach(log => {
                const logElement = document.createElement('div');
                logElement.className = 'flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0';

                // Calculate time ago
                let timeString = 'không xác định';
                if (log.createdAt) {
                    try {
                        const logDate = new Date(log.createdAt);
                        const now = new Date();
                        const diffSeconds = Math.round((now - logDate) / 1000);
                        const diffMinutes = Math.round(diffSeconds / 60);
                        const diffHours = Math.round(diffMinutes / 60);
                        const diffDays = Math.round(diffHours / 24);

                        if (diffSeconds < 60) timeString = `vài giây trước`;
                        else if (diffMinutes < 60) timeString = `${diffMinutes} phút trước`;
                        else if (diffHours < 24) timeString = `${diffHours} giờ trước`;
                        else if (diffDays < 7) timeString = `${diffDays} ngày trước`;
                        else timeString = logDate.toLocaleDateString('vi-VN'); // Show date if older than a week
                    } catch (e) { console.warn("Date parsing error for log:", log.id, e); }
                }

                // Safely display meta
                let metaText = '';
                if (log.meta) {
                    try {
                        // Attempt to parse if it looks like JSON, otherwise display as string
                        const metaString = log.meta.toString();
                        if (metaString.startsWith('{') && metaString.endsWith('}')) {
                            metaText = `: ${JSON.stringify(JSON.parse(metaString))}`; // Re-stringify for display consistency
                        } else {
                            metaText = `: ${metaString}`;
                        }
                    } catch (e) {
                        metaText = `: ${log.meta.toString()}`; // Fallback to string if JSON parse fails
                    }
                }

                logElement.innerHTML = `
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </div>
                    <div class="flex-1 text-sm min-w-0"> <p class="text-gray-800 break-words"> <span class="font-semibold">${log.adminUsername || 'Unknown Admin'}</span>
                            đã thực hiện hành động
                            <span class="font-medium text-blue-600">${log.actionType || 'UNKNOWN_ACTION'}</span>
                            ${metaText}
                            (Target: ${log.target || 'N/A'})
                        </p>
                        <p class="text-xs text-gray-500 mt-1">${timeString}</p>
                    </div>
                `;
                logsContainer.appendChild(logElement);
            });

        } catch (error) {
            console.error("Error fetching latest logs:", error);
            logsContainer.innerHTML = `<p class="text-center text-red-500 italic">Không thể tải thông báo. ${error.message}</p>`;
        }
    }

    // --- Initialize Shortcut Clicks ---
    function initializeShortcuts() {
        // ✅ Simplified: Add click listener directly to the container
        // Assumes all children with href are shortcuts
        const shortcutContainer = document.querySelector('.grid.gap-6'); // Adjust selector if needed
        if (shortcutContainer) {
            shortcutContainer.addEventListener('click', function (event) {
                // Find the closest ancestor anchor tag (<a>)
                const shortcutLink = event.target.closest('a.shortcut-card');
                if (shortcutLink) {
                    const targetUrl = shortcutLink.getAttribute('href');
                    if (targetUrl) {
                        event.preventDefault(); // Prevent default link behavior if needed, then navigate
                        console.log(`Shortcut clicked: Navigating to ${targetUrl}`);
                        window.location.href = targetUrl;
                    } else {
                        console.warn(`Shortcut card is missing href attribute.`);
                    }
                }
            });
            console.log("Shortcuts initialized using event delegation.");
        } else {
            console.error("Shortcut container not found.");
        }
    }

    // --- Run Initialization ---
    // Check if api object is available (ensure apiServices.js loads first)
    if (typeof api !== 'undefined' && api.images && api.adminLogs) {
        initializeShortcuts();
        fetchPendingCount(); // Fetch count when page loads
        fetchLatestLogs(); // Fetch logs when page loads
    } else {
        console.error("API service is not available. Ensure apiServices.js is loaded before AdminHome.js.");
        // Optionally display an error to the user
        logsPlaceholder.textContent = 'Lỗi: Không thể khởi tạo dịch vụ API.';
        logsPlaceholder.classList.add('text-red-500');
    }
});