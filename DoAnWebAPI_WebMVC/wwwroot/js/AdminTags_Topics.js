document.addEventListener('DOMContentLoaded', function () {
    // ======= DỮ LIỆU GIẢ LẬP =======
    const mockData = [
        { id: 1, type: "Chủ đề", name: "Phong cảnh", count: 34, created: "2025-09-30" },
        { id: 2, type: "Tag", name: "Hoàng hôn", count: 12, created: "2025-10-01" },
        { id: 3, type: "Tag", name: "Động vật", count: 19, created: "2025-10-02" },
        { id: 4, type: "Chủ đề", name: "Thành phố", count: 22, created: "2025-10-03" },
        { id: 5, type: "Chủ đề", name: "Kiến trúc", count: 41, created: "2025-10-04" },
        { id: 6, type: "Tag", name: "Tối giản", count: 8, created: "2025-10-05" },
    ];

    // ======= BIẾN TRẠNG THÁI =======
    let searchTerm = "";
    let filter = "Tất cả";

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const tableBody = document.getElementById('data-table-body');

    // Popups
    const createPopup = document.getElementById('create-popup');
    const detailsPopup = document.getElementById('details-popup');
    const createNewButton = document.getElementById('create-new-button');
    const closeCreatePopupBtn = document.getElementById('close-create-popup');
    const cancelCreatePopupBtn = document.getElementById('cancel-create-popup');
    const closeDetailsPopupBtn = document.getElementById('close-details-popup');
    const detailsTitle = document.getElementById('details-title');
    const detailsContent = document.getElementById('details-content');

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        const filtered = mockData.filter((item) => {
            const matchesType = filter === "Tất cả" || item.type === filter;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });

        tableBody.innerHTML = ''; // Xóa nội dung cũ

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-6 text-gray-500 italic">
                        Không tìm thấy kết quả phù hợp.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const row = document.createElement('tr');
            row.className = "border-t hover:bg-blue-50 cursor-pointer";
            row.dataset.id = item.id; // Gán ID để xử lý click

            const typeIcon = item.type === "Chủ đề"
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline text-blue-500 mr-1"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline text-green-500 mr-1"><path d="M12.586 2.586a2 2 0 0 0-2.828 0L2.172 10.172a2 2 0 0 0 0 2.828l7.414 7.414a2 2 0 0 0 2.828 0l7.414-7.414a2 2 0 0 0 0-2.828Z"/><path d="m18 8-8 8"/><path d="M9.05 14.95 14.95 9.05"/></svg>`;

            row.innerHTML = `
                <td class="px-4 py-3 font-medium">${item.name}</td>
                <td class="px-4 py-3">${typeIcon} ${item.type}</td>
                <td class="px-4 py-3">${item.count}</td>
                <td class="px-4 py-3">${item.created}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // ======= HÀM XỬ LÝ POPUP =======
    function showCreatePopup() { createPopup.classList.remove('hidden'); }
    function hideCreatePopup() { createPopup.classList.add('hidden'); }
    function showDetailsPopup(item) {
        detailsTitle.textContent = `Chi tiết ${item.type}`;
        detailsContent.innerHTML = `
            <p><b>ID:</b> ${item.id}</p>
            <p><b>Tên:</b> ${item.name}</p>
            <p><b>Loại:</b> ${item.type}</p>
            <p><b>Ngày tạo:</b> ${item.created}</p>
            <p><b>Số lượng ảnh chứa:</b> ${item.count}</p>
        `;
        detailsPopup.classList.remove('hidden');
    }
    function hideDetailsPopup() { detailsPopup.classList.add('hidden'); }

    // ======= GẮN SỰ KIỆN =======
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        render();
    });

    filterSelect.addEventListener('change', (e) => {
        filter = e.target.value;
        render();
    });

    // Click vào hàng trong bảng để xem chi tiết
    tableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            const itemId = parseInt(row.dataset.id, 10);
            const selectedItem = mockData.find(item => item.id === itemId);
            if (selectedItem) {
                showDetailsPopup(selectedItem);
            }
        }
    });

    // Sự kiện cho các nút popup
    createNewButton.addEventListener('click', showCreatePopup);
    closeCreatePopupBtn.addEventListener('click', hideCreatePopup);
    cancelCreatePopupBtn.addEventListener('click', hideCreatePopup);
    closeDetailsPopupBtn.addEventListener('click', hideDetailsPopup);

    // Lần render đầu tiên
    render();
});