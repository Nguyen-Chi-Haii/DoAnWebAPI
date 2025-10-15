import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Tương đương với `useState` để quản lý trạng thái của các ô input
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Giải phóng tài nguyên khi widget không còn được sử dụng để tránh rò rỉ bộ nhớ
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      // SingleChildScrollView giúp màn hình có thể cuộn khi bàn phím hiện lên
      body: SingleChildScrollView(
        // Căn giữa toàn bộ nội dung
        child: Container(
          // Dùng Container để giới hạn chiều cao tối thiểu bằng chiều cao màn hình
          constraints: BoxConstraints(
            minHeight: MediaQuery.of(context).size.height,
          ),
          padding: const EdgeInsets.all(24.0), // p-6
          // Căn giữa nội dung trong Container
          alignment: Alignment.center,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 320), // max-w-xs
            // Column tương đương với `flex flex-col`
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center, // justify-center
              crossAxisAlignment: CrossAxisAlignment.stretch, // Làm các con bên trong giãn hết chiều ngang
              children: [
                // --- Tiêu đề ---
                const Text(
                  "Đăng nhập tài khoản",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24, // text-2xl
                    fontWeight: FontWeight.w600, // font-semibold
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4), // mb-1
                Text(
                  "Chào mừng bạn quay lại!",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14, // text-sm
                    color: Colors.grey.shade600, // text-gray-500
                  ),
                ),
                const SizedBox(height: 24), // mb-6

                // --- Form đăng nhập ---
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: "Email",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8), // rounded-lg
                      borderSide: BorderSide(color: Colors.grey.shade300), // border-gray-300
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 12), // gap-3

                TextFormField(
                  controller: _passwordController,
                  obscureText: true, // Ẩn mật khẩu
                  decoration: InputDecoration(
                    hintText: "Mật khẩu",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 8),

                // --- Quên mật khẩu ---
                Align(
                  alignment: Alignment.centerRight, // text-right
                  child: TextButton(
                    onPressed: () {
                      // Logic khi nhấn "Quên mật khẩu?"
                    },
                    child: Text(
                      "Quên mật khẩu?",
                      style: TextStyle(
                        color: Colors.grey.shade600, // text-gray-500
                        fontSize: 14, // text-sm
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // --- Nút đăng nhập ---
                ElevatedButton(
                  onPressed: () {
                    final email = _emailController.text;
                    final password = _passwordController.text;
                    // Logic đăng nhập sẽ gọi đến AuthRepository ở đây
                    print('Login with Email: $email, Password: $password');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB), // bg-blue-600
                    foregroundColor: Colors.white, // text-white
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8), // rounded-lg
                    ),
                  ),
                  child: const Text(
                    "Đăng nhập",
                    style: TextStyle(
                      fontWeight: FontWeight.w500, // font-medium
                    ),
                  ),
                ),
                const SizedBox(height: 24), // mt-6

                // --- Đăng ký ---
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: TextStyle(
                      color: Colors.grey.shade800, // text-gray-600
                      fontSize: 14, // text-sm
                    ),
                    children: [
                      const TextSpan(text: "Bạn chưa có tài khoản? "),
                      TextSpan(
                        text: "Đăng ký tài khoản mới",
                        style: const TextStyle(
                          color: Color(0xFF2563EB), // text-blue-600
                          fontWeight: FontWeight.w500, // font-medium
                        ),
                        // Thêm recognizer để có thể nhấn vào và điều hướng
                       recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          // Logic chuyển sang trang đăng ký
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const RegisterScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}