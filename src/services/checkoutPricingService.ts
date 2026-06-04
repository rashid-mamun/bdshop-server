import Service from '../models/services';

type CheckoutItemInput = {
    serviceId?: string;
    quantity?: number;
};

type NormalizedCheckoutItem = {
    serviceId: any;
    name: string;
    price: number;
    quantity: number;
    stock: number;
};

const SHIPPING_RATE = 120;
const TAX_RATE = 0;
const COUPONS: Record<string, number> = {
    BDSHOP10: 0.1,
    SAVE20: 0.2,
    NEWUSER15: 0.15,
};

const normalizeCouponCode = (couponCode?: string) => couponCode?.trim().toUpperCase() || '';

export const normalizeCheckoutItems = async (
    items: CheckoutItemInput[],
): Promise<NormalizedCheckoutItem[]> => {
    if (!Array.isArray(items) || items.length === 0) {
        const error = new Error('Items must be a non-empty array');
        error.name = 'ValidationError';
        throw error;
    }

    return Promise.all(
        items.map(async (item) => {
            if (!item?.serviceId) {
                const error = new Error('Service ID is required');
                error.name = 'ValidationError';
                throw error;
            }

            const quantity = Number(item.quantity);
            if (!Number.isFinite(quantity) || quantity < 1) {
                const error = new Error('Item quantity must be at least 1');
                error.name = 'ValidationError';
                throw error;
            }

            const service = await Service.findById(item.serviceId);
            if (!service) {
                const error = new Error('Service not found');
                error.name = 'NotFoundError';
                throw error;
            }

            if (service.stock < quantity) {
                const error = new Error(`Only ${service.stock} item(s) left for ${service.name}`);
                error.name = 'ValidationError';
                throw error;
            }

            return {
                serviceId: service._id,
                name: service.name,
                price: service.price,
                quantity,
                stock: service.stock,
            };
        }),
    );
};

export const calculateCheckoutTotals = (
    items: Pick<NormalizedCheckoutItem, 'price' | 'quantity'>[],
    couponCode?: string,
) => {
    const normalizedCouponCode = normalizeCouponCode(couponCode);
    const discountRate = COUPONS[normalizedCouponCode] || 0;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.round(subtotal * discountRate);
    const taxableTotal = subtotal - discount;
    const tax = Math.round(taxableTotal * TAX_RATE);
    const shippingFee = subtotal > 0 ? SHIPPING_RATE : 0;
    const total = Math.max(0, taxableTotal + tax + shippingFee);

    return {
        subtotal,
        discount,
        discountRate,
        couponCode: discountRate > 0 ? normalizedCouponCode : '',
        couponValid: Boolean(discountRate),
        shippingFee,
        tax,
        total,
    };
};

export const buildCheckoutQuote = async (items: CheckoutItemInput[], couponCode?: string) => {
    const normalizedItems = await normalizeCheckoutItems(items);
    const totals = calculateCheckoutTotals(normalizedItems, couponCode);

    return {
        items: normalizedItems.map(({ stock, ...item }) => item),
        totals,
    };
};
