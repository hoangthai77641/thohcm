import 'package:flutter/material.dart';

class StarRatingWidget extends StatelessWidget {
  final double rating;
  final double size;
  final Color? color;
  final bool allowHalfRating;

  const StarRatingWidget({
    Key? key,
    required this.rating,
    this.size = 20.0,
    this.color,
    this.allowHalfRating = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return Icon(
          _getStarIcon(index),
          size: size,
          color: color ?? Colors.amber,
        );
      }),
    );
  }

  IconData _getStarIcon(int index) {
    double starValue = index + 1;

    if (rating >= starValue) {
      return Icons.star;
    } else if (allowHalfRating && rating >= starValue - 0.5) {
      return Icons.star_half;
    } else {
      return Icons.star_border;
    }
  }
}
