# Delivery Partner Management System

This document describes the comprehensive delivery partner management system with document verification capabilities.

## Overview

The delivery partner system now includes:
- Profile management
- Document verification system
- Status tracking
- Performance metrics
- **Admin & Manager management tools** (Both roles have access)

## Access Control

**🔐 Dual Access System:**
- **Admins**: Full access to all delivery partner operations
- **Managers**: Full access to all delivery partner operations
- **Delivery Partners**: Limited access to their own profile and documents

This design allows managers to handle day-to-day operations while admins maintain oversight.

## Database Schema

### Delivery Partner Model

```javascript
{
    name: String,                    // Partner's full name
    phone: String,                   // Unique phone number
    status: String,                  // 'verified' | 'pending'
    documentStatus: {
        idProof: String,             // 'verified' | 'pending' | 'rejected'
        addressProof: String,        // 'verified' | 'pending' | 'rejected'
        vehicleDocuments: String,    // 'verified' | 'pending' | 'rejected'
        drivingLicense: String,      // 'verified' | 'pending' | 'rejected'
        insuranceDocuments: String   // 'verified' | 'pending' | 'rejected'
    },
    verificationNotes: {
        idProof: String,             // Admin/Manager notes for verification
        addressProof: String,
        vehicleDocuments: String,
        drivingLicense: String,
        insuranceDocuments: String
    },
    overallDocumentStatus: String,   // Auto-calculated: 'verified' | 'pending' | 'rejected'
    isActive: Boolean,               // Account status
    assignedOrders: [ObjectId],      // Array of assigned order IDs
    totalDeliveries: Number,         // Total deliveries completed
    totalAccepted: Number,           // Total orders accepted
    totalRejected: Number,           // Total orders rejected
    rating: Number,                  // Average rating (0-5)
    lastActive: Date,                // Last activity timestamp
    createdAt: Date,                 // Account creation date
    updatedAt: Date                  // Last update date
}
```

## API Endpoints

### Delivery Partner Routes (Authenticated)

#### Profile Management
- `GET /api/delivery-partners/profile` - Get own profile
- `PUT /api/delivery-partners/profile` - Update own profile

#### Document Management
- `GET /api/delivery-partners/documents/status` - Get document verification status
- `POST /api/delivery-partners/documents/upload` - Upload document for verification

#### Operations
- `GET /api/delivery-partners/statistics` - Get delivery statistics
- `PUT /api/delivery-partners/last-active` - Update last active status
- `GET /api/delivery-partners/orders` - Get assigned orders

#### QR Scan Flow
- `POST /api/delivery-partners/scan-qr` - Send scanned QR payload and receive order details
  - Body: `{ code: string }` where `code` is either the Mongo Order ID or a JSON string like `{ "orderId": "<id>" }`
  - Response: order summary with items and status; only orders in `ready | picked_up | in_transit` are allowed
- `POST /api/delivery-partners/respond-order` - Respond to scanned order with accept or reject
  - Body: `{ orderId: string, action: 'accept' | 'reject' }`
  - Response on accept: `{ accepted: true, orderId, customerLat, customerLong }`
  - Response on reject: `{ rejected: true }`

#### Complete Delivery Flow
- `POST /api/delivery-partners/initiate-delivery` - Start delivery navigation
  - Body: `{ orderId: string }`
  - Response: `{ orderId, estimatedDeliveryTime, customerLat, customerLong }`
  - Sets estimated delivery time to 1 hour from pickup

- `POST /api/delivery-partners/mark-delivered` - Mark order as successfully delivered
  - Body: `{ orderId: string }`
  - Response: `{ orderId, deliveredAt }`
  - Updates delivery partner statistics

- `POST /api/delivery-partners/reject-delivery` - Reject delivery with reason
  - Body: `{ orderId: string, reason: string, notes?: string }`
  - Reason options: `customer_not_available`, `wrong_address`, `payment_issue`, `order_cancelled`, `other`
  - Response: `{ orderId, rejectedAt, reason }`

#### Order Management
- `GET /api/delivery-partners/ongoing-orders` - Get orders picked up but not delivered
  - Response: Array of ongoing orders with estimated delivery times
- `GET /api/delivery-partners/completed-orders` - Get successfully delivered orders
  - Response: Array of completed orders with delivery timestamps

#### Profile Section
- `GET /api/delivery-partners/profile/info` - Get comprehensive profile information
  - Response: Complete profile with order statistics (total, completed, ongoing)
- `GET /api/delivery-partners/profile/stats` - Get performance statistics
  - Response: Delivery stats, success rate, rating, days active
- `GET /api/delivery-partners/contact-us` - Get store manager contact for "Contact Us"
  - Response: Store and manager details (name, phone, location)
- `PATCH /api/delivery-partners/profile/edit` - Edit delivery partner name
  - Body: `{ "name": "New Name" }`
  - Response: Updated profile information
- `DELETE /api/delivery-partners/profile` - Delete delivery partner account
  - Note: Cannot delete if there are ongoing deliveries
  - Response: Account deletion confirmation

### Profile Section Features

#### Contact Us
- Fetches store manager's phone number from most recent order
- Used by frontend to open phone call log with manager's number
- Returns store name, phone, location and manager details

#### Profile Information
- Basic profile details (name, phone, status)
- Document verification status
- Order statistics (total, completed, ongoing)
- Performance metrics

#### Account Management
- Edit profile details
- View delivery statistics
- Delete account (with safety checks)
- Logout functionality

#### Document Status
- View verification status of all documents
- Check overall document verification status
- See admin/manager verification notes

#### Delivery Status Flow
1. **QR Scan** → Order Details (Accept/Reject)
2. **Accept** → Order Address (Initiate Delivery/Call Customer)
3. **Initiate Delivery** → Google Maps Navigation + 1 hour ETA
4. **Delivery Complete** → Order Delivered/Not Delivered/Call Customer
5. **Order Delivered** → Moves to Completed Orders
6. **Not Delivered** → Reason Selection → Order Rejected
7. **Ongoing Orders** → Shows orders in transit with ETAs

### Admin Routes (Admin Only)

#### Partner Management
- `POST /api/admin/delivery-partners` - Create new delivery partner
- `GET /api/admin/delivery-partners` - Get all delivery partners with filtering
- `GET /api/admin/delivery-partners/stats` - Get overall statistics
- `GET /api/admin/delivery-partners/:id` - Get specific partner details
- `DELETE /api/admin/delivery-partners/:id` - Delete delivery partner

#### Status Management
- `PATCH /api/admin/delivery-partners/:id/status` - Update partner status
- `PATCH /api/admin/delivery-partners/:id/documents` - Update single document status
- `PATCH /api/admin/delivery-partners/:id/documents/bulk` - Bulk update document statuses

### Manager Routes (Manager Only)

#### Partner Management
- `POST /api/manager/delivery-partners` - Create new delivery partner
- `GET /api/manager/delivery-partners` - Get all delivery partners with filtering
- `GET /api/manager/delivery-partners/stats` - Get overall statistics
- `GET /api/manager/delivery-partners/:id` - Get specific partner details
- `DELETE /api/manager/delivery-partners/:id` - Delete delivery partner

#### Status Management
- `PATCH /api/manager/delivery-partners/:id/status` - Update partner status
- `PATCH /api/manager/delivery-partners/:id/documents` - Update single document status
- `PATCH /api/manager/delivery-partners/:id/documents/bulk` - Bulk update document statuses

## Usage Examples

### 1. Create New Delivery Partner (Admin/Manager)

```bash
# Admin
POST /api/admin/delivery-partners

# Manager  
POST /api/manager/delivery-partners

Content-Type: application/json

{
    "name": "New Partner Name",
    "phone": "9876543210"
}
```

**Response:**
```json
{
    "statusCode": 201,
    "data": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "New Partner Name",
        "phone": "9876543210",
        "status": "pending",
        "documentStatus": {
            "idProof": "pending",
            "addressProof": "pending",
            "vehicleDocuments": "pending",
            "drivingLicense": "pending",
            "insuranceDocuments": "pending"
        },
        "overallDocumentStatus": "pending",
        "isActive": false
    },
    "message": "Delivery partner created successfully"
}
```

### 2. Get All Delivery Partners (Admin/Manager)

```bash
# Admin
GET /api/admin/delivery-partners?page=1&limit=10&status=verified&overallDocumentStatus=verified&search=rahul

# Manager
GET /api/manager/delivery-partners?page=1&limit=10&status=verified&overallDocumentStatus=verified&search=rahul
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by partner status ('verified' | 'pending')
- `overallDocumentStatus`: Filter by document status ('verified' | 'pending' | 'rejected')
- `search`: Search by name or phone

**Response:**
```json
{
    "statusCode": 200,
    "data": {
        "deliveryPartners": [...],
        "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "totalItems": 25,
            "itemsPerPage": 10
        }
    },
    "message": "Delivery partners retrieved successfully"
}
```

### 3. Update Document Verification Status (Admin/Manager)

```bash
# Admin
PATCH /api/admin/delivery-partners/64f1a2b3c4d5e6f7g8h9i0j1/documents

# Manager
PATCH /api/manager/delivery-partners/64f1a2b3c4d5e6f7g8h9i0j1/documents

Content-Type: application/json

{
    "documentType": "idProof",
    "status": "verified",
    "notes": "Aadhar card verified successfully"
}
```

**Response:**
```json
{
    "statusCode": 200,
    "data": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "Rahul Kumar",
        "documentStatus": {
            "idProof": "verified",
            "addressProof": "pending",
            "vehicleDocuments": "pending",
            "drivingLicense": "pending",
            "insuranceDocuments": "pending"
        },
        "overallDocumentStatus": "pending"
    },
    "message": "Document verification status updated successfully"
}
```

### 4. Bulk Update Document Statuses (Admin/Manager)

```bash
# Admin
PATCH /api/admin/delivery-partners/64f1a2b3c4d5e6f7g8h9i0j1/documents/bulk

# Manager
PATCH /api/manager/delivery-partners/64f1a2b3c4d5e6f7g8h9i0j1/documents/bulk

Content-Type: application/json

{
    "documents": [
        {
            "documentType": "addressProof",
            "status": "verified",
            "notes": "Utility bill verified"
        },
        {
            "documentType": "vehicleDocuments",
            "status": "verified",
            "notes": "RC book and insurance verified"
        }
    ]
}
```

### 5. Get Document Status (Delivery Partner)

```bash
GET /api/delivery-partners/documents/status
Authorization: Bearer <token>
```

**Response:**
```json
{
    "statusCode": 200,
    "data": {
        "documentStatus": {
            "idProof": "verified",
            "addressProof": "pending",
            "vehicleDocuments": "pending",
            "drivingLicense": "pending",
            "insuranceDocuments": "pending"
        },
        "overallDocumentStatus": "pending",
        "verificationNotes": {
            "idProof": "Aadhar card verified successfully",
            "addressProof": "Address proof pending submission"
        },
        "status": "pending"
    },
    "message": "Document status retrieved successfully"
}
```

## Validation Rules

### Profile Update
- Name: 2-100 characters
- Phone: 10-15 digits, unique

### Document Verification
- Document Type: Must be one of: `idProof`, `addressProof`, `vehicleDocuments`, `drivingLicense`, `insuranceDocuments`
- Status: Must be one of: `verified`, `pending`, `rejected`
- Notes: Optional, max 500 characters

### Query Parameters
- Page: Integer ≥ 1
- Limit: Integer 1-100
- Search: String max 100 characters

## Automatic Status Calculation

The system automatically calculates `overallDocumentStatus` based on individual document statuses:

- **`verified`**: All documents are verified
- **`rejected`**: Any document is rejected
- **`pending`**: Some documents are still pending

This calculation happens automatically when documents are updated.

## Dual Access Benefits

**Why Both Admins and Managers Have Access:**

1. **Operational Efficiency**: Managers can handle day-to-day partner management
2. **Business Continuity**: Operations continue even if admins are unavailable
3. **Role Flexibility**: Different business models can assign responsibilities as needed
4. **Audit Trail**: All actions are logged with user role and ID
5. **Scalability**: Easy to add more roles with similar permissions

## Dynamic Management

**Important**: Delivery partners are managed dynamically through the admin/manager interface, not through seeders. This approach is better because:

1. **Real-time Operations**: Admins and managers can add/remove partners as business needs change
2. **Data Integrity**: No conflicts between seeded and real business data
3. **Business Flexibility**: Partners can be onboarded and offboarded as needed
4. **Audit Trail**: All changes are tracked with timestamps and user actions

## Error Handling

All endpoints use consistent error handling with:
- HTTP status codes
- Descriptive error messages
- Validation error details
- Proper error logging

## Security Features

- JWT authentication for all protected routes
- Role-based access control (admin, manager, delivery partner)
- Input validation and sanitization
- Rate limiting (if configured)
- Permission checking in shared controllers

## Performance Optimizations

- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient aggregation queries for statistics
- Optimized database queries with proper field selection

## Future Enhancements

- File upload for document verification
- Email notifications for status changes
- Document expiry tracking
- Advanced analytics and reporting
- Mobile app integration
- Real-time status updates via WebSocket
- Role-based permission customization

## Complete API Testing Guide

### Base Configuration
- **Base URL**: `http://localhost:8000`
- **Headers**: `Authorization: Bearer <delivery_partner_token>`, `Content-Type: application/json`

### 1. Authentication Flow

#### Send OTP
```
POST /deliveryPartner/send-otp
{
  "phone": "9999999998"
}
```

#### Verify Login
```
POST /deliveryPartner/verify-login
{
  "phone": "9999999998",
  "otp": "2025",
  "userId": "<delivery_partner_id>"
}
```

### 2. Complete Delivery Flow Testing

#### Step 1: Scan QR Code
```
POST /deliveryPartner/scan-qr
{
  "code": "<order_id_from_database>"
}
```

#### Step 2: Accept Order
```
POST /deliveryPartner/respond-order
{
  "orderId": "<order_id>",
  "action": "accept"
}
```

#### Step 3: Initiate Delivery
```
POST /deliveryPartner/initiate-delivery
{
  "orderId": "<order_id>"
}
```

#### Step 4: Mark as Delivered
```
POST /deliveryPartner/mark-delivered
{
  "orderId": "<order_id>"
}
```

### 3. Alternative Flow: Reject Delivery

#### Reject with Reason
```
POST /deliveryPartner/reject-delivery
{
  "orderId": "<order_id>",
  "reason": "customer_not_available",
  "notes": "Customer not responding to calls"
}
```

### 4. Order Management

#### Get Ongoing Orders
```
GET /deliveryPartner/ongoing-orders
```

#### Get Completed Orders
```
GET /deliveryPartner/completed-orders
```

### Expected Responses

#### Successful QR Scan
```json
{
  "statusCode": 200,
  "data": {
    "id": "68a5b222e4e3dc004bd9aaa8",
    "orderId": "ORD-001",
    "clientName": "John Doe",
    "phone": "9876543223",
    "amount": 299,
    "location": "123 Main St, City",
    "customerLat": 12.9716,
    "customerLong": 77.5946,
    "items": [...],
    "status": "ready"
  },
  "message": "Order retrieved from QR"
}
```

#### Order Accepted
```json
{
  "statusCode": 200,
  "data": {
    "accepted": true,
    "orderId": "68a5b222e4e3dc004bd9aaa8",
    "customerLat": 12.9716,
    "customerLong": 77.5946
  },
  "message": "Order accepted by delivery partner"
}
```

#### Delivery Initiated
```json
{
  "statusCode": 200,
  "data": {
    "orderId": "68a5b222e4e3dc004bd9aaa8",
    "estimatedDeliveryTime": "2025-08-20T11:50:00.000Z",
    "customerLat": 12.9716,
    "customerLong": 77.5946
  },
  "message": "Delivery initiated successfully"
}
```

#### Order Delivered
```json
{
  "statusCode": 200,
  "data": {
    "orderId": "68a5b222e4e3dc004bd9aaa8",
    "deliveredAt": "2025-08-20T11:45:00.000Z"
  },
  "message": "Order marked as delivered successfully"
}
```

### Testing Checklist

- [ ] Create test order in database with status "ready"
- [ ] Login as delivery partner and get access token
- [ ] Test QR scan with valid order ID
- [ ] Test order acceptance
- [ ] Test delivery initiation (should set 1-hour ETA)
- [ ] Test marking order as delivered
- [ ] Test order rejection with valid reason
- [ ] Verify ongoing orders endpoint
- [ ] Verify completed orders endpoint
- [ ] Test error cases (invalid order ID, unauthorized access, etc.)

### Profile Section Testing

- [ ] Test get profile info endpoint
- [ ] Test get profile stats endpoint
- [ ] Test contact us endpoint (should return store manager phone)
- [ ] Test delete account endpoint (with and without ongoing orders)
- [ ] Verify all profile data is returned correctly

### Complete API Testing Guide

#### Base Configuration
- **Base URL**: `http://localhost:8000`
- **Headers**: `Authorization: Bearer <delivery_partner_token>`, `Content-Type: application/json`

#### 1. Authentication Flow

##### Send OTP
```
POST /deliveryPartner/send-otp
{
  "phone": "9999999992"
}
```

##### Verify Login (Get Token)
```
POST /deliveryPartner/verify-login
{
  "phone": "9999999992",
  "otp": "2025",
  "userId": "<delivery_partner_id>"
}
```

#### 2. Profile Section Testing

##### Get Profile Information
```
GET /deliveryPartner/profile/info
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "name": "Test Driver",
    "phone": "9999999992",
    "status": "verified",
    "documentStatus": {...},
    "orderStats": {
      "total": 5,
      "completed": 3,
      "ongoing": 1
    }
  },
  "message": "Profile information retrieved successfully"
}
```

##### Get Profile Statistics
```
GET /deliveryPartner/profile/stats
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalDeliveries": 15,
    "totalAccepted": 20,
    "totalRejected": 2,
    "rating": 4.5,
    "successRate": "75.00%",
    "averageRating": "4.5",
    "daysActive": 30
  },
  "message": "Profile statistics retrieved successfully"
}
```

##### Contact Us (Get Store Manager Phone)
```
GET /deliveryPartner/contact-us
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "store": {
      "name": "Fresh Meat Center",
      "phone": "9876543210",
      "location": "JP Nagar, Bangalore"
    },
    "manager": {
      "name": "John Manager",
      "phone": "9876543211"
    }
  },
  "message": "Store manager contact information retrieved successfully"
}
```

##### Delete Account
```
DELETE /deliveryPartner/profile
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Account deleted successfully"
}
```

**Error Response (if ongoing orders):**
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Cannot delete account while having ongoing deliveries"
}
```

#### 3. Complete Delivery Flow Testing

##### Step 1: Scan QR Code
```
POST /deliveryPartner/scan-qr
Headers: Authorization: Bearer <token>
{
  "code": "<order_id_from_database>"
}
```

##### Step 2: Accept Order
```
POST /deliveryPartner/respond-order
Headers: Authorization: Bearer <token>
{
  "orderId": "<order_id>",
  "action": "accept"
}
```

##### Step 3: Initiate Delivery
```
POST /deliveryPartner/initiate-delivery
Headers: Authorization: Bearer <token>
{
  "orderId": "<order_id>"
}
```

##### Step 4: Mark as Delivered
```
POST /deliveryPartner/mark-delivered
Headers: Authorization: Bearer <token>
{
  "orderId": "<order_id>"
}
```

#### 4. Order Management Testing

##### Get Ongoing Orders
```
GET /deliveryPartner/ongoing-orders
Headers: Authorization: Bearer <token>
```

##### Get Completed Orders
```
GET /deliveryPartner/completed-orders
Headers: Authorization: Bearer <token>
```

##### Get All Assigned Orders
```
GET /deliveryPartner/orders
Headers: Authorization: Bearer <token>
```

### Testing Order in Postman:

1. **Start with authentication** (steps 1-2)
2. **Test profile endpoints** (profile info, stats, contact us)
3. **Test QR scan** with your order ID
4. **Accept the order**
5. **Initiate delivery**
6. **Check ongoing orders**
7. **Mark as delivered**
8. **Check completed orders**
9. **Test delete account** (should fail if orders exist)

**Remember**: Use the `accessToken` from step 2 in all subsequent requests as `Authorization: Bearer <token>` header!

### Common Error Responses

#### Order Not Available
```json
{
  "statusCode": 400,
  "message": "Order not available for pickup"
}
```

#### Order Already Assigned
```json
{
  "statusCode": 409,
  "message": "Order already assigned"
}
```

#### Unauthorized Access
```json
{
  "statusCode": 401,
  "message": "Missing Authorization header"
}
```
