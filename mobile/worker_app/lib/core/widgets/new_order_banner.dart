import 'package:flutter/material.dart';

class NewOrderBanner extends StatefulWidget {
  final bool show;
  final String customerName;
  final String serviceName;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const NewOrderBanner({
    super.key,
    required this.show,
    required this.customerName,
    required this.serviceName,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  State<NewOrderBanner> createState() => _NewOrderBannerState();
}

class _NewOrderBannerState extends State<NewOrderBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));

    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    if (widget.show) {
      _controller.forward();
      // Auto dismiss after 5 seconds
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted) {
          _controller.reverse().then((_) {
            widget.onDismiss();
          });
        }
      });
    }
  }

  @override
  void didUpdateWidget(NewOrderBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.show && !oldWidget.show) {
      _controller.forward();
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted) {
          _controller.reverse().then((_) {
            widget.onDismiss();
          });
        }
      });
    } else if (!widget.show) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.show) return const SizedBox.shrink();

    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _opacityAnimation,
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0ea5e9), Color(0xFF0284c7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Colors.white24,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.notifications_active,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Đơn hàng mới! 🔔',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.customerName} đặt "${widget.serviceName}"',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Row(
                    children: [
                      IconButton(
                        onPressed: widget.onTap,
                        icon: const Icon(
                          Icons.visibility,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          _controller.reverse().then((_) {
                            widget.onDismiss();
                          });
                        },
                        icon: const Icon(
                          Icons.close,
                          color: Colors.white70,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
