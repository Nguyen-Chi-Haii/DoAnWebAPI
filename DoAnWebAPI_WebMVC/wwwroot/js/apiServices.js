// File: wwwroot/js/apiService.js

// ⚠️ QUAN TRỌNG: Thay thế bằng URL của API của bạn
const API_BASE_URL = 'http://localhost:5186/api'; // Ví dụ cho môi trường dev

/**

 * Lấy JWT token từ biến global được truyền từ server.
 * @returns {string|null} Token hoặc null nếu không tồn tại.
 */
function getToken() {
    return window.jwtToken || null;
}

/**
 * Hàm gọi API chung, tự động thêm header Authorization.
 * @param {string} endpoint - Đường dẫn API (ví dụ: '/images').
 * @param {string} method - Phương thức HTTP (GET, POST, PUT, DELETE).
 * @param {object|FormData} [body=null] - Dữ liệu gửi đi (là object cho JSON, hoặc FormData cho file).
 * @returns {Promise<any>} - Dữ liệu trả về từ API.
 * @throws {Error} - Ném lỗi nếu request thất bại.
 */
async function request(endpoint, method, body = null) {
    const headers = new Headers();
    const token = getToken();

    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const config = {
        method: method,
        headers: headers,
    };

    // Chỉ thêm Content-Type nếu body là JSON object, không phải FormData
    if (body && !(body instanceof FormData)) {
        headers.append('Content-Type', 'application/json');
        config.body = JSON.stringify(body);
    } else if (body) {
        config.body = body; // Dành cho FormData
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            // Xử lý khi token hết hạn hoặc không hợp lệ
            // Xóa token cũ để tránh lặp lại lỗi
            localStorage.removeItem('jwtToken');

            if (response.status === 401) {
                throw new Error("Unauthorized"); // Ném ra lỗi có tên cụ thể
            }
            // Dừng thực thi hàm ngay lập tức để ngăn các lỗi tiếp theo
            return Promise.reject(new Error("Unauthorized"));
        }
        // Cố gắng parse lỗi từ body của response
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Lỗi API: ${response.status}`);
    }

    // Đối với các response không có content (204 No Content)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// Xây dựng một object tiện ích để quản lý các endpoint
const api = {
    images: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return request(`/images?${query}`, 'GET');
        },
        getById: (id) => request(`/images/${id}`, 'GET'),
        create: (formData) => request('/images', 'POST', formData),
        update: (id, data) => request(`/images/${id}`, 'PUT', data),
        delete: (id) => request(`/images/${id}`, 'DELETE'),
        getByUser: (userId) => request(`/users/${userId}/images`, 'GET'),
        download: async (id, filename = 'download') => {
            const headers = new Headers();
            const token = getToken();
            if (token) {
                headers.append('Authorization', `Bearer ${token}`);
            }

            // Gọi fetch trực tiếp đến endpoint download
            const response = await fetch(`${API_BASE_URL}/images/${id}/download`, { headers });

            if (!response.ok) {
                // Cố gắng đọc lỗi nếu có
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Tải xuống thất bại: ${response.status}`);
            }

            // Chuyển response thành một Blob (Binary Large Object)
            const blob = await response.blob();

            // Tạo một URL tạm thời cho blob trong bộ nhớ trình duyệt
            const url = window.URL.createObjectURL(blob);

            // Tạo một thẻ <a> ẩn để kích hoạt việc tải xuống
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Gợi ý tên file cho trình duyệt
            const extension = blob.type.split('/')[1] || 'jpg';
            a.download = `${filename}.${extension}`;

            // Thêm thẻ <a> vào trang, click vào nó, rồi xóa đi
            document.body.appendChild(a);
            a.click();

            // Dọn dẹp URL tạm thời để giải phóng bộ nhớ
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    },
    likes: {
        // Lưu ý: Body trống là cần thiết cho hàm POST/DELETE nếu API yêu cầu
        add: (imageId) => request(`/images/${imageId}/like`, 'POST', {}),
        remove: (imageId) => request(`/images/${imageId}/like`, 'DELETE'),
        checkStatus: (imageId) => request(`/images/${imageId}/like/status`, 'GET'),
    },
    stats: {
        get: (imageId) => request(`/images/${imageId}/stats`, 'GET'),
        incrementView: (imageId) => request(`/images/${imageId}/stats/increment-view`, 'POST', {}),
        incrementDownloadsAsync: (imageId) => request(`/images/${imageId}/stats/download`, 'POST', {})
    },
    tags: {
        getAll: () => request('/tags', 'GET'),
    },
    topics: {
        getAll: () => request('/topics', 'GET'),
    },
    users: {
        getById: (id) => request(`/Users/${id}`, 'GET'),
    }
};