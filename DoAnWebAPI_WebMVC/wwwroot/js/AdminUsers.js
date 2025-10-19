// File: AdminUsers.js

document.addEventListener('DOMContentLoaded', function () {
    // ======= BIẾN TRẠNG THÁI =======
    let allUsers = []; // Sẽ lưu trữ danh sách đầy đủ từ API
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
        // 1. Lọc dữ liệu (từ 'allUsers' thay vì 'mockUsers')
        const filteredUsers = allUsers.filter(u =>
            // ✅ Đã sửa u.name thành u.username
            (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

                let joinDate = 'N/A'; // Mặc định là N/A
                const joinDateStr = user.createdAt; // Lấy dữ liệu từ 'user.createdAt'
                if (joinDateStr && !joinDateStr.startsWith("0001-01-01")) {
                    joinDate = new Date(joinDateStr).toLocaleDateString('vi-VN');
                }
                const role = user.role || 'Người dùng'; // Đảm bảo có giá trị

                userRow.innerHTML = `
                    <td class="px-4 py-3 font-medium">${user.id}</td>
                    <td class="px-4 py-3">${user.username || 'N/A'}</td>
                    <td class="px-4 py-3">${user.email || 'N/A'}</td>
                    <td class="px-4 py-3">${role}</td>
                    <td class="px-4 py-3">${joinDate}</td>
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
        // Tính lại totalPages dựa trên bộ lọc hiện tại
        const totalPages = Math.ceil(allUsers.filter(u =>
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            u.id.toString().includes(searchTerm)
        ).length / usersPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    });

    // Nút Xóa (dùng event delegation)
    userTableBody.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm(`Bạn có chắc muốn xóa người dùng ID ${id}?`)) {
                // Vô hiệu hóa nút để tránh click đúp
                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Đang xóa...';

                try {
                    // ✅ GỌI API XÓA
                    await api.users.delete(id);

                    // Xóa thành công, cập nhật lại mảng 'allUsers'
                    allUsers = allUsers.filter(u => u.id !== parseInt(id));

                    // Render lại bảng
                    render();
                } catch (error) {
                    console.error('Lỗi khi xóa người dùng:', error);
                    alert(`Không thể xóa người dùng: ${error.message}`);
                    // Bật lại nút nếu lỗi
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = `<svg...></svg> Xóa`; // (Khôi phục lại icon)
                }
            }
        }
    });

    // ======= HÀM TẢI DỮ LIỆU TỪ API =======
    async function loadUsers() {
        try {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-6 italic">
                        Đang tải danh sách người dùng...
                    </td>
                </tr>
            `;
            // ✅ GỌI API LẤY DANH SÁCH
            const users = await api.users.getAll();
            allUsers = users; // Lưu vào biến trạng thái
            render(); // Render lại bảng với dữ liệu thật
        } catch (error) {
            console.error('Lỗi khi tải danh sách người dùng:', error);
            let errorMessage = `Không thể tải dữ liệu: ${error.message}`;
            if (error.message === "Unauthorized") {
                errorMessage = "Bạn không có quyền xem trang này. Vui lòng đăng nhập với tư cách Admin.";
            }
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-red-500 py-6 italic">
                        ${errorMessage}
                    </td>
                </tr>
            `;
        }
    }

    // Lần render đầu tiên -> thay vì render(), gọi loadUsers()
    loadUsers();
});