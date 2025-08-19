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
