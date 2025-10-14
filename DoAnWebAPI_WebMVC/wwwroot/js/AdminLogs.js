document.addEventListener('DOMContentLoaded', function () {
    // ======= DỮ LIỆU GIẢ LẬP =======
    const mockNotifications = Array.from({ length: 48 }, (_, i) => ({
        id: i + 1,
        type: ["Ảnh tải lên", "Chờ duyệt", "Nhật ký mới"][i % 3],
        message: [
            `Người dùng user_${100 + i} đã tải lên một ảnh mới.`,
            `Ảnh #${200 + i} của user_${50 + i} đang chờ được duyệt.`,
            `Hệ thống ghi nhận hoạt động mới từ Admin.`
        ][i % 3],
        user: ["Nguyễn Văn A", "Admin", "Trần Thị B"][i % 3],
        date: `2025-10-0${(i % 9) + 1}`,
        time: `0${i % 9}:3${i % 6}:15`,
    }));

    // ======= BIẾN TRẠNG THÁI =======
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

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        // 1. Lọc và tìm kiếm
        const filteredData = mockNotifications
            .filter(n => filterType === "Tất cả" || n.type === filterType)
            .filter(n =>
                n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.user.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter(n => !dateFilter || n.date === dateFilter);

        // 2. Tính toán phân trang
        const totalPages = Math.ceil(filteredData.length / perPage);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1 && totalPages > 0) currentPage = 1;

        const displayed = filteredData.slice(
            (currentPage - 1) * perPage,
            currentPage * perPage
        );

        // 3. Render bảng
        tableBody.innerHTML = '';
        if (displayed.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-6 italic">
                        Không có thông báo nào phù hợp.
                    </td>
                </tr>
            `;
        } else {
            displayed.forEach(n => {
                let typeClass = '';
                switch (n.type) {
                    case 'Ảnh tải lên': typeClass = 'text-blue-600'; break;
                    case 'Chờ duyệt': typeClass = 'text-orange-500'; break;
                    case 'Nhật ký mới': typeClass = 'text-green-600'; break;
                }

                const row = document.createElement('tr');
                row.className = "border-b hover:bg-gray-50 transition";
                row.innerHTML = `
                    <td class="px-4 py-3 font-medium">${n.id}</td>
                    <td class="px-4 py-3">${n.user}</td>
                    <td class="px-4 py-3 font-medium ${typeClass}">${n.type}</td>
                    <td class="px-4 py-3">${n.message}</td>
                    <td class="px-4 py-3">${n.date}</td>
                    <td class="px-4 py-3">${n.time}</td>
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
        const totalPages = Math.ceil(mockNotifications.filter(n => filterType === "Tất cả" || n.type === filterType).filter(n => n.message.toLowerCase().includes(searchTerm.toLowerCase()) || n.user.toLowerCase().includes(searchTerm.toLowerCase())).filter(n => !dateFilter || n.date === dateFilter).length / perPage);
        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    // Lần render đầu tiên
    render();
});