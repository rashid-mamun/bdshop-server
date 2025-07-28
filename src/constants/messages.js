// Success Messages
const SUCCESS_MESSAGES = {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    USER_FETCHED: 'User fetched successfully',
    USERS_FETCHED: 'Users fetched successfully',
    USER_ADMIN_UPDATED: 'User admin status updated successfully',

    SERVICE_CREATED: 'Service created successfully',
    SERVICE_UPDATED: 'Service updated successfully',
    SERVICE_DELETED: 'Service deleted successfully',
    SERVICE_FETCHED: 'Service fetched successfully',
    SERVICES_FETCHED: 'Services fetched successfully',

    ORDER_CREATED: 'Order created successfully',
    ORDER_UPDATED: 'Order updated successfully',
    ORDER_DELETED: 'Order deleted successfully',
    ORDER_FETCHED: 'Order fetched successfully',
    ORDERS_FETCHED: 'Orders fetched successfully',

    CART_CREATED: 'Cart created successfully',
    CART_UPDATED: 'Cart updated successfully',
    CART_DELETED: 'Cart deleted successfully',
    CART_FETCHED: 'Cart fetched successfully',
    CARTS_FETCHED: 'Carts fetched successfully',

    REVIEW_CREATED: 'Review created successfully',
    REVIEW_UPDATED: 'Review updated successfully',
    REVIEW_DELETED: 'Review deleted successfully',
    REVIEW_FETCHED: 'Review fetched successfully',
    REVIEWS_FETCHED: 'Reviews fetched successfully',

    SERVER_HEALTHY: 'Server is healthy',
    SERVER_RUNNING: 'BdShop Server API is running'
};

// Error Messages
const ERROR_MESSAGES = {
    // General Errors
    INTERNAL_SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
    VALIDATION_ERROR: 'Validation error',

    // User Errors
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    USER_CREATION_FAILED: 'Failed to create user',
    USER_UPDATE_FAILED: 'Failed to update user',
    USER_DELETION_FAILED: 'Failed to delete user',
    USER_FETCH_FAILED: 'Failed to fetch user',

    // Service Errors
    SERVICE_NOT_FOUND: 'Service not found',
    SERVICE_CREATION_FAILED: 'Failed to create service',
    SERVICE_UPDATE_FAILED: 'Failed to update service',
    SERVICE_DELETION_FAILED: 'Failed to delete service',
    SERVICE_FETCH_FAILED: 'Failed to fetch service',

    // Order Errors
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_CREATION_FAILED: 'Failed to create order',
    ORDER_UPDATE_FAILED: 'Failed to update order',
    ORDER_DELETION_FAILED: 'Failed to delete order',
    ORDER_FETCH_FAILED: 'Failed to fetch order',

    // Cart Errors
    CART_NOT_FOUND: 'Cart not found',
    CART_CREATION_FAILED: 'Failed to create cart',
    CART_UPDATE_FAILED: 'Failed to update cart',
    CART_DELETION_FAILED: 'Failed to delete cart',
    CART_FETCH_FAILED: 'Failed to fetch cart',

    // Review Errors
    REVIEW_NOT_FOUND: 'Review not found',
    REVIEW_CREATION_FAILED: 'Failed to create review',
    REVIEW_UPDATE_FAILED: 'Failed to update review',
    REVIEW_DELETION_FAILED: 'Failed to delete review',
    REVIEW_FETCH_FAILED: 'Failed to fetch review',

    // Database Errors
    DATABASE_CONNECTION_ERROR: 'Database connection error',
    DATABASE_QUERY_ERROR: 'Database query error',

    // Validation Errors
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PASSWORD: 'Invalid password format',
    MISSING_REQUIRED_FIELDS: 'Missing required fields',
    INVALID_ID_FORMAT: 'Invalid ID format',

    // Authentication Errors
    INVALID_TOKEN: 'Invalid authentication token',
    TOKEN_EXPIRED: 'Authentication token expired',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions'
};

// Validation Messages
const VALIDATION_MESSAGES = {
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Please provide a valid email address',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
    DISPLAY_NAME_REQUIRED: 'Display name is required',
    DISPLAY_NAME_MIN_LENGTH: 'Display name must be at least 2 characters long',
    DISTRICT_REQUIRED: 'District is required',
    DIVISION_REQUIRED: 'Division is required',
    ROLE_INVALID: 'Role must be either "user" or "admin"',

    SERVICE_NAME_REQUIRED: 'Service name is required',
    SERVICE_DESCRIPTION_REQUIRED: 'Service description is required',
    SERVICE_PRICE_REQUIRED: 'Service price is required',
    SERVICE_PRICE_POSITIVE: 'Service price must be positive',

    ORDER_ITEMS_REQUIRED: 'Order items are required',
    ORDER_TOTAL_REQUIRED: 'Order total is required',
    ORDER_TOTAL_POSITIVE: 'Order total must be positive',

    CART_ITEMS_REQUIRED: 'Cart items are required',
    CART_USER_EMAIL_REQUIRED: 'User email is required for cart',

    REVIEW_RATING_REQUIRED: 'Review rating is required',
    REVIEW_RATING_RANGE: 'Review rating must be between 1 and 5',
    REVIEW_COMMENT_REQUIRED: 'Review comment is required',
    REVIEW_SERVICE_ID_REQUIRED: 'Service ID is required for review'
};

module.exports = {
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    VALIDATION_MESSAGES
}; 