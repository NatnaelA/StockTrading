# StockTrading API Reference

## Overview

This document provides detailed information about the available API endpoints in the StockTrading application. All endpoints require authentication unless otherwise specified.

## Base URL

```
https://api.stocktrading.com/v1
```

## Authentication

### POST /api/auth/login

Authenticates a user and creates a session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "userId",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### POST /api/auth/register

Creates a new user account.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "newpassword",
  "name": "New User"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "newUserId",
    "email": "newuser@example.com",
    "name": "New User"
  }
}
```

### POST /api/auth/logout

Ends the current user session.

**Response:**

```json
{
  "success": true
}
```

## Portfolio Management

### GET /api/portfolios/user-portfolio

Retrieves the authenticated user's portfolio.

**Response:**

```json
{
  "success": true,
  "portfolio": {
    "id": "portfolioId",
    "userId": "userId",
    "name": "Main Portfolio",
    "balance": 10000.0,
    "currency": "USD",
    "holdings": {
      "AAPL": {
        "quantity": 10,
        "averagePrice": 150.0,
        "lastUpdated": "2023-01-15T12:00:00Z"
      }
    },
    "totalValue": 11500.0,
    "dayChange": 120.5,
    "dayChangePercentage": 1.05,
    "createdAt": "2022-12-01T10:30:00Z",
    "updatedAt": "2023-01-15T12:00:00Z"
  }
}
```

### GET /api/portfolios/history

Retrieves historical performance data for a portfolio.

**Query Parameters:**

- `portfolioId` (required): ID of the portfolio
- `timeRange` (optional): Time range for data (1D, 1W, 1M, 3M, 1Y, ALL), defaults to 1M

**Response:**

```json
{
  "success": true,
  "performanceData": [
    {
      "timestamp": 1673740800000,
      "value": 10500.0
    },
    {
      "timestamp": 1673827200000,
      "value": 10650.0
    }
  ]
}
```

### POST /api/portfolios/{portfolioId}/history/capture

Manually captures a portfolio's current state for historical tracking.

**Path Parameters:**

- `portfolioId`: ID of the portfolio

**Response:**

```json
{
  "success": true,
  "message": "Portfolio history captured successfully",
  "timestamp": "2023-01-15T12:00:00Z"
}
```

## Transactions

### GET /api/transactions/recent

Retrieves recent transactions for the authenticated user.

**Query Parameters:**

- `portfolioId` (optional): Filter by portfolio ID
- `limit` (optional): Maximum number of transactions to return, defaults to 50

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": "transactionId",
      "userId": "userId",
      "ticker": "AAPL",
      "quantity": 5,
      "price": 150.0,
      "type": "buy",
      "status": "completed",
      "createdAt": "2023-01-10T09:30:00Z",
      "updatedAt": "2023-01-10T09:30:00Z"
    }
  ]
}
```

## Trades

### GET /api/trades

Retrieves trade requests.

**Query Parameters:**

- `portfolioId` (optional): Filter by portfolio ID
- `firmId` (optional): Filter by brokerage firm ID

**Response:**

```json
{
  "trades": [
    {
      "id": "tradeId",
      "symbol": "MSFT",
      "quantity": 10,
      "orderType": "market",
      "side": "buy",
      "status": "pending_client_approval",
      "portfolioId": "portfolioId",
      "requestedBy": "brokerId",
      "firmId": "firmId",
      "createdAt": "2023-01-12T10:15:00Z",
      "updatedAt": "2023-01-12T10:15:00Z"
    }
  ]
}
```

### POST /api/trades/request

Submits a new trade request.

**Request Body:**

```json
{
  "symbol": "NVDA",
  "quantity": 5,
  "orderType": "market",
  "side": "buy",
  "portfolioId": "portfolioId",
  "notes": "Investing in AI growth"
}
```

**Response:**

```json
{
  "success": true,
  "tradeId": "newTradeId",
  "needsApproval": true,
  "message": "Trade request submitted for broker approval"
}
```

### GET /api/trades/{tradeId}

Retrieves details for a specific trade.

**Path Parameters:**

- `tradeId`: ID of the trade

**Response:**

```json
{
  "trade": {
    "id": "tradeId",
    "symbol": "MSFT",
    "quantity": 10,
    "orderType": "market",
    "side": "buy",
    "status": "pending_client_approval",
    "portfolioId": "portfolioId",
    "requestedBy": "brokerId",
    "firmId": "firmId",
    "createdAt": "2023-01-12T10:15:00Z",
    "updatedAt": "2023-01-12T10:15:00Z"
  }
}
```

### POST /api/trades/{tradeId}/client-approval

Approves or rejects a trade request (client side).

**Path Parameters:**

- `tradeId`: ID of the trade

**Request Body:**

```json
{
  "approved": true,
  "notes": "Looks good"
}
```

**Response:**

```json
{
  "success": true,
  "status": "executed",
  "message": "Trade executed successfully"
}
```

## Support

### POST /api/support/tickets

Creates a new support ticket.

**Request Body:**

```json
{
  "subject": "Account Issue",
  "description": "Having trouble linking my bank account",
  "priority": "medium",
  "category": "account"
}
```

**Response:**

```json
{
  "success": true,
  "ticketId": "ticketId",
  "message": "Support ticket created successfully"
}
```

### GET /api/support/tickets

Retrieves support tickets for the authenticated user.

**Query Parameters:**

- `status` (optional): Filter by ticket status (open, closed, resolved)
- `limit` (optional): Maximum number of tickets to return

**Response:**

```json
{
  "success": true,
  "tickets": [
    {
      "id": "ticketId",
      "userId": "userId",
      "subject": "Account Issue",
      "description": "Having trouble linking my bank account",
      "status": "open",
      "priority": "medium",
      "category": "account",
      "createdAt": "2023-01-18T14:30:00Z",
      "updatedAt": "2023-01-18T14:30:00Z"
    }
  ]
}
```

## Notifications

### GET /api/notifications

Retrieves notifications for the authenticated user.

**Query Parameters:**

- `unreadOnly` (optional): When true, returns only unread notifications
- `limit` (optional): Maximum number of notifications to return

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "notificationId",
      "userId": "userId",
      "type": "trade_executed",
      "title": "Trade Executed",
      "message": "Your buy order for 5 shares of AAPL has been executed",
      "read": false,
      "createdAt": "2023-01-14T11:20:00Z"
    }
  ]
}
```

### PUT /api/notifications/{notificationId}/read

Marks a notification as read.

**Path Parameters:**

- `notificationId`: ID of the notification

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

## Payments

### GET /api/payments/methods

Retrieves saved payment methods for the authenticated user.

**Response:**

```json
{
  "success": true,
  "paymentMethods": [
    {
      "id": "paymentMethodId",
      "type": "bank_account",
      "name": "Primary Checking",
      "last4": "4567",
      "isDefault": true,
      "createdAt": "2022-12-15T09:45:00Z"
    }
  ]
}
```

### POST /api/payments/deposit

Initiates a deposit to the user's portfolio.

**Request Body:**

```json
{
  "amount": 1000.0,
  "currency": "USD",
  "paymentMethodId": "paymentMethodId",
  "portfolioId": "portfolioId"
}
```

**Response:**

```json
{
  "success": true,
  "transactionId": "depositTransactionId",
  "status": "pending",
  "estimatedCompletionDate": "2023-01-22T00:00:00Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized: No session cookie"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Failed to process request",
  "error": "Error details"
}
```

## Rate Limiting

API requests are limited to:

- 100 requests per minute per IP address
- 1000 requests per day per user

Exceeding these limits will result in a 429 Too Many Requests response:

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Webhooks

The StockTrading API supports webhooks for real-time event notifications. To configure webhooks, contact our support team.

### Event Types

- `trade.executed`: Triggered when a trade is executed
- `deposit.completed`: Triggered when a deposit is completed
- `withdrawal.completed`: Triggered when a withdrawal is completed
- `portfolio.updated`: Triggered when a portfolio is updated

## API Versioning

The API uses URL versioning (e.g., `/v1/`). When a new version is released, the previous version will be supported for at least 6 months.

## Support

If you encounter any issues or have questions about the API, please contact our support team at api-support@stocktrading.com or create a support ticket.
