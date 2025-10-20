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
            // ✅ Đã sửa u.username thành u.username
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
                    <td colspan="7" class="text-center text-gray-500 py-6 italic">
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

                <td class="px-4 py-3">
                <select
                    class="role-select w-full border border-gray-300 rounded-md p-2 text-xs"
                    data-id="${user.id}" 
                    ${user.status === 'Banned' ? 'disabled' : ''}>
                    <option value="User" ${user.role === 'User' ? 'selected' : ''}>User</option>
                    <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>

            <td class="px-4 py-3">
                <select 
                    class="status-select w-full border border-gray-300 rounded-md p-2 text-xs" 
                    data-id="${user.id}">
                    <option value="Active" ${user.status === 'Active' || !user.status ? 'selected' : ''}>Active</option>
                    <option value="Banned" ${user.status === 'Banned' ? 'selected' : ''}>Banned</option>
                </select>
            </td>
                <td class="px-4 py-3">${joinDate}</td>

                <td class="px-4 py-3 text-center">
                    <button
                        data-id="${user.id}" 
                        class="save-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs transition mx-auto 
                               disabled:bg-gray-400 disabled:cursor-not-allowed" 
                        disabled >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"
                        >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Lưu
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
            (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
        const saveBtn = e.target.closest('.save-btn');

        // Chỉ chạy nếu có .save-btn và không bị disabled
        if (saveBtn && !saveBtn.disabled) {
            const id = saveBtn.dataset.id;
            const row = saveBtn.closest('tr');
            if (!row) return;

            const roleSelect = row.querySelector('.role-select');
            const statusSelect = row.querySelector('.status-select');
            if (!roleSelect || !statusSelect) return;

            const newRole = roleSelect.value;
            const newStatus = statusSelect.value;

            if (confirm(`Bạn có chắc muốn cập nhật Người dùng ID ${id}?\nVai trò: ${newRole}\nTrạng thái: ${newStatus}`)) {
                // Hiển thị trạng thái đang lưu
                saveBtn.disabled = true;
                saveBtn.innerHTML = `
                <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Đang lưu...
            `;

                try {
                    // Gửi dữ liệu cập nhật tới API
                    const formData = new FormData();
                    formData.append('Role', newRole);
                    formData.append('Status', newStatus);

                    await api.users.update(id, formData);

                    // Cập nhật lại mảng cache JS
                    const userInCache = allUsers.find(u => u.id === parseInt(id));
                    if (userInCache) {
                        userInCache.role = newRole;
                        userInCache.status = newStatus;
                    }

                    // === CẬP NHẬT GIÁ TRỊ GỐC CHO DATASET ===
                    roleSelect.dataset.originalRole = newRole;
                    statusSelect.dataset.originalStatus = newStatus;

                    // === RESET NÚT LƯU VỀ TRẠNG THÁI MẶC ĐỊNH ===
                    saveBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Lưu
                `;
                    saveBtn.disabled = true; // vô hiệu hóa lại nút sau khi lưu thành công

                    alert('✅ Cập nhật thành công!');
                } catch (error) {
                    console.error('Lỗi khi cập nhật người dùng:', error);
                    alert(`❌ Không thể cập nhật: ${error.message}`);
                    render(); // render lại nếu có lỗi
                }
            }
        }
    });

    userTableBody.addEventListener('change', (e) => {
        // Chỉ kích hoạt nếu là một trong 2 dropdown
        const select = e.target.closest('.role-select, .status-select');
        if (!select) return;

        const row = select.closest('tr');
        const roleSelect = row.querySelector('.role-select');
        const statusSelect = row.querySelector('.status-select');
        const saveBtn = row.querySelector('.save-btn');

        // Logic 1: Xử lý Banned (từ yêu cầu trước)
        if (select.classList.contains('status-select')) {
            if (statusSelect.value === 'Banned') {
                roleSelect.value = 'User';
                roleSelect.disabled = true;
            } else {
                roleSelect.disabled = false;
            }
        }

        // Logic 2: Kiểm tra thay đổi để bật/tắt nút Lưu
        const originalRole = roleSelect.dataset.originalRole;
        const originalStatus = statusSelect.dataset.originalStatus;

        // Lấy giá trị *hiện tại* (sau khi logic 1 có thể đã can thiệp)
        const currentRole = roleSelect.value;
        const currentStatus = statusSelect.value;

        const hasChanged = (currentRole !== originalRole) || (currentStatus !== originalStatus);

        saveBtn.disabled = !hasChanged; // Bật nút nếu có thay đổi
    });

    // ======= HÀM TẢI DỮ LIỆU TỪ API =======
    async function loadUsers() {
        try {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-gray-500 py-6 italic">
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
                    <td colspan="7" class="text-center text-red-500 py-6 italic">
                        ${errorMessage}
                    </td>
                </tr>
            `;
        }
    }

    // Lần render đầu tiên -> thay vì render(), gọi loadUsers()
    loadUsers();
});