# 🚀 API Testing Guide - Order & Supplier Services

## Base URLs
- **Order Service**: `http://localhost:3005`
- **Supplier Service**: `http://localhost:3004`

---

## 📦 Order Service API Testing

### 1. Create Order
**POST** `/api/orders`

```json
{
  "user_id": 1,
  "total_amount": 150.50,
  "shipping_address": "123 Main St, New York, NY 10001",
  "payment_method": "credit_card",
  "payment_status": "pending",
  "notes": "Please deliver before 5 PM",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 50.25
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 50.00
    }
  ]
}
```

### 2. Get All Orders
**GET** `/api/orders`

Query Parameters (optional):
- `status`: pending, processing, shipped, delivered, cancelled
- `user_id`: Filter by user ID
- `limit`: Limit results

Example: `http://localhost:3005/api/orders?status=pending&limit=10`

### 3. Get Order by ID
**GET** `/api/orders/:id`

Example: `http://localhost:3005/api/orders/1`

### 4. Update Order
**PUT** `/api/orders/:id`

```json
{
  "shipping_address": "456 New Address, Los Angeles, CA 90001",
  "payment_status": "paid",
  "notes": "Updated delivery instructions"
}
```

### 5. Update Order Status
**PATCH** `/api/orders/:id/status`

```json
{
  "status": "processing"
}
```

Valid statuses: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

### 6. Delete Order
**DELETE** `/api/orders/:id`

Example: `http://localhost:3005/api/orders/1`

---

## 🏢 Supplier Service API Testing

### 1. Create Supplier
**POST** `/api/suppliers`

```json
{
  "name": "TechSupply Co.",
  "contact_person": "John Doe",
  "email": "john@techsupply.com",
  "phone": "+1234567890",
  "address": "789 Business Park, San Francisco, CA 94107",
  "status": "active"
}
```

### 2. Get All Suppliers
**GET** `/api/suppliers`

Query Parameters (optional):
- `status`: active, inactive
- `search`: Search by name or contact
- `limit`: Limit results

Example: `http://localhost:3004/api/suppliers?status=active`

### 3. Get Supplier by ID
**GET** `/api/suppliers/:id`

Example: `http://localhost:3004/api/suppliers/1`

### 4. Update Supplier
**PUT** `/api/suppliers/:id`

```json
{
  "name": "TechSupply Corporation",
  "contact_person": "Jane Smith",
  "email": "jane@techsupply.com",
  "phone": "+1987654321",
  "status": "active"
}
```

### 5. Delete Supplier
**DELETE** `/api/suppliers/:id`

Example: `http://localhost:3004/api/suppliers/1`

---

## 📋 Purchase Order API Testing

### 1. Create Purchase Order
**POST** `/api/purchase-orders`

```json
{
  "supplier_id": 1,
  "order_date": "2025-10-27",
  "expected_delivery_date": "2025-11-05",
  "total_amount": 5000.00,
  "status": "pending",
  "notes": "Urgent order for inventory restock"
}
```

### 2. Get All Purchase Orders
**GET** `/api/purchase-orders`

Query Parameters (optional):
- `status`: pending, approved, ordered, received, cancelled
- `supplier_id`: Filter by supplier
- `limit`: Limit results

Example: `http://localhost:3004/api/purchase-orders?status=pending&supplier_id=1`

### 3. Get Purchase Order Stats
**GET** `/api/purchase-orders/stats`

Query Parameters (optional):
- `supplier_id`: Filter stats by supplier

Example: `http://localhost:3004/api/purchase-orders/stats`

### 4. Get Purchase Order by ID
**GET** `/api/purchase-orders/:id`

Example: `http://localhost:3004/api/purchase-orders/1`

### 5. Update Purchase Order
**PUT** `/api/purchase-orders/:id`

```json
{
  "expected_delivery_date": "2025-11-10",
  "total_amount": 5500.00,
  "notes": "Updated delivery date and amount"
}
```

### 6. Update Purchase Order Status
**PATCH** `/api/purchase-orders/:id/status`

```json
{
  "status": "approved"
}
```

Valid statuses: `pending`, `approved`, `ordered`, `received`, `cancelled`

### 7. Delete Purchase Order
**DELETE** `/api/purchase-orders/:id`

Example: `http://localhost:3004/api/purchase-orders/1`

---

## 🧪 Testing Workflow

### Order Service Testing Flow:
1. ✅ Create a new order with items
2. ✅ Get all orders and verify the new order appears
3. ✅ Get the specific order by ID
4. ✅ Update order status from `pending` → `processing` → `shipped` → `delivered`
5. ✅ Update order details (address, payment status)
6. ✅ Delete the order

### Supplier Service Testing Flow:
1. ✅ Create a new supplier
2. ✅ Get all suppliers and verify the new supplier appears
3. ✅ Get the specific supplier by ID
4. ✅ Update supplier details
5. ✅ Create a purchase order for the supplier
6. ✅ Get all purchase orders
7. ✅ Update PO status: `pending` → `approved` → `ordered` → `received`
8. ✅ Get purchase order stats
9. ✅ Delete purchase order
10. ✅ Delete supplier

---

## 📊 Expected Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

---

## 🔧 Common Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🐛 Debugging Tips

1. **Check Docker Containers**: `docker ps` - Ensure all services are running
2. **Check Service Logs**: 
   - `docker logs ims-order-service`
   - `docker logs ims-supplier-service`
3. **Check Database Connection**: Services log database connection status on startup
4. **Validation Errors**: Check the `errors` array in response for detailed validation messages
5. **Console Logs**: All CRUD operations log to console for debugging

---

## ✅ Testing Checklist

### Order Service:
- [ ] Create order with valid data
- [ ] Create order with missing fields (should fail)
- [ ] Get all orders
- [ ] Get order by ID
- [ ] Get non-existent order (should return 404)
- [ ] Update order details
- [ ] Update order status through workflow
- [ ] Delete order
- [ ] Filter orders by status
- [ ] Filter orders by user_id

### Supplier Service:
- [ ] Create supplier with valid data
- [ ] Create supplier with invalid email (should fail)
- [ ] Get all suppliers
- [ ] Get supplier by ID
- [ ] Update supplier details
- [ ] Delete supplier
- [ ] Filter suppliers by status

### Purchase Order Service:
- [ ] Create PO with valid data
- [ ] Create PO with invalid supplier_id (should fail)
- [ ] Get all purchase orders
- [ ] Get PO by ID
- [ ] Update PO details
- [ ] Update PO status through workflow
- [ ] Get PO statistics
- [ ] Delete PO
- [ ] Filter POs by status and supplier

---

## 🎯 Performance Testing

Test with multiple concurrent requests:
- Create 10+ orders simultaneously
- Bulk fetch with different filters
- Test transaction rollback (create order with invalid item)
- Test status validation (skip status steps)

---

**Happy Testing! 🚀**
