import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class StatsChartWidget extends StatelessWidget {
  final Map<String, int> data;
  final String title;
  final List<Color> colors;

  const StatsChartWidget({
    super.key,
    required this.data,
    required this.title,
    this.colors = const [Colors.blue, Colors.green, Colors.orange, Colors.red],
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final entries = data.entries.toList();

    if (entries.isEmpty || entries.every((e) => e.value == 0)) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(title, style: theme.textTheme.titleMedium),
              const SizedBox(height: 16),
              const Text('Chưa có dữ liệu'),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: PieChart(
                      PieChartData(
                        sections: entries.asMap().entries.map((entry) {
                          final index = entry.key;
                          final data = entry.value;
                          final color = colors[index % colors.length];
                          return PieChartSectionData(
                            value: data.value.toDouble(),
                            title: data.value.toString(),
                            color: color,
                            radius: 50,
                            titleStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          );
                        }).toList(),
                        sectionsSpace: 2,
                        centerSpaceRadius: 40,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: entries.asMap().entries.map((entry) {
                        final index = entry.key;
                        final data = entry.value;
                        final color = colors[index % colors.length];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Container(
                                width: 16,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: color,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _getStatusLabel(data.key),
                                  style: theme.textTheme.bodySmall,
                                ),
                              ),
                              Text(
                                data.value.toString(),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'done':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'total':
        return 'Tổng';
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      default:
        return status;
    }
  }
}

class IncomeChartWidget extends StatelessWidget {
  final int incomeToday;
  final int incomeMonth;
  final int incomeTotal;

  const IncomeChartWidget({
    super.key,
    required this.incomeToday,
    required this.incomeMonth,
    required this.incomeTotal,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final data = [
      ('Hôm nay', incomeToday),
      ('Tháng này', incomeMonth),
      ('Tổng cộng', incomeTotal),
    ];

    final maxValue = data.map((e) => e.$2).reduce((a, b) => a > b ? a : b);

    // Handle case when all values are zero
    if (maxValue == 0) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Thu nhập', style: theme.textTheme.titleMedium),
              const SizedBox(height: 16),
              SizedBox(
                height: 200,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.bar_chart, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'Chưa có dữ liệu thu nhập',
                        style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Dữ liệu sẽ hiển thị khi có giao dịch',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Thu nhập', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  barGroups: data.asMap().entries.map((entry) {
                    final index = entry.key;
                    final value = entry.value.$2.toDouble();
                    return BarChartGroupData(
                      x: index,
                      barRods: [
                        BarChartRodData(
                          toY: value,
                          color: Colors.blue,
                          width: 40,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            _formatCurrency(value.toInt()),
                            style: theme.textTheme.bodySmall,
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          final index = value.toInt();
                          if (index >= 0 && index < data.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                data[index].$1,
                                style: theme.textTheme.bodySmall,
                              ),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: maxValue > 0 ? maxValue / 4 : 1,
                  ),
                  maxY: maxValue > 0 ? maxValue * 1.2 : 100,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(int amount) {
    if (amount == 0) {
      return '0';
    } else if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K';
    }
    return amount.toString();
  }
}
