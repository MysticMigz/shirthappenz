# Category Visibility Management

This feature allows administrators to control which product categories are displayed on the store frontend, with granular control over gender-specific visibility, custom display names, and sort order.

## Features

- **Toggle Category Visibility**: Show/hide entire categories from the store
- **Gender-Specific Control**: Control visibility for men, women, unisex, and kids separately
- **Custom Display Names**: Override default category names with custom labels
- **Sort Order Management**: Control the order in which categories appear
- **Real-time Updates**: Changes take effect immediately on the store frontend
- **Fallback Support**: Store continues to function with default categories if API fails

## Admin Panel

### Access
Navigate to **Admin Dashboard → Category Visibility** in the admin sidebar.

### Management Interface
- **Visibility Toggle**: Click the eye icon to show/hide categories
- **Gender Visibility**: Use checkboxes to control visibility for each gender
- **Display Name**: Edit custom names for categories
- **Description**: Add or modify category descriptions
- **Sort Order**: Set numerical order (lower numbers appear first)
- **Store Preview**: See how categories will appear on the frontend
- **Bulk Actions**: Save all changes at once

## API Endpoints

### Admin API (`/api/admin/category-visibility`)
- `GET`: Fetch all category visibility settings
- `POST`: Create or update a single setting
- `PATCH`: Bulk update multiple settings

### Public API (`/api/category-visibility`)
- `GET`: Fetch visible categories for a specific gender
- Query parameter: `gender` (men, women, unisex, kids, or all)

## Database Schema

```typescript
interface CategoryVisibility {
  category: string;           // Unique category identifier
  isVisible: boolean;         // Overall visibility toggle
  displayName: string;        // Custom display name
  description: string;        // Category description
  sortOrder: number;          // Display order (ascending)
  genderVisibility: {         // Gender-specific visibility
    men: boolean;
    women: boolean;
    unisex: boolean;
    kids: boolean;
  };
  updatedBy: string;          // Admin who made the change
  updatedAt: Date;            // Last update timestamp
}
```

## Supported Categories

- `tshirts` - T-Shirts
- `jerseys` - Jerseys
- `tanktops` - Tank Tops
- `longsleeve` - Long Sleeve Shirts
- `hoodies` - Hoodies
- `sweatshirts` - Sweatshirts
- `sweatpants` - Sweatpants
- `accessories` - Accessories
- `shortsleeve` - Short Sleeve Shirts

## Initialization

Run the initialization script to set up default category visibility settings:

```bash
node scripts/init-category-visibility.js
```

This script will:
- Connect to your MongoDB database
- Create default visibility settings for all categories
- Set appropriate gender visibility (e.g., tank tops not available for kids)
- Establish a logical sort order
- Skip initialization if settings already exist

## Frontend Integration

The store frontend automatically:
- Fetches category visibility settings when gender changes
- Filters categories based on visibility settings
- Uses custom display names when available
- Respects sort order from admin settings
- Shows loading states while fetching settings
- Falls back to default categories if API fails

## Error Handling

- **API Failures**: Store gracefully falls back to default categories
- **Missing Categories**: Categories not in visibility settings are hidden
- **Loading States**: Users see skeleton loaders while settings load
- **Fallback Mode**: Store remains functional even if visibility API is down

## Security

- Admin endpoints require authentication and admin privileges
- Public endpoints are read-only and rate-limited
- All changes are logged with admin user information
- No sensitive data exposed in public API responses

## Performance

- Category visibility is cached at the component level
- API calls are made only when gender changes
- Minimal impact on page load performance
- Efficient filtering using database indexes

## Troubleshooting

### Categories Not Showing
1. Check if category is marked as visible in admin panel
2. Verify gender visibility settings
3. Ensure category exists in the database
4. Check browser console for API errors

### Changes Not Taking Effect
1. Verify changes were saved in admin panel
2. Check if "Save All Changes" was clicked
3. Refresh the store page
4. Verify API endpoint is responding correctly

### API Errors
1. Check MongoDB connection
2. Verify admin authentication
3. Check server logs for detailed errors
4. Ensure database schema is correct

## Future Enhancements

- **Category Images**: Custom icons for each category
- **Scheduled Visibility**: Show/hide categories at specific times
- **A/B Testing**: Test different category configurations
- **Analytics**: Track category performance and visibility
- **Bulk Import/Export**: CSV-based category management
