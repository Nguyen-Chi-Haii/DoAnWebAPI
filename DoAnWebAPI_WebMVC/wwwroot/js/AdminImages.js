// File: wwwroot/js/AdminImages.js
document.addEventListener('DOMContentLoaded', function () {
    // ======= STATE VARIABLES =======
    let currentPage = 1;
    let filters = {
        search: "",
        topicId: "Tất cả", // Use topicId
        tagName: "",     // Use tagName for filtering (API expects this)
        date: ""
    };
    const imagesPerPage = 10; // Corresponds to pageSize in API call
    const userCache = {}; // Cache for user names

    // ======= DOM ELEMENTS =======
    const imageListContainer = document.getElementById('image-list-container');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const filterPopup = document.getElementById('filter-popup');
    const filterButton = document.getElementById('filter-button');
    const closeFilterPopupBtn = document.getElementById('close-filter-popup');
    const topicFilterSelect = document.getElementById('topic-filter-select');
    const tagFilterInput = document.getElementById('tag-filter-input'); // Input for tag name
    const dateFilterInput = document.getElementById('date-filter-input');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const loadingSpinner = document.getElementById('loading-spinner'); // Get spinner element

    // ======= SPINNER FUNCTIONS =======
    function showSpinner() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        imageListContainer.innerHTML = ''; // Clear old content
        noResults.classList.add('hidden'); // Hide no results message
    }

    function hideSpinner() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }

    // ======= MAIN FETCH AND RENDER FUNCTION =======
    async function fetchAndRenderData() {
        showSpinner(); // Bật spinner

        try {
            // ✅ SỬA Ở ĐÂY: Tạo đối tượng filterParams trống trước
            const filterParams = {
                page: currentPage,
                pageSize: imagesPerPage,
                status: "approved" // Luôn gửi trạng thái
            };

            // ✅ Thêm các bộ lọc CHỈ KHI chúng có giá trị
            if (filters.search) {
                filterParams.search = filters.search;
            }
            // Chỉ thêm topicId nếu nó không phải "Tất cả"
            if (filters.topicId && filters.topicId !== "Tất cả") {
                // Đảm bảo API nhận đúng kiểu int?
                filterParams.topicId = parseInt(filters.topicId);
            }
            if (filters.tagName) {
                filterParams.tagName = filters.tagName; // Hoặc gửi tagId nếu API dùng int? tagId
            }
            if (filters.date) {
                filterParams.date = filters.date;
            }

            // Gọi API với filterParams đã được lọc sạch
            const pagedResult = await api.images.getAll(filterParams); //

            const images = pagedResult.items;
            imageListContainer.innerHTML = ''; // Xóa spinner/nội dung cũ

            if (!images || images.length === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
                const imageCardPromises = images.map(img => createImageRow(img));
                const imageCardElements = await Promise.all(imageCardPromises);
                imageCardElements.forEach(el => imageListContainer.appendChild(el));
                if (window.lucide) {
                    lucide.createIcons();
                }
            }

            // Cập nhật phân trang
            updatePagination(pagedResult);

        } catch (error) {
            console.error("Lỗi khi render ảnh:", error);
            if (error.message !== "Unauthorized") {
                imageListContainer.innerHTML = `<p class="text-red-500 text-center">Không thể tải dữ liệu ảnh. ${error.message}</p>`;
            }
        } finally {
            hideSpinner(); // Luôn tắt spinner
        }
    }

    // ======= HELPER FUNCTIONS =======

    // Fetches user name (with caching)
    async function getUserName(userId) {
        if (!userId) return "N/A";
        if (userCache[userId]) {
            return userCache[userId];
        }
        try {
            // Ensure api.users.getById exists in apiServices.js
            const user = await api.users.getById(userId);
            // Adjust 'user.userName' if your UserDTO has a different property name
            const userName = user.username || `User ${userId}`;
            userCache[userId] = userName;
            return userName;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            userCache[userId] = `User ${userId}`; // Cache fallback name
            return `User ${userId}`;
        }
    }

    // Creates the HTML structure for a single image row
    async function createImageRow(image) {
        const div = document.createElement('div');
        div.className = 'admin-card flex flex-col sm:flex-row items-center gap-4 p-4 border border-gray-200 rounded-lg shadow-sm'; // Added shadow

        const userName = await getUserName(image.userId); // Fetch user name

        // Use properties from ImageDTO
        div.innerHTML = `
            <img src="${image.thumbnailUrl || image.fileUrl || '/img/placeholder-image.png'}" alt="${image.title || 'Image'}" class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md flex-shrink-0 bg-gray-100" loading="lazy" />
            <div class="flex-1 text-sm text-center sm:text-left min-w-0"> <p class="font-semibold text-gray-800 truncate" title="${image.title || ''}">${image.title || '(No Title)'}</p>
                <p class="text-gray-500 mt-1">
                    By: <span class="font-medium text-blue-600">${userName}</span>
                </p>
                <p class="text-gray-500 mt-1">
                    Uploaded: <span class="font-medium">${new Date(image.createdAt).toLocaleDateString('en-GB')}</span> </p>
                </div>
            <div class="flex-shrink-0 flex gap-2 mt-3 sm:mt-0">
                <a href="/Image/EditImage/${image.id}" class="edit-btn p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition no-underline" title="Edit Image ${image.id}">
                    <i data-lucide="edit-3" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                </a>
                <button class="delete-btn p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" data-id="${image.id}" title="Delete Image ${image.id}">
                    <i data-lucide="trash-2" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                </button>
            </div>
        `;
        return div;
    }

    // Updates pagination button states and text
    function updatePagination(pagedResult) {
        if (!pagedResult) return;
        pageInfo.innerHTML = `Page <b>${pagedResult.page}</b> / ${pagedResult.totalPages || 1}`;
        prevPageBtn.disabled = (pagedResult.page <= 1);
        nextPageBtn.disabled = (pagedResult.page >= pagedResult.totalPages);
        currentPage = pagedResult.page; // Update current page state
    }

    // Loads topics for the filter dropdown
    async function loadFilterData() {
        try {
            const topics = await api.topics.getAll();
            topicFilterSelect.innerHTML = '<option value="Tất cả">All Topics</option>'; // Reset
            if (topics && topics.length > 0) {
                topics.forEach(topic => {
                    const option = document.createElement('option');
                    option.value = topic.id; // Use topic ID as value
                    option.textContent = topic.name;
                    topicFilterSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading topics:", error);
            // Optionally display an error message to the user
        }
    }

    // ======= EVENT HANDLERS =======
    function showFilterPopup() {
        // Pre-fill popup with current filter values
        topicFilterSelect.value = filters.topicId;
        tagFilterInput.value = filters.tagName;
        dateFilterInput.value = filters.date;
        filterPopup.classList.remove('hidden');
    }

    function hideFilterPopup() {
        filterPopup.classList.add('hidden');
    }

    // Applies filters from the popup and refreshes data
    function applyFilters() {
        filters = {
            topicId: topicFilterSelect.value, // Get selected Topic ID
            tagName: tagFilterInput.value.trim(), // Get tag name input
            date: dateFilterInput.value,
            search: searchInput.value.trim() // Keep existing search term
        };
        currentPage = 1; // Reset to page 1 when filters change
        fetchAndRenderData(); // Fetch data with new filters
        hideFilterPopup();
    }

    // Clears all filters and refreshes data
    function clearFilters() {
        filters = { topicId: "Tất cả", tagName: "", date: "", search: "" };
        // Reset form elements
        topicFilterSelect.value = "Tất cả";
        tagFilterInput.value = "";
        dateFilterInput.value = "";
        searchInput.value = ""; // Also clear search input

        currentPage = 1;
        fetchAndRenderData(); // Fetch data without filters
        hideFilterPopup();
    }

    // Debounce function for search input
    let searchTimer;
    function debounceSearch(e) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            filters.search = e.target.value.trim(); // Update search filter state
            currentPage = 1; // Reset page on new search
            fetchAndRenderData(); // Fetch data based on search
        }, 500); // Wait 500ms after user stops typing
    }

    // Handles delete button clicks
    async function handleDeleteClick(imageId) {
        if (!imageId) return;
        if (confirm(`Are you sure you want to delete image ID ${imageId}? This cannot be undone.`)) {
            try {
                showSpinner(); // Show spinner during deletion
                await api.images.delete(imageId);
                alert('Image deleted successfully!');
                // Reset to page 1 or stay on current page? Resetting is simpler.
                currentPage = 1;
                fetchAndRenderData(); // Refresh the list
            } catch (err) {
                hideSpinner(); // Hide spinner on error
                alert(`Failed to delete image: ${err.message}`);
            }
            // No finally needed here as fetchAndRenderData handles hiding spinner
        }
    }

    // ======= EVENT LISTENERS =======
    searchInput.addEventListener('input', debounceSearch);

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndRenderData(); // Fetch previous page
        }
    });

    nextPageBtn.addEventListener('click', () => {
        // Fetch next page (API handles the check for last page via pagedResult)
        currentPage++;
        fetchAndRenderData();
    });

    // Filter popup buttons
    filterButton.addEventListener('click', showFilterPopup);
    closeFilterPopupBtn.addEventListener('click', hideFilterPopup);
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Event delegation for delete buttons within the list container
    imageListContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation(); // Prevent triggering other clicks
            const imageId = deleteBtn.dataset.id;
            handleDeleteClick(imageId); // Call the async delete handler
        }
        // Edit button is an <a> tag, handled by its href
    });

    // Listen for image deletion events (e.g., from ImageDetail modal)
    document.addEventListener('imageDeleted', (event) => {
        console.log('Image deleted event received, refreshing list.');
        // Simple refresh - assumes deletion was successful
        fetchAndRenderData();
    });


    // ======= INITIALIZATION =======
    loadFilterData(); // Load topics into the dropdown first
    fetchAndRenderData(); // Then fetch the initial image data
});