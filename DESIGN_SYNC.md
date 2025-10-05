# Design System Synchronization

This document outlines the synchronized design system between the web customer interface and the mobile worker app.

## Color System

### Primary Colors
- **Light Theme Primary**: `#0EA5E9` (sky-500)
- **Light Theme Primary-600**: `#0284C7`
- **Dark Theme Primary**: `#38BDF8` (lighter blue for better contrast)
- **Dark Theme Primary-600**: `#0EA5E9`

### Text Colors
- **Light Theme Text**: `#0F172A` (slate-900)
- **Dark Theme Text**: `#F1F5F9`
- **Light Theme Muted**: `#64748B` (slate-500)
- **Dark Theme Muted**: `#94A3B8`

### Background Colors
- **Light Theme Background**: `#F5F7FB`
- **Dark Theme Background**: `#0F172A`
- **Light Theme Card**: `#FFFFFF`
- **Dark Theme Card**: `#1E293B`

### Border Colors
- **Light Theme Border**: `#E5E7EB`
- **Dark Theme Border**: `#334155`

### Status Colors
- **Pending**: `#FBBF24` (Yellow) - "Chờ xác nhận"
- **Confirmed**: `#3B82F6` (Blue) - "Đã xác nhận"
- **Done**: `#10B981` (Green) - "Hoàn thành"
- **Cancelled**: `#EF4444` (Red) - "Đã hủy"

## Typography

### Font Sizes
- **Small**: 12px
- **Medium**: 14px
- **Large**: 16px
- **X-Large**: 20px
- **XX-Large**: 24px

## Spacing

### Standard Spacing Units
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **X-Large**: 32px

## Border Radius

### Standard Radius
- **Default**: 12px

## Components

### Status Badge
- Consistent color coding across web and mobile
- Vietnamese status labels
- White text on colored background
- 4px border radius
- 8px horizontal, 4px vertical padding

### Booking Card
- Card-based layout with consistent spacing
- Status badge in top-right corner
- Icon-based information rows
- Clickable phone numbers and addresses
- Price formatting with Vietnamese locale

### Form Elements
- Consistent input styling
- 12px border radius
- Primary color focus states
- Proper spacing and typography

## Localization

### Vietnamese Labels
All interface elements use consistent Vietnamese terminology:
- "Điện lạnh Quy" - Brand name
- "Trang chủ" - Home
- "Đơn hàng" - Orders/Bookings
- "Dịch vụ" - Services
- "Hồ sơ" - Profile
- "Khách hàng" - Customer
- "Thợ" - Worker
- "Địa chỉ" - Address
- "Số điện thoại" - Phone number

### Status Translations
- `pending` → "Chờ xác nhận"
- `confirmed` → "Đã xác nhận"
- `done` → "Hoàn thành"
- `cancelled` → "Đã hủy"

## Implementation Files

### Web (CSS Variables)
- `web/src/styles.css` - Contains all design tokens as CSS custom properties

### Mobile (Flutter Theme)
- `mobile/worker_app/lib/core/app_theme.dart` - Main theme definitions
- `mobile/worker_app/lib/core/constants.dart` - Shared constants and labels
- `mobile/worker_app/lib/core/widgets.dart` - Reusable UI components

### Synchronization Points

1. **Colors**: Direct mapping between CSS variables and Flutter Color constants
2. **Typography**: Consistent font sizes and weights
3. **Spacing**: Identical spacing units
4. **Components**: Similar visual structure and behavior
5. **Status System**: Identical color coding and Vietnamese labels
6. **Localization**: Consistent terminology across platforms

## Usage Guidelines

### For Developers

1. **Use Theme Variables**: Always reference theme constants instead of hardcoded values
2. **Status Handling**: Use `AppTheme.getStatusColor()` and `AppTheme.getStatusText()` for consistent status display
3. **Components**: Use provided components (`BookingCard`, `StatusBadge`) for consistent UI
4. **Spacing**: Use `AppConstants` spacing values for consistent layouts

### For Designers

1. **Color Consistency**: Any color changes should be reflected in both CSS variables and Flutter theme
2. **Component Updates**: Changes to component design should be implemented in both platforms
3. **Accessibility**: Ensure color combinations meet accessibility standards in both light and dark themes

## Benefits

1. **Brand Consistency**: Unified visual identity across web and mobile
2. **User Experience**: Familiar interface patterns for users switching between platforms
3. **Maintainability**: Centralized design tokens make updates easier
4. **Accessibility**: Consistent contrast ratios and readable typography
5. **Localization**: Unified Vietnamese terminology across platforms