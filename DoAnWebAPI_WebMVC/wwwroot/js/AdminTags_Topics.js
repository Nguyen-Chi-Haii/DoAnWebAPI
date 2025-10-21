document.addEventListener('DOMContentLoaded', function () {

    // ======= BIẾN TRẠNG THÁI =======
    let allData = []; // Sẽ lưu trữ dữ liệu từ API
    let searchTerm = "";
    let filter = "Tất cả"; // [cite: 5]

    // ======= LẤY CÁC PHẦN TỬ DOM =======
    const searchInput = document.getElementById('search-input'); // [cite: 4]
    const filterSelect = document.getElementById('filter-select'); // [cite: 5]
    const tableBody = document.getElementById('data-table-body'); // [cite: 9]

    // Popups
    const createPopup = document.getElementById('create-popup');
    const detailsPopup = document.getElementById('details-popup');
    const createNewButton = document.getElementById('create-new-button'); // [cite: 6]
    const closeCreatePopupBtn = document.getElementById('close-create-popup'); // [cite: 10]
    const cancelCreatePopupBtn = document.getElementById('cancel-create-popup'); // 
    const closeDetailsPopupBtn = document.getElementById('close-details-popup'); // [cite: 14]
    const detailsTitle = document.getElementById('details-title');
    const detailsContent = document.getElementById('details-content');

    // DOM cho popup tạo mới
    const createPopupSelect = createPopup.querySelector('select');
    const createPopupInput = createPopup.querySelector('input[type="text"]');
    const createPopupSaveBtn = createPopup.querySelector('button.bg-blue-600');


    // ======= HÀM TẢI DỮ LIỆU TỪ API =======
    async function loadData() {
        tableBody.innerHTML = `
            <tr><td colspan="4" class="text-center py-6 text-gray-500 italic">Đang tải dữ liệu...</td></tr>
        `;

        try {
            // Gọi cả hai API cùng lúc
            const [topics, tags] = await Promise.all([
                api.topics.getAll(), //
                api.tags.getAll()    //
            ]);

            // Chuyển đổi dữ liệu API về một định dạng chung
            const mappedTopics = topics.map(t => ({
                id: t.id,
                name: t.name,
                type: 'Chủ đề',
                // SỬA 2 DÒNG NÀY:
                count: t.imageCount || 0, // Đọc 'imageCount' từ API
                created: t.createdAt,     // Đọc 'createdAt' từ API
                isTopic: true
            }));

            const mappedTags = tags.map(t => ({
                id: t.id,
                name: t.name,
                type: 'Tag',
                // Giả sử TagDTO của bạn có 'imageCount' và 'createdAt'
                // Nếu tên thuộc tính khác, bạn cần sửa ở đây
                count: t.imageCount || 0,
                created: t.createdAt,
                isTopic: false // Flag để phân biệt
            }));

            allData = [...mappedTopics, ...mappedTags];
            render();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            tableBody.innerHTML = `
                <tr><td colspan="4" class="text-center py-6 text-red-500 italic">
                    Không thể tải dữ liệu: ${error.message}
                </td></tr>
            `;
        }
    }

    // ======= HÀM RENDER CHÍNH =======
    function render() {
        const filtered = allData.filter((item) => {
            const matchesType = filter === "Tất cả" || item.type === filter;
            // ✅ ĐÃ SỬA: 'username' thành 'name' và thêm kiểm tra "null"
            const matchesSearch = item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });

        tableBody.innerHTML = ''; // Xóa nội dung cũ

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="4" class="text-center py-6 text-gray-500 italic">
                    Không tìm thấy kết quả phù hợp.
                </td></tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const row = document.createElement('tr');
            row.className = "border-t hover:bg-blue-50 cursor-pointer transition";
            row.dataset.id = item.id;
            row.dataset.type = item.type; // Lưu lại type để tìm kiếm

            const typeIcon = item.type === "Chủ đề"
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline text-blue-500 mr-1"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline text-green-500 mr-1"><path d="M12.586 2.586a2 2 0 0 0-2.828 0L2.172 10.172a2 2 0 0 0 0 2.828l7.414 7.414a2 2 0 0 0 2.828 0l7.414-7.414a2 2 0 0 0 0-2.828Z"/><path d="m18 8-8 8"/><path d="M9.05 14.95 14.95 9.05"/></svg>`;

            // Xử lý an toàn cho các giá trị có thể null
            const imageCount = item.count !== null ? item.count : 'N/A';
            const createdDate = item.created
                ? new Date(item.created).toLocaleDateString('vi-VN')
                : 'N/A';

            row.innerHTML = `
                <td class="px-4 py-3 font-medium">${item.name}</td>
                <td class="px-4 py-3">${typeIcon} ${item.type}</td>
                <td class="px-4 py-3">${imageCount}</td>
                <td class="px-4 py-3">${createdDate}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // ======= HÀM XỬ LÝ POPUP =======
    function showCreatePopup() {
        createPopupInput.value = ''; // Xóa input cũ
        createPopup.classList.remove('hidden');
        createPopupInput.focus();
    }
    function hideCreatePopup() { createPopup.classList.add('hidden'); }

    function showDetailsPopup(item) {
        detailsTitle.textContent = `Chi tiết ${item.type}`;

        const imageCount = item.count !== null ? item.count : 'N/A';
        const createdDate = item.created
            ? new Date(item.created).toLocaleDateString('vi-VN')
            : 'N/A';

        detailsContent.innerHTML = `
            <p class="text-gray-600"><b class="text-gray-900">ID:</b> ${item.id}</p>
            <p class="text-gray-600"><b class="text-gray-900">Tên:</b> ${item.name}</p>
            <p class="text-gray-600"><b class="text-gray-900">Loại:</b> ${item.type}</p>
            <p class="text-gray-600"><b class="text-gray-900">Ngày tạo:</b> ${createdDate}</p>
            <p class="text-gray-600"><b class="text-gray-900">Số lượng ảnh:</b> ${imageCount}</p>
            
            <div class="flex justify-end gap-2 mt-5 border-t pt-4">
                <button id="delete-btn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                    Xóa ${item.type}
                </button>
            </div>
        `;

        // Gắn sự kiện Xóa
        detailsPopup.querySelector('#delete-btn').onclick = () => handleDelete(item);

        detailsPopup.classList.remove('hidden');
    }
    function hideDetailsPopup() { detailsPopup.classList.add('hidden'); }

    // ======= HÀM XỬ LÝ SỰ KIỆN (Create, Delete) =======

    // Xử lý sự kiện nhấn nút LƯU trên popup TẠO MỚI
    async function handleCreate() {
        const type = createPopupSelect.value; // "Chủ đề" hoặc "Tag" 
        const name = createPopupInput.value.trim();

        if (!name) {
            alert("Tên không được để trống.");
            return;
        }

        createPopupSaveBtn.disabled = true;
        createPopupSaveBtn.textContent = 'Đang lưu...';

        try {
            if (type === 'Chủ đề') {
                await api.topics.create({ name: name }); //
            } else {
                await api.tags.create({ name: name }); //
            }
            hideCreatePopup();
            await loadData(); // Tải lại toàn bộ dữ liệu
        } catch (error) {
            console.error(`Lỗi khi tạo ${type}:`, error);
            alert(`Không thể tạo: ${error.message}`);
        } finally {
            createPopupSaveBtn.disabled = false;
            createPopupSaveBtn.textContent = 'Lưu';
        }
    }

    // Xử lý sự kiện nhấn nút XÓA trên popup CHI TIẾT
    async function handleDelete(item) {
        if (!confirm(`Bạn có chắc muốn xóa ${item.type}: "${item.name}"?\nThao tác này không thể hoàn tác.`)) {
            return;
        }

        try {
            if (item.isTopic) {
                await api.topics.delete(item.id); //
            } else {
                await api.tags.delete(item.id); //
            }
            hideDetailsPopup();
            await loadData(); // Tải lại toàn bộ dữ liệu
        } catch (error) {
            console.error(`Lỗi khi xóa ${item.type}:`, error);
            alert(`Không thể xóa: ${error.message}`);
        }
    }


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
            const itemType = row.dataset.type;
            const selectedItem = allData.find(item => item.id === itemId && item.type === itemType);

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

    // Sự kiện cho nút LƯU (Tạo mới)
    createPopupSaveBtn.addEventListener('click', handleCreate);

    // Lần tải đầu tiên
    loadData();
});