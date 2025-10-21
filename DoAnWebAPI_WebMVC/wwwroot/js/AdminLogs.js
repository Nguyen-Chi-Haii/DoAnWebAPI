document.addEventListener('DOMContentLoaded', function () {
    // ======= BIẾN TRẠNG THÁI =======
    let allLogs = []; // Dữ liệu thật từ API
    let currentPage = 1;
    let searchTerm = "";
    let filterType = "Tất cả";
    let dateFilter = "";
    const perPage = 10;

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const tableBody = document.getElementById('notifications-table-body');
    const searchInput = document.getElementById('search-input');
    const filterTypeSelect = document.getElementById('filter-type');
    const dateFilterInput = document.getElementById('date-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // ======= HÀM TẢI DỮ LIỆU TỪ API =======
    async function loadData() {
        tableBody.innerHTML = `
            <tr><td colspan="6" class="text-center py-6 text-gray-500 italic">Đang tải nhật ký hệ thống...</td></tr>
        `;
        try {
            // Lấy dữ liệu logs (đã bao gồm username và ngày tháng từ API)
            const logs = await api.adminLogs.getAll();

            // API đã trả về tất cả thông tin, chỉ cần lưu lại
            allLogs = logs;

            render();
        } catch (error) {
            console.error("Lỗi khi tải Admin Logs:", error);
            tableBody.innerHTML = `
                <tr><td colspan="6" class="text-center py-6 text-red-500 italic">
                    Không thể tải dữ liệu: ${error.message}
                </td></tr>
            `;
        }
    }

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        // 1. Lọc dữ liệu
        const filteredLogs = allLogs.filter(log => {
            const matchesType = filterType === "Tất cả" || log.actionType === filterType;

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = log.meta.toString().toLowerCase().includes(searchLower) ||
                log.adminUsername.toLowerCase().includes(searchLower) ||
                log.target.toString().includes(searchLower);

            // Chuyển đổi ngày từ API (ISO string) thành YYYY-MM-DD
            const logDate = log.createdAt.split('T')[0];
            const matchesDate = !dateFilter || logDate === dateFilter;

            return matchesType && matchesSearch && matchesDate;
        });

        // 2. Tính toán phân trang
        const totalPages = Math.ceil(filteredLogs.length / perPage);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const displayedLogs = filteredLogs.slice(
            (currentPage - 1) * perPage,
            currentPage * perPage
        );

        // 3. Render bảng
        tableBody.innerHTML = '';
        if (displayedLogs.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="6" class="text-center py-6 text-gray-500 italic">
                    Không có nhật ký nào phù hợp.
                </td></tr>
            `;
        } else {
            displayedLogs.forEach(log => {
                const row = document.createElement('tr');
                row.className = "border-b hover:bg-gray-50 transition";

                // Định dạng ngày giờ
                const logDateTime = new Date(log.createdAt);
                const logDate = logDateTime.toLocaleDateString('vi-VN');
                const logTime = logDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                row.innerHTML = `
                    <td class="px-4 py-3 font-medium text-gray-900">${log.id}</td>
                    <td class="px-4 py-3">${log.adminUsername}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            ${log.actionType}
                        </span>
                    </td>
                    <td class="px-4 py-3">${log.meta} (Target: ${log.target})</td>
                    <td class="px-4 py-3">${logDate}</td>
                    <td class="px-4 py-3">${logTime}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        // 4. Cập nhật phân trang
        pageInfo.innerHTML = `Trang <b>${currentPage}</b> / ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // ======= GẮN SỰ KIỆN =======
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        currentPage = 1;
        render();
    });

    filterTypeSelect.addEventListener('change', (e) => {
        filterType = e.target.value;
        currentPage = 1;
        render();
    });

    dateFilterInput.addEventListener('change', (e) => {
        dateFilter = e.target.value;
        currentPage = 1;
        render();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        // Cần tính lại totalPages dựa trên bộ lọc hiện tại
        const totalPages = Math.ceil(allLogs.filter(log => {
            const matchesType = filterType === "Tất cả" || log.actionType === filterType;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = log.meta.toString().toLowerCase().includes(searchLower) ||
                log.adminUsername.toLowerCase().includes(searchLower) ||
                log.target.toString().includes(searchLower);
            const logDate = log.createdAt.split('T')[0];
            const matchesDate = !dateFilter || logDate === dateFilter;
            return matchesType && matchesSearch && matchesDate;
        }).length / perPage);

        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    // ======= TẢI DỮ LIỆU LẦN ĐẦU =======
    loadData();
});