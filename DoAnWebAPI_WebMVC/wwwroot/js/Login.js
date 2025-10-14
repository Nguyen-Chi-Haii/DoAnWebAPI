document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử từ HTML
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');

    // Bắt sự kiện submit của form
    loginForm.addEventListener('submit', (event) => {
        // Ngăn form gửi đi và tải lại trang
        event.preventDefault();

        // Lấy giá trị từ các ô input
        const email = emailInput.value;
        const password = passwordInput.value;

        // Kiểm tra đơn giản
        if (!email || !password) {
            alert('Vui lòng nhập cả email và mật khẩu.');
            return;
        }

        // Hiển thị dữ liệu đã lấy (để mô phỏng)
        // Trong một ứng dụng thật, bạn sẽ gửi dữ liệu này đến server
        console.log('Dữ liệu form:');
        console.log('Email:', email);
        console.log('Password:', password);

        alert(`Đăng nhập với:\nEmail: ${email}\nMật khẩu: ${password}`);

        // Xóa giá trị trong form sau khi submit (tùy chọn)
        // emailInput.value = '';
        // passwordInput.value = '';
    });
});