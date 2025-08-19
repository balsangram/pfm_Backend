# Manager Backend API Documentation

This document provides comprehensive information about the Manager Backend API for Priya Fresh Meats.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Validation Schemas](#validation-schemas)
- [Error Handling](#error-handling)
- [Database Models](#database-models)
- [Usage Examples](#usage-examples)

## Overview

The Manager Backend provides a complete set of APIs for store managers to:
- Manage their profile and store information
- Handle orders and update their status
- Manage delivery partners
- View live orders on TV screens
- Access dashboard statistics

## Authentication

All protected routes require JWT authentication with manager role verification.

### Public Routes (No Auth Required)
- `POST /manager/send-otp` - Send OTP for login
- `POST /manager/verify-login` - Verify OTP and get JWT token

### Protected Routes (Auth Required)
All other routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## API Endpoints

### 1. Manager Profile Management

#### Get Manager Profile
```
GET /manager/profile
```
**Response:** Manager profile with store details

#### Update Manager Profile
```
PUT /manager/profile
```
**Body:** Profile update data (firstName, lastName, location, etc.)
**Validation:** Uses `updateProfileSchema`

#### Change Password
```
PUT /manager/change-password
```
**Body:** currentPassword, newPassword, confirmPassword
**Validation:** Uses `changePasswordSchema`

### 2. Dashboard

#### Get Dashboard Statistics
```
GET /manager/dashboard/stats
```
**Response:** Order counts, delivery partner stats, recent orders

### 3. Live Orders (TV Screen)

#### Get All Live Orders
```
GET /manager/live-orders
```
**Query Parameters:** status (optional)
**Response:** Live orders grouped by status with summary

#### Get Orders by Status
```
GET /manager/live-orders/status/:status
```
**Path Parameters:** status (pending, confirmed, preparing, ready, picked_up, in_transit)
**Response:** Orders filtered by specific status

#### Get Urgent Orders
```
GET /manager/live-orders/urgent
```
**Response:** All urgent orders that need immediate attention

#### Get Order Counts
```
GET /manager/live-orders/counts
```
**Response:** Count of orders by each status

### 4. Order Management

#### Get Orders
```
GET /manager/orders
```
**Query Parameters:**
- status: Filter by order status
- dateFrom: Start date (ISO format)
- dateTo: End date (ISO format)
- search: Search in client name, location, order ID
- page: Page number (default: 1)
- limit: Items per page (default: 10, max: 100)

**Validation:** Uses `orderFilterSchema`

#### Get Order by ID
```
GET /manager/orders/:id
```
**Path Parameters:** id (MongoDB ObjectId)
**Validation:** Uses `idParamSchema`

#### Update Order Status
```
PUT /manager/orders/:id/status
```
**Path Parameters:** id (MongoDB ObjectId)
**Body:** status, pickedUpBy (optional), notes (optional)
**Validation:** Uses `updateOrderStatusSchema`

### 5. Delivery Partner Management

#### Get Delivery Partners
```
GET /manager/delivery-partners
```
**Query Parameters:**
- status: Filter by status (verified, pending)
- search: Search in name or phone
- page: Page number (default: 1)
- limit: Items per page (default: 10, max: 100)

#### Create Delivery Partner
```
POST /manager/delivery-partners
```
**Body:** name, phoneNumber, status (optional, default: pending)
**Validation:** Uses `createDeliveryPartnerSchema`

#### Update Delivery Partner
```
PUT /manager/delivery-partners/:id
```
**Path Parameters:** id (MongoDB ObjectId)
**Body:** name, phoneNumber, status (all optional)
**Validation:** Uses `updateDeliveryPartnerSchema`

#### Delete Delivery Partner
```
DELETE /manager/delivery-partners/:id
```
**Path Parameters:** id (MongoDB ObjectId)
**Note:** Soft delete - sets isActive to false

### 6. Store Management

#### Get Store Details
```
GET /manager/store
```
**Response:** Store information (name, location, phone)

#### Update Store Details
```
PUT /manager/store
```
**Body:** name, location, phone (all optional)
**Validation:** Uses `updateStoreSchema`

## Validation Schemas

All input data is validated using Joi schemas:

### Profile Validation
- **updateProfileSchema:** Validates profile update data
- **changePasswordSchema:** Validates password change data

### Delivery Partner Validation
- **createDeliveryPartnerSchema:** Validates new delivery partner data
- **updateDeliveryPartnerSchema:** Validates delivery partner updates

### Order Validation
- **updateOrderStatusSchema:** Validates order status updates
- **orderFilterSchema:** Validates order filter parameters

### Store Validation
- **updateStoreSchema:** Validates store update data

### Generic Validation
- **idParamSchema:** Validates MongoDB ObjectId parameters

## Error Handling

The API uses standardized error responses:

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "data": null
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate data)
- `500` - Internal Server Error

## Database Models

### Manager Model
- Personal information (firstName, lastName, email, phone)
- Location details (location, userLocation)
- Store information (storeName, storeLocation, store reference)
- Timestamps and activity tracking

### Order Model
- Order details (orderId, clientName, location, phone)
- Order items with quantity and price
- Status tracking with timestamps
- Delivery information (pickedUpBy, deliveryPartner)
- Store and manager references

### Delivery Partner Model
- Basic information (name, phone)
- Status tracking (verified, pending)
- Performance metrics (totalDeliveries, rating)
- Activity tracking

### Store Model
- Store information (name, location, phone)
- Timestamps for tracking changes

## Usage Examples

### Frontend Integration

#### 1. Get Live Orders for TV Screen
```javascript
const response = await fetch('/api/manager/live-orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

#### 2. Update Order Status
```javascript
const response = await fetch(`/api/manager/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'ready',
    notes: 'Order is ready for pickup'
  })
});
```

#### 3. Create Delivery Partner
```javascript
const response = await fetch('/api/manager/delivery-partners', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    phoneNumber: '+91 9876543210',
    status: 'pending'
  })
});
```

### Real-time Updates

For live order updates, consider implementing:
1. **Polling:** Regular API calls every 30-60 seconds
2. **WebSocket:** Real-time updates for instant notifications
3. **Server-Sent Events:** One-way real-time communication

## Security Features

1. **JWT Authentication:** Secure token-based authentication
2. **Role Verification:** Ensures only managers can access endpoints
3. **Input Validation:** Comprehensive validation using Joi schemas
4. **Data Sanitization:** Automatic trimming and validation of input data
5. **Soft Deletes:** Prevents data loss while maintaining referential integrity

## Performance Considerations

1. **Database Indexing:** Optimized indexes on frequently queried fields
2. **Lean Queries:** Uses `.lean()` for read-only operations
3. **Pagination:** Implements pagination for large datasets
4. **Selective Fields:** Only returns necessary fields using `.select()`
5. **Population Limits:** Limits populated references to essential fields

## Testing

Test the API endpoints using tools like:
- **Postman:** For manual testing and API documentation
- **Insomnia:** Alternative to Postman
- **cURL:** Command-line testing
- **Jest/Supertest:** For automated testing

## Support

For technical support or questions about the Manager Backend API, please refer to the development team or create an issue in the project repository.
