import 'package:flutter/material.dart';

class StarRating extends StatelessWidget {
  final double rating;
  final int starCount;
  final double size;
  final Color? color;
  final Color? unratedColor;
  final bool allowHalfRating;
  final Function(double rating)? onRatingChanged;

  const StarRating({
    Key? key,
    this.rating = 0.0,
    this.starCount = 5,
    this.size = 20.0,
    this.color,
    this.unratedColor,
    this.allowHalfRating = false,
    this.onRatingChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final defaultColor = color ?? Colors.amber;
    final defaultUnratedColor = unratedColor ?? Colors.grey[300]!;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(starCount, (index) {
        final starRating = index + 1.0;
        final isFilled = rating >= starRating;
        final isHalfFilled =
            allowHalfRating &&
            rating >= starRating - 0.5 &&
            rating < starRating;

        return GestureDetector(
          onTap: onRatingChanged != null
              ? () => onRatingChanged!(starRating)
              : null,
          child: Icon(
            isHalfFilled
                ? Icons.star_half
                : (isFilled ? Icons.star : Icons.star_border),
            size: size,
            color: (isFilled || isHalfFilled)
                ? defaultColor
                : defaultUnratedColor,
          ),
        );
      }),
    );
  }
}

class InteractiveStarRating extends StatefulWidget {
  final double initialRating;
  final int starCount;
  final double size;
  final Color? color;
  final Color? unratedColor;
  final Function(double rating)? onRatingChanged;

  const InteractiveStarRating({
    Key? key,
    this.initialRating = 0.0,
    this.starCount = 5,
    this.size = 30.0,
    this.color,
    this.unratedColor,
    this.onRatingChanged,
  }) : super(key: key);

  @override
  State<InteractiveStarRating> createState() => _InteractiveStarRatingState();
}

class _InteractiveStarRatingState extends State<InteractiveStarRating> {
  late double _currentRating;

  @override
  void initState() {
    super.initState();
    _currentRating = widget.initialRating;
  }

  @override
  Widget build(BuildContext context) {
    final defaultColor = widget.color ?? Colors.amber;
    final defaultUnratedColor = widget.unratedColor ?? Colors.grey[300]!;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(widget.starCount, (index) {
        final starRating = index + 1.0;
        final isFilled = _currentRating >= starRating;

        return GestureDetector(
          onTap: () {
            setState(() {
              _currentRating = starRating;
            });
            widget.onRatingChanged?.call(starRating);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2.0),
            child: Icon(
              isFilled ? Icons.star : Icons.star_border,
              size: widget.size,
              color: isFilled ? defaultColor : defaultUnratedColor,
            ),
          ),
        );
      }),
    );
  }
}
