import 'package:flutter/material.dart';

class NotificationIndicator extends StatefulWidget {
  final bool hasNewOrders;
  final VoidCallback? onTap;
  final Widget child;

  const NotificationIndicator({
    super.key,
    required this.hasNewOrders,
    this.onTap,
    required this.child,
  });

  @override
  State<NotificationIndicator> createState() => _NotificationIndicatorState();
}

class _NotificationIndicatorState extends State<NotificationIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    _colorAnimation =
        ColorTween(begin: Colors.red, end: Colors.red.withOpacity(0.7)).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.easeInOut,
          ),
        );

    if (widget.hasNewOrders) {
      _startAnimation();
    }
  }

  @override
  void didUpdateWidget(NotificationIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.hasNewOrders && !oldWidget.hasNewOrders) {
      _startAnimation();
    } else if (!widget.hasNewOrders) {
      _animationController.stop();
      _animationController.reset();
    }
  }

  void _startAnimation() {
    _animationController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Stack(
        children: [
          widget.child,
          if (widget.hasNewOrders)
            Positioned(
              right: 0,
              top: 0,
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: _colorAnimation.value,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.5),
                            blurRadius: 4,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
