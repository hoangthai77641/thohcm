import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../bookings/bookings_screen.dart';
import '../profile/profile_screen.dart';
import '../receive_orders/receive_orders_screen.dart';
import '../wallet/wallet_screen.dart';
import '../notifications/notifications_screen.dart';

import '../receive_orders/pending_orders_provider.dart';
import '../receive_orders/active_orders_provider.dart';
import '../notifications/notifications_provider.dart';
import 'worker_stats_provider.dart';
import 'service_rating_provider.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final pages = <Widget>[
      const ReceiveOrdersScreen(),
      const BookingsScreen(),
      const NotificationsScreen(),
      const WalletScreen(),
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => WorkerStatsProvider()..load()),
          ChangeNotifierProvider(
            create: (_) => ServiceRatingProvider()..loadServices(),
          ),
        ],
        child: const ProfileScreen(),
      ),
    ];
    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          height: 68,
          backgroundColor: colorScheme.surface,
          indicatorColor: colorScheme.primaryContainer.withOpacity(0.85),
          indicatorShape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          labelTextStyle: MaterialStateProperty.resolveWith(
            (states) => TextStyle(
              fontSize: 12,
              fontWeight: states.contains(MaterialState.selected)
                  ? FontWeight.w700
                  : FontWeight.w500,
              color: states.contains(MaterialState.selected)
                  ? colorScheme.onPrimaryContainer
                  : colorScheme.onSurfaceVariant,
            ),
          ),
          iconTheme: MaterialStateProperty.resolveWith(
            (states) => IconThemeData(
              size: 24,
              color: states.contains(MaterialState.selected)
                  ? colorScheme.onPrimaryContainer
                  : colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        child: NavigationBar(
          elevation: 6,
          selectedIndex: _index,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          animationDuration: const Duration(milliseconds: 300),
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: [
            NavigationDestination(
              icon: Consumer<PendingOrdersProvider>(
                builder: (context, pendingProv, child) {
                  final count = pendingProv.count;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text(count.toString()),
                    child: const Icon(Icons.assignment_outlined),
                  );
                },
              ),
              selectedIcon: Consumer<PendingOrdersProvider>(
                builder: (context, pendingProv, child) {
                  final count = pendingProv.count;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text(count.toString()),
                    child: const Icon(Icons.assignment),
                  );
                },
              ),
              label: 'Nhận đơn',
            ),
            NavigationDestination(
              icon: Consumer<ActiveOrdersProvider>(
                builder: (context, activeProv, child) {
                  final count = activeProv.count;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text(count.toString()),
                    child: const Icon(Icons.event_note_outlined),
                  );
                },
              ),
              selectedIcon: Consumer<ActiveOrdersProvider>(
                builder: (context, activeProv, child) {
                  final count = activeProv.count;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text(count.toString()),
                    child: const Icon(Icons.event_note),
                  );
                },
              ),
              label: 'Đơn hàng',
            ),
            NavigationDestination(
              icon: Consumer<NotificationsProvider>(
                builder: (context, notificationsProv, child) {
                  final count = notificationsProv.unreadCount;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text(count.toString()),
                    child: const Icon(Icons.notifications_outlined),
                  );
                },
              ),
              selectedIcon: Consumer<NotificationsProvider>(
                builder: (context, notificationsProv, child) {
                  final count = notificationsProv.unreadCount;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text(count.toString()),
                    child: const Icon(Icons.notifications),
                  );
                },
              ),
              label: 'Thông báo',
            ),
            NavigationDestination(
              icon: const Icon(Icons.account_balance_wallet_outlined),
              selectedIcon: const Icon(Icons.account_balance_wallet),
              label: 'Ví',
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person),
              label: 'Hồ sơ',
            ),
          ],
        ),
      ),
    );
  }
}
