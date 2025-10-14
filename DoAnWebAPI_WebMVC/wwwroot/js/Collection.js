document.addEventListener('DOMContentLoaded', () => {

    /**
     * Factory function: Tạo ra một khu vực quản lý hoàn chỉnh.
     */
    const createManagementSection = (config) => {
        let mode = 'normal';
        let selectedIndex = null;
        const buttonsContainer = document.getElementById(config.buttonsId);
        const gridContainer = document.getElementById(config.gridId);

        if (!buttonsContainer || !gridContainer) {
            console.error(`Không thể tìm thấy container với ID: ${config.buttonsId} hoặc ${config.gridId}`);
            return;
        }

        const renderButtons = () => {
            buttonsContainer.innerHTML = '';
            if (mode === 'normal') {
                buttonsContainer.innerHTML = `
                    <button class="button button-blue" data-action="add"><i data-lucide="plus"></i><span>Thêm</span></button>
                    <button class="button button-gray" data-action="edit"><i data-lucide="edit-3"></i><span>Sửa</span></button>
                    <button class="button button-red" data-action="delete"><i data-lucide="trash-2"></i><span>Xóa</span></button>
                `;
            } else {
                buttonsContainer.innerHTML = `
                    <button class="button button-green" data-action="done"><i data-lucide="check"></i><span>Xong</span></button>
                `;
            }
        };

        const renderGrid = () => {
            gridContainer.innerHTML = config.data.map((item, i) => {
                const isSelected = selectedIndex === i;
                let cardClasses = 'item-card';
                if (mode !== 'normal' && isSelected) {
                    cardClasses += ` selected ${mode}-mode`;
                }
                // Dữ liệu data-* chỉ cần cho các mục "ảnh", không cần cho "bộ sưu tập" nữa
                const dataAttributes = config.itemName === 'ảnh' ? `
                    data-url="${item.url}"
                    data-title="${item.title}"
                    data-description="${item.description}"
                    data-likes="${item.likes}"
                    data-is-liked="${item.isLiked}"
                    data-tags='${JSON.stringify(item.tags || [])}'
                    data-topics='${JSON.stringify(item.topics || [])}'
                ` : '';

                return `
                <div class="${cardClasses}" 
                     data-index="${i}"
                     data-id="${item.id}"
                     ${dataAttributes}>
                    <img src="${item.thumbnail}" alt="${item.name}" />
                    <div class="item-card-title">${item.name}</div>
                    ${mode !== 'normal' && isSelected ? `
                    <div class="action-overlay" data-action="perform">
                        ${mode === 'edit' ? '<i data-lucide="edit-3"></i>' : '<i data-lucide="trash-2"></i>'}
                    </div>` : ''}
                </div>`;
            }).join('');
        };

        const handleButtonClick = (action) => {
            // Khi vào chế độ Sửa/Xóa hoặc khi Hoàn thành, ta render lại giao diện
            if (['edit', 'delete', 'done'].includes(action)) {
                mode = (action === 'done') ? 'normal' : action;
                selectedIndex = null; // Luôn reset lựa chọn khi đổi mode
                renderAll();
            }
            // Khi Thêm, ta điều hướng trang
            else if (action === 'add') {
                if (config.itemName === 'bộ sưu tập') {
                    window.location.href = '/Collection/AddCollection';
                }
                // ✅ THAY ĐỔI DUY NHẤT Ở DÒNG NÀY
                else if (config.itemName === 'ảnh') {
                    window.location.href = '/Image/AddImage'; // Thay thế alert bằng điều hướng
                }
            }
        };

        const handleGridClick = (target) => {
            const card = target.closest('.item-card');
            if (!card) return;
            const index = parseInt(card.dataset.index, 10);
            const item = config.data[index];

            if (mode === 'normal') {
                if (config.itemName === 'bộ sưu tập') {
                    const collectionId = card.dataset.id;
                    // Chuyển hướng đến trang CollectionDetail với ID tương ứng
                    window.location.href = `/Collection/CollectionDetail?id=${collectionId}`;
                }
                else if (config.itemName === 'ảnh') {
                    const imageData = {
                        id: card.dataset.id,
                        url: card.dataset.url,
                        title: card.dataset.title,
                        description: card.dataset.description,
                        likes: parseInt(card.dataset.likes, 10),
                        isLiked: card.dataset.isLiked === 'true',
                        tags: JSON.parse(card.dataset.tags),
                        topics: JSON.parse(card.dataset.topics)
                    };
                    if (typeof openModal === 'function') {
                        openModal(imageData);
                    } else {
                        console.error("Hàm openModal() không được tìm thấy.");
                    }
                }
            }
            else if (mode === 'edit') {
                if (confirm(`Bạn có chắc chắn muốn sửa "${item.name}" không?`)) {
                    if (config.itemName === 'bộ sưu tập') {
                        window.location.href = `/Collection/Edit?id=${item.id}`;
                    }
                    // ====> BỔ SUNG LOGIC CHUYỂN TRANG SỬA CHO "ẢNH" <====
                    else if (config.itemName === 'ảnh') {
                        window.location.href = `/Image/EditImage?id=${item.id}`;
                    }
                }
            } 
            else if (mode === 'delete') {
                // Chế độ xóa: Click để xác nhận và thực hiện xóa
                if (confirm(`Bạn có chắc chắn muốn xóa "${item.name}" không?`)) {
                    // Tại đây bạn sẽ gọi API để xóa.
                    // Dưới đây là giả lập sau khi xóa thành công:
                    alert(`Đã xóa "${item.name}"! (Đây là giả lập)`);

                    // Sau khi xóa, làm mới lại dữ liệu và giao diện
                    // (Trong ứng dụng thật, bạn sẽ xóa item khỏi mảng config.data)
                    // Ví dụ: config.data.splice(index, 1);

                    // Quay về chế độ bình thường
                    mode = 'normal';
                    renderAll();
                }
            }
        };

        const renderAll = () => {
            renderButtons();
            renderGrid();
            if (window.lucide) {
                lucide.createIcons();
            }
        };

        buttonsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (button) {
                handleButtonClick(button.dataset.action);
            }
        });

        gridContainer.addEventListener('click', (e) => handleGridClick(e.target));
        renderAll();
    };

    // --- KHỞI TẠO CÁC KHU VỰC ---

    // 1. Dữ liệu và cấu hình cho "Bộ sưu tập"
    const allCollections = [
        {
            id: "col_land_01",
            name: "Núi rừng hùng vĩ",
            thumbnail: "https://picsum.photos/id/1043/300/200",
            description: "Những dãy núi trập trùng ẩn hiện trong sương sớm, mang lại cảm giác bình yên và choáng ngợp trước sự vĩ đại của thiên nhiên.",
            images: Array.from({ length: 12 }, (_, i) => ({
                id: `land_img_${i + 1}`,
                url: `https://picsum.photos/id/${10 + i}/1200/800`,
                thumbnail: `https://picsum.photos/id/${10 + i}/400/300`,
                title: `Bình minh trên núi ${i + 1}`,
                description: "Khung cảnh tuyệt đẹp vào buổi sáng sớm khi những tia nắng đầu tiên xuyên qua lớp sương mù dày đặc, chiếu rọi xuống thung lũng xanh mướt.",
                likes: Math.floor(Math.random() * 2000) + 100,
                isLiked: Math.random() > 0.5,
                tags: [
                    { name: 'thiên nhiên', color: 'green' },
                    { name: 'núi', color: 'gray' },
                    { name: 'bình minh', color: 'orange' }
                ],
                topics: [{ name: 'Phong cảnh', color: 'indigo' }]
            }))
        },
        {
            id: "col_sea_01",
            name: "Biển xanh cát trắng",
            thumbnail: "https://picsum.photos/id/1011/300/200",
            description: "Bãi biển hoang sơ với làn nước trong xanh như ngọc và bờ cát trắng mịn trải dài dưới ánh nắng vàng rực rỡ.",
            images: Array.from({ length: 8 }, (_, i) => ({
                id: `sea_img_${i + 1}`,
                url: `https://picsum.photos/id/${100 + i}/1200/800`,
                thumbnail: `https://picsum.photos/id/${100 + i}/400/300`,
                title: `Hoàng hôn trên biển ${i + 1}`,
                description: "Mặt trời từ từ lặn xuống biển, nhuộm cả một vùng trời bằng những gam màu cam, tím, và đỏ rực rỡ, tạo nên một khung cảnh vô cùng lãng mạn.",
                likes: Math.floor(Math.random() * 3000) + 250,
                isLiked: Math.random() > 0.6,
                tags: [
                    { name: 'biển', color: 'blue' },
                    { name: 'mùa hè', color: 'orange' },
                    { name: 'du lịch', color: 'red' }
                ],
                topics: [{ name: 'Du lịch', color: 'indigo' }]
            }))
        },
        {
            id: "col_city_01",
            name: "Thành phố về đêm",
            thumbnail: "https://picsum.photos/id/1078/300/200",
            description: "Thành phố lên đèn với hàng triệu ánh sáng lấp lánh, tạo nên một khung cảnh hiện đại và đầy sức sống.",
            images: Array.from({ length: 15 }, (_, i) => ({
                id: `city_img_${i + 1}`,
                url: `https://picsum.photos/id/${210 + i}/1200/800`,
                thumbnail: `https://picsum.photos/id/${210 + i}/400/300`,
                title: `Góc phố về đêm ${i + 1}`,
                description: "Những tòa nhà cao tầng và dòng xe cộ hối hả tạo nên những vệt sáng dài, thể hiện nhịp sống sôi động và không bao giờ ngủ của thành phố.",
                likes: Math.floor(Math.random() * 1500) + 50,
                isLiked: Math.random() > 0.4,
                tags: [
                    { name: 'thành phố', color: 'purple' },
                    { name: 'về đêm', color: 'dark' },
                    { name: 'kiến trúc', color: 'blue' }
                ],
                topics: [
                    { name: 'Thành thị', color: 'indigo' },
                    { name: 'Kiến trúc', color: 'indigo' }
                ]
            }))
        }
    ];


    // Truyền dữ liệu này vào localStorage để trang detail có thể truy cập
    localStorage.setItem('allCollectionsData', JSON.stringify(allCollections));

    createManagementSection({
        buttonsId: 'collections-buttons',
        gridId: 'collections-grid',
        data: allCollections,
        itemName: 'bộ sưu tập'
    });

    // 2. Dữ liệu và cấu hình cho "Ảnh của tôi"
    const myImagesData = [{ id: "my_trip_01", name: "Chuyến đi Đà Lạt", title: "Sớm mai trên đồi chè", thumbnail: "https://picsum.photos/id/355/300/200", url: "https://picsum.photos/id/355/1200/800", description: "Kỷ niệm chuyến đi Đà Lạt cùng bạn bè, chúng mình đã dậy thật sớm để săn mây trên đồi chè Cầu Đất. Không khí thật tuyệt!", tags: [{ name: 'đà lạt', color: 'green' }, { name: 'bạn bè', color: 'blue' }, { name: 'du lịch', color: 'red' }, { name: 'kỷ niệm', color: 'purple' }], topics: [{ name: 'Bạn bè & Gia đình', color: 'indigo' }, { name: 'Du lịch', color: 'indigo' }], likes: 112, isLiked: true }, { id: "my_food_01", name: "Bữa tối cuối tuần", title: "Pizza tự làm tại nhà", thumbnail: "https://picsum.photos/id/1080/300/200", url: "https://picsum.photos/id/1080/1200/800", description: "Cuối tuần trổ tài làm pizza phô mai. Tuy không đẹp như ngoài hàng nhưng rất ngon và vui.", tags: [{ name: 'ẩm thực', color: 'orange' }, { name: 'pizza', color: 'red' }, { name: 'nấu ăn', color: 'brown' }, { name: 'gia đình', color: 'purple' }], topics: [{ name: 'Ẩm thực', color: 'indigo' }, { name: 'Bạn bè & Gia đình', color: 'indigo' }], likes: 68, isLiked: true }, { id: "my_pet_01", name: "Chú mèo lười", title: "Góc ngủ yêu thích của Bông", thumbnail: "https://picsum.photos/id/237/300/200", url: "https://picsum.photos/id/237/1200/800", description: "Đây là Bông, chú mèo của tôi. Nó có thể ngủ ở bất cứ đâu, bất cứ lúc nào.", tags: [{ name: 'thú cưng', color: 'brown' }, { name: 'mèo', color: 'gray' }, { name: 'dễ thương', color: 'pink' }], topics: [{ name: 'Thú cưng', color: 'indigo' }], likes: 250, isLiked: false },];
    localStorage.setItem('myImagesData', JSON.stringify(myImagesData));
    createManagementSection({
        buttonsId: 'images-buttons',
        gridId: 'images-grid',
        data: myImagesData,
        itemName: 'ảnh'
    });
});