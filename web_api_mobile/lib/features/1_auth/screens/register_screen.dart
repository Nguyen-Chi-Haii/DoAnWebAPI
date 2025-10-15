import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'login_screen.dart'; 

// Giả sử bạn có file login_screen ở đây để điều hướng
// import 'login_screen.dart'; 

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Quản lý trạng thái cho 4 ô input
  final _fullnameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _fullnameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Container(
          constraints: BoxConstraints(
            minHeight: MediaQuery.of(context).size.height,
          ),
          padding: const EdgeInsets.all(24.0),
          alignment: Alignment.center,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 320), // max-w-xs
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // --- Tiêu đề ---
                const Text(
                  "Tạo tài khoản mới",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24, // text-2xl
                    fontWeight: FontWeight.w600, // font-semibold
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4), // mb-1
                Text(
                  "Hãy điền thông tin để bắt đầu hành trình của bạn!",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14, // text-sm
                    color: Colors.grey.shade600, // text-gray-500
                  ),
                ),
                const SizedBox(height: 24), // mb-6

                // --- Form đăng ký ---
                _buildTextField(controller: _fullnameController, hintText: "Họ và tên"),
                const SizedBox(height: 12),
                _buildTextField(controller: _emailController, hintText: "Email", keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                _buildTextField(controller: _passwordController, hintText: "Mật khẩu", obscureText: true),
                const SizedBox(height: 12),
                _buildTextField(controller: _confirmPasswordController, hintText: "Xác nhận mật khẩu", obscureText: true),
                const SizedBox(height: 24),

                // --- Nút đăng ký ---
                ElevatedButton(
                  onPressed: () {
                    // Logic đăng ký sẽ gọi đến AuthRepository ở đây
                    final fullname = _fullnameController.text;
                    final email = _emailController.text;
                    final password = _passwordController.text;
                    print('Registering with Fullname: $fullname, Email: $email, Password: $password');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A), // bg-green-600
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    "Đăng ký",
                    style: TextStyle(
                      fontWeight: FontWeight.w500, // font-medium
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // --- Đăng nhập ---
                Center(
                  child: TextButton(
                    onPressed: () {
                       // Logic điều hướng về trang đăng nhập
                       if (Navigator.canPop(context)) {
                         Navigator.pop(context);
                       } else {
                         Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen()));
                       }
                    },
                    child: const Text(
                      "Đã có tài khoản? Đăng nhập",
                      style: TextStyle(
                        color: Color(0xFF2563EB), // text-blue-600
                        fontWeight: FontWeight.w500, // font-medium
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Hàm helper để tránh lặp code cho TextFormField
  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hintText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }
}