import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'auth_provider.dart';
import 'register_screen.dart';
import '../home/home_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Đăng nhập')),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                16,
                16,
                16,
                bottomInset > 0 ? bottomInset + 16 : 32,
              ),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Logo
                      Container(
                        margin: const EdgeInsets.only(bottom: 32),
                        alignment: Alignment.center,
                        child: Image.asset(
                          'assets/images/logo.png',
                          height: 220,
                          width: 180,
                          fit: BoxFit.contain,
                        ),
                      ),
                      TextFormField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Số điện thoại',
                        ),
                        validator: (v) => (v == null || v.isEmpty)
                            ? 'Trường này là bắt buộc'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Mật khẩu',
                        ),
                        validator: (v) => (v == null || v.isEmpty)
                            ? 'Trường này là bắt buộc'
                            : null,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: auth.loading
                            ? null
                            : () async {
                                if (!_formKey.currentState!.validate()) return;
                                final ok = await auth.login(
                                  _phoneCtrl.text.trim(),
                                  _passCtrl.text,
                                );
                                if (ok && mounted) {
                                  Navigator.of(context).pushReplacement(
                                    MaterialPageRoute(
                                      builder: (_) => const HomeShell(),
                                    ),
                                  );
                                } else if (mounted) {
                                  if (auth.errorCode == 'WORKER_PENDING') {
                                    final instructions =
                                        auth.errorDetails?['instructions']
                                            as String? ??
                                        auth.error ??
                                        '';
                                    await showDialog<void>(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: const Text(
                                          'Chào mừng đối tác mới',
                                        ),
                                        content: SingleChildScrollView(
                                          child: Text(instructions),
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(),
                                            child: const Text('Đã hiểu'),
                                          ),
                                        ],
                                      ),
                                    );
                                  } else if (auth.error != null) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(auth.error!)),
                                    );
                                  }
                                }
                              },
                        child: auth.loading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Đăng nhập'),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: auth.loading
                            ? null
                            : () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const RegisterScreen(),
                                  ),
                                );
                              },
                        child: const Text('Chưa có tài khoản? Đăng ký'),
                      ),
                      const SizedBox(height: 32),
                      const Align(
                        alignment: Alignment.center,
                        child: Text(
                          'Beta 1.0',
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
