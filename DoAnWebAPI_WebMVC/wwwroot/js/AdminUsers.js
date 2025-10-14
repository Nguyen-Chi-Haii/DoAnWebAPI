document.addEventListener('DOMContentLoaded', function () {
    // ======= DỮ LIỆU GIẢ LẬP =======
    const mockUsers = Array.from({ length: 36 }, (_, i) => ({
        id: i + 1,
        name: `Người dùng ${i + 1}`,
        email: `user${i + 1}@gmail.com`,
        joined: `2025-10-${(i % 9) + 10}`, // Sửa lại để ngày hợp lệ
        role: i % 5 === 0 ? "Quản trị viên" : "Người dùng",
    }));

    // ======= BIẾN TRẠNG THÁI =======
    let currentPage = 1;
    let searchTerm = "";
    const usersPerPage = 10;

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const userTableBody = document.getElementById('user-table-body');
    const searchInput = document.getElementById('search-input');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        // 1. Lọc dữ liệu
        const filteredUsers = mockUsers.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id.toString().includes(searchTerm)
        );

        // 2. Tính toán phân trang
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        if (currentPage < 1 && totalPages > 0) {
            currentPage = 1;
        }

        const displayedUsers = filteredUsers.slice(
            (currentPage - 1) * usersPerPage,
            currentPage * usersPerPage
        );

        // 3. Xóa bảng cũ và render bảng mới
        userTableBody.innerHTML = '';
        if (displayedUsers.length === 0) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-6 italic">
                        Không có người dùng nào phù hợp.
                    </td>
                </tr>
            `;
        } else {
            displayedUsers.forEach(user => {
                const userRow = document.createElement('tr');
                userRow.className = "border-b hover:bg-gray-50 transition";
                userRow.innerHTML = `
                    <td class="px-4 py-3 font-medium">${user.id}</td>
                    <td class="px-4 py-3">${user.name}</td>
                    <td class="px-4 py-3">${user.email}</td>
                    <td class="px-4 py-3">${user.role}</td>
                    <td class="px-4 py-3">${user.joined}</td>
                    <td class="px-4 py-3 text-center">
                        <button data-id="${user.id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-xs transition mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                             Xóa
                        </button>
                    </td>
                `;
                userTableBody.appendChild(userRow);
            });
        }

        // 4. Cập nhật thông tin và trạng thái nút phân trang
        pageInfo.innerHTML = `Trang <b>${currentPage}</b> / ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // ======= GẮN SỰ KIỆN =======

    // Tìm kiếm
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        currentPage = 1; // Reset về trang đầu khi tìm kiếm
        render();
    });

    // Nút phân trang
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(mockUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toString().includes(searchTerm)).length / usersPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    // Nút Xóa (dùng event delegation)
    userTableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm(`Bạn có chắc muốn xóa người dùng ID ${id}?`)) {
                alert(`🗑️ Đã xóa người dùng ${id}`);
                // Ở đây bạn sẽ gọi API để xóa thật, rồi render() lại
            }
        }
    });

    // Lần render đầu tiên khi tải trang
    render();
});