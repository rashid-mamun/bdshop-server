import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user';
import { Service } from '../models/services';
import { Order } from '../models/orders';
import Review from '../models/reviews';
import Address from '../models/address';
import Cart from '../models/carts';
import ReturnRequest from '../models/returnRequest';
import StockNotification from '../models/stockNotification';
import Blog from '../models/blogs';
import OurTeam from '../models/ourTeams';
import NewsletterSubscriber from '../models/newsletterSubscriber';
import UploadedAsset from '../models/uploadedAssets';
import { seedProducts } from './seedProducts';
import { newsletterLeads, seedBlogs, seedTeamMembers } from './seedContent';
import { logger } from '../utils/logger';

dotenv.config();

type CustomerProfile = {
    displayName: string;
    email: string;
    phone: string;
    district: string;
    division: string;
    street: string;
    postalCode: string;
};

const customerNames = [
    ['Rahim Uddin', 'Dhaka', 'Dhaka', 'Dhanmondi Road 8A', '1209'],
    ['Nusrat Jahan', 'Chattogram', 'Chattogram', 'GEC Circle, CDA Avenue', '4000'],
    ['Tanvir Hasan', 'Rajshahi', 'Rajshahi', 'Boalia Main Road', '6000'],
    ['Sadia Akter', 'Sylhet', 'Sylhet', 'Zindabazar Road', '3100'],
    ['Fahim Ahmed', 'Khulna', 'Khulna', 'Sonadanga Residential Area', '9000'],
    ['Mehedi Hassan', 'Cumilla', 'Chattogram', 'Kandirpar Main Road', '3500'],
    ['Tasnim Islam', 'Gazipur', 'Dhaka', 'Board Bazar Road', '1704'],
    ['Arif Hossain', 'Narayanganj', 'Dhaka', 'Chashara Link Road', '1400'],
    ['Sumaiya Rahman', 'Barishal', 'Barishal', 'Sadar Road', '8200'],
    ['Sabbir Khan', 'Rangpur', 'Rangpur', 'Dhap Station Road', '5400'],
    ['Jannatul Ferdous', 'Mymensingh', 'Mymensingh', 'Ganginarpar Road', '2200'],
    ['Shakib Mahmud', 'Bogura', 'Rajshahi', 'Jaleshwaritola Road', '5800'],
    ['Maliha Chowdhury', 'Dhaka', 'Dhaka', 'Uttara Sector 7', '1230'],
    ['Imran Kabir', 'Jashore', 'Khulna', 'Rail Road, Jashore Sadar', '7400'],
    ['Raisa Sultana', 'Feni', 'Chattogram', 'Trunk Road', '3900'],
    ['Nafis Iqbal', 'Dhaka', 'Dhaka', 'Mirpur Section 10', '1216'],
    ['Farzana Yasmin', 'Noakhali', 'Chattogram', 'Maijdee Court Road', '3800'],
    ['Rakibul Islam', 'Kushtia', 'Khulna', 'NS Road, Kushtia Sadar', '7000'],
    ['Samira Haque', 'Tangail', 'Dhaka', 'Victoria Road', '1900'],
    ['Adnan Karim', 'Dinajpur', 'Rangpur', 'Goneshtola Road', '5200'],
] as const;

const customers: CustomerProfile[] = customerNames.map(
    ([displayName, district, division, street, postalCode], index) => ({
        displayName,
        email: `customer${String(index + 1).padStart(2, '0')}@seed.bd`,
        phone: `01${[7, 8, 9, 6, 3][index % 5]}${String(11000000 + index).padStart(8, '0')}`,
        district,
        division,
        street,
        postalCode,
    }),
);

const admin = {
    email: 'admin@bdshop.com',
    displayName: 'BDShop Admin',
    password: 'Admin1234!',
    role: 'admin',
    phone: '01711000001',
    district: 'Dhaka',
    division: 'Dhaka',
    isActive: true,
};

const chunk = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};

function reviewRating(productIndex: number, reviewerPosition: number): 3 | 4 | 5 {
    if (productIndex % 11 === 0 && reviewerPosition === 0) return 3;
    if (productIndex % 5 === 0 && reviewerPosition < 2) return 4;
    return reviewerPosition === 1 ? 4 : 5;
}

function reviewContent(
    product: (typeof seedProducts)[number],
    rating: 3 | 4 | 5,
    reviewerPosition: number,
) {
    const titles = {
        5: [
            'Excellent quality and performance',
            'A dependable purchase',
            'Matches the specification',
        ],
        4: ['Very good overall', 'Good value for the price', 'Satisfied after regular use'],
        3: ['Good, with a few trade-offs', 'Works as described', 'Check your needs before buying'],
    };
    const observations = {
        Electronics: [
            `The ${product.config.split(',')[0].trim()} specification has been consistent with the listing during regular use.`,
            'Setup was straightforward, controls are easy to understand, and day-to-day performance has remained stable.',
            `I mainly use it for ${product.tags.slice(0, 2).join(' and ')}, and it has handled that workload reliably.`,
        ],
        Vehicles: [
            `The ${product.config.split(',')[0].trim()} setup feels appropriate for regular commuting and city traffic.`,
            'Riding position, controls and braking response have been predictable during everyday journeys.',
            'Fuel use and comfort have been reasonable so far; authorized servicing availability was an important factor for me.',
        ],
        Accessories: [
            `The ${product.config.split(',')[0].trim()} feature works as described and compatibility was not an issue for my setup.`,
            'Materials and finishing feel appropriate for the price, and the product has held up well in regular use.',
            `I bought it mainly for ${product.tags.slice(0, 2).join(' and ')}, and the practical experience matches the listing.`,
        ],
    };
    const caveat =
        rating === 5
            ? 'Setup was straightforward and the overall experience has met my expectations.'
            : rating === 4
              ? 'There are small compromises, but none have affected normal daily use.'
              : 'The core product works, although buyers should compare the warranty and exact feature set before ordering.';

    return {
        title: titles[rating][reviewerPosition],
        description: `I purchased the ${product.name} ${product.model} after comparing similar options. ${observations[product.category][reviewerPosition]} ${caveat}`,
    };
}

async function clearRelationalCommerceData() {
    await Promise.all([
        ReturnRequest.deleteMany({}),
        StockNotification.deleteMany({}),
        Review.deleteMany({}),
        Order.deleteMany({}),
        Address.deleteMany({}),
        Cart.deleteMany({}),
        UploadedAsset.deleteMany({}),
        NewsletterSubscriber.deleteMany({}),
        Blog.deleteMany({}),
        OurTeam.deleteMany({}),
    ]);
    await Promise.all([User.deleteMany({}), Service.deleteMany({})]);
}

async function seedContentCollections(users: Awaited<ReturnType<typeof seedUsers>>) {
    for (const member of seedTeamMembers) {
        await OurTeam.findOneAndUpdate(
            { name: member.name },
            { $set: member },
            { upsert: true, new: true, runValidators: true },
        );
    }
    for (const blog of seedBlogs) {
        await Blog.findOneAndUpdate(
            { title: blog.title },
            { $set: blog },
            { upsert: true, new: true, runValidators: true },
        );
    }
    for (const [email, source, status] of newsletterLeads) {
        await NewsletterSubscriber.findOneAndUpdate(
            { email },
            { $set: { email, source, status } },
            { upsert: true, new: true, runValidators: true },
        );
    }
    for (let index = 0; index < 8; index += 1) {
        await NewsletterSubscriber.findOneAndUpdate(
            { email: users[index].email },
            {
                $set: {
                    email: users[index].email,
                    source: 'customer-account',
                    status: 'subscribed',
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
    }
}

async function seedUsers() {
    const userInputs = [
        admin,
        ...customers.map((customer) => ({
            ...customer,
            password: 'Test1234!',
            role: 'user',
            isActive: true,
            profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.displayName)}&background=e8f5ee&color=1a8a4a&size=256`,
        })),
    ];

    for (const input of userInputs) {
        const existingUser = await User.findOne({ email: input.email });
        if (!existingUser) {
            // User.create is required so the password hashing middleware runs.
            await User.create(input);
        }
    }

    return User.find({ email: { $in: customers.map((customer) => customer.email) } }).sort({
        email: 1,
    });
}

async function seedCatalog() {
    const products = [];
    for (const product of seedProducts) {
        const saved = await Service.findOneAndUpdate(
            { model: product.model },
            {
                $set: {
                    ...product,
                    img: product.images[0],
                    imgStorage: 'external',
                    averageRating: 0,
                    reviewCount: 0,
                },
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
        products.push(saved);
    }
    return products;
}

async function seedAddressesAndCarts(
    users: Awaited<ReturnType<typeof seedUsers>>,
    products: Awaited<ReturnType<typeof seedCatalog>>,
) {
    for (let index = 0; index < users.length; index += 1) {
        const user = users[index];
        const profile = customers[index];
        await Address.findOneAndUpdate(
            { userId: user._id, name: 'Home' },
            {
                $set: {
                    userId: user._id,
                    name: 'Home',
                    phone: profile.phone,
                    addressLine: profile.street,
                    district: profile.district,
                    division: profile.division,
                    postalCode: profile.postalCode,
                    isDefault: true,
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
        if (index < 6) {
            await Address.findOneAndUpdate(
                { userId: user._id, name: 'Office' },
                {
                    $set: {
                        userId: user._id,
                        name: 'Office',
                        phone: profile.phone,
                        addressLine: `${20 + index}, Commercial Area`,
                        district: profile.district,
                        division: profile.division,
                        postalCode: profile.postalCode,
                        isDefault: false,
                    },
                },
                { upsert: true, new: true, runValidators: true },
            );
        }
    }

    for (let index = 0; index < 12; index += 1) {
        const user = users[index % 8];
        const product = products[(index * 7 + 9) % products.length];
        await Cart.findOneAndUpdate(
            { email: user.email, id: String(product._id) },
            {
                $set: {
                    id: String(product._id),
                    email: user.email,
                    img: product.img,
                    description: product.description,
                    model: `${product.name} ${product.model}`,
                    price: product.price,
                    config: product.config,
                    quantity: 1 + (index % 2),
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
    }
}

async function seedUploadedAssetLedger(products: Awaited<ReturnType<typeof seedCatalog>>) {
    const auditAssets = [
        {
            url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
            publicId: 'sample',
        },
        {
            url: 'https://res.cloudinary.com/demo/image/upload/v1692721301/cld-sample-5.jpg',
            publicId: 'cld-sample-5',
        },
        {
            url: 'https://res.cloudinary.com/demo/image/upload/v1692721300/cld-sample-4.jpg',
            publicId: 'cld-sample-4',
        },
    ];

    for (let index = 0; index < auditAssets.length; index += 1) {
        const asset = auditAssets[index];
        await UploadedAsset.findOneAndUpdate(
            { publicId: asset.publicId },
            {
                $set: {
                    ownerEmail: admin.email,
                    url: asset.url,
                    publicId: asset.publicId,
                    storage: 'cloudinary',
                    status: 'attached',
                    expiresAt: new Date('2099-12-31T23:59:59.000Z'),
                    attachedServiceId: products[index]._id,
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
    }
}

async function seedDeliveredOrders(
    users: Awaited<ReturnType<typeof seedUsers>>,
    products: Awaited<ReturnType<typeof seedCatalog>>,
) {
    const purchasesByUser = users.map(() => [] as typeof products);
    products.forEach((product, productIndex) => {
        [
            productIndex % users.length,
            (productIndex + 7) % users.length,
            (productIndex + 13) % users.length,
        ].forEach((userIndex) => purchasesByUser[userIndex].push(product));
    });

    const orderByPurchase = new Map<string, mongoose.Types.ObjectId>();
    let sequence = 1;

    for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
        const user = users[userIndex];
        const profile = customers[userIndex];
        const orderGroups = chunk(purchasesByUser[userIndex], 3);

        for (let groupIndex = 0; groupIndex < orderGroups.length; groupIndex += 1) {
            const items = orderGroups[groupIndex].map((product) => ({
                serviceId: product._id,
                name: `${product.name} ${product.model}`,
                price: product.price,
                quantity: 1,
            }));
            const subtotal = items.reduce((total, item) => total + item.price, 0);
            const shippingFee = subtotal >= 5000 ? 0 : 120;
            const orderNumber = `BDS-SEED-D-${String(sequence).padStart(4, '0')}`;
            const orderDate = new Date(Date.now() - (45 + ((sequence * 3) % 240)) * 86400000);

            const order = await Order.findOneAndUpdate(
                { orderNumber },
                {
                    $set: {
                        userId: user._id,
                        email: user.email,
                        items,
                        subtotal,
                        shippingFee,
                        tax: 0,
                        discount: 0,
                        total: subtotal + shippingFee,
                        shippingAddress: {
                            fullName: user.displayName,
                            street: profile.street,
                            district: profile.district,
                            division: profile.division,
                            postalCode: profile.postalCode,
                            country: 'Bangladesh',
                            phone: profile.phone,
                        },
                        paymentStatus: 'paid',
                        paymentId: `seed_payment_${String(sequence).padStart(4, '0')}`,
                        status: 'delivered',
                    },
                    $setOnInsert: { createdAt: orderDate },
                },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
            );

            items.forEach((item) => {
                orderByPurchase.set(`${user._id}:${item.serviceId}`, order._id);
            });
            sequence += 1;
        }
    }

    return orderByPurchase;
}

async function seedCurrentOrders(
    users: Awaited<ReturnType<typeof seedUsers>>,
    products: Awaited<ReturnType<typeof seedCatalog>>,
) {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'cancelled'] as const;
    for (let index = 0; index < 10; index += 1) {
        const user = users[index];
        const profile = customers[index];
        const product = products[(index * 9 + 4) % products.length];
        const status = statuses[index % statuses.length];
        const shippingFee = product.price >= 5000 ? 0 : 120;
        await Order.findOneAndUpdate(
            { orderNumber: `BDS-SEED-A-${String(index + 1).padStart(4, '0')}` },
            {
                $set: {
                    userId: user._id,
                    email: user.email,
                    items: [
                        {
                            serviceId: product._id,
                            name: `${product.name} ${product.model}`,
                            price: product.price,
                            quantity: 1,
                        },
                    ],
                    subtotal: product.price,
                    shippingFee,
                    tax: 0,
                    discount: 0,
                    total: product.price + shippingFee,
                    shippingAddress: {
                        fullName: user.displayName,
                        street: profile.street,
                        district: profile.district,
                        division: profile.division,
                        postalCode: profile.postalCode,
                        country: 'Bangladesh',
                        phone: profile.phone,
                    },
                    paymentStatus:
                        status === 'cancelled' ? 'failed' : index % 2 === 0 ? 'paid' : 'pending',
                    paymentId: index % 2 === 0 ? `seed_active_payment_${index + 1}` : undefined,
                    status,
                },
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
    }
}

async function seedVerifiedReviews(
    users: Awaited<ReturnType<typeof seedUsers>>,
    products: Awaited<ReturnType<typeof seedCatalog>>,
    orderByPurchase: Map<string, mongoose.Types.ObjectId>,
) {
    for (let productIndex = 0; productIndex < products.length; productIndex += 1) {
        const product = products[productIndex];
        const source = seedProducts[productIndex];
        const reviewerIndexes = [
            productIndex % users.length,
            (productIndex + 7) % users.length,
            (productIndex + 13) % users.length,
        ];

        for (
            let reviewerPosition = 0;
            reviewerPosition < reviewerIndexes.length;
            reviewerPosition += 1
        ) {
            const user = users[reviewerIndexes[reviewerPosition]];
            const orderId = orderByPurchase.get(`${user._id}:${product._id}`);
            if (!orderId)
                throw new Error(`Missing delivered order for ${user.email} and ${product.model}`);

            const star = reviewRating(productIndex, reviewerPosition);
            const content = reviewContent(source, star, reviewerPosition);
            await Review.findOneAndUpdate(
                { email: user.email, serviceId: product._id },
                {
                    $set: {
                        userId: user._id,
                        orderId,
                        name: user.displayName,
                        email: user.email,
                        serviceId: product._id,
                        title: content.title,
                        img: user.profileImage,
                        description: content.description,
                        star,
                        verifiedPurchase: true,
                        date: new Date(
                            Date.now() -
                                (20 + ((productIndex * 5 + reviewerPosition) % 180)) * 86400000,
                        ),
                    },
                },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
            );
        }
    }
}

async function synchronizeRatings() {
    const aggregates = await Review.aggregate([
        {
            $group: {
                _id: '$serviceId',
                averageRating: { $avg: '$star' },
                reviewCount: { $sum: 1 },
            },
        },
    ]);
    await Service.updateMany({}, { $set: { averageRating: 0, reviewCount: 0 } });
    if (aggregates.length > 0) {
        await Service.bulkWrite(
            aggregates.map((entry) => ({
                updateOne: {
                    filter: { _id: entry._id },
                    update: {
                        $set: {
                            averageRating: Math.round(entry.averageRating * 10) / 10,
                            reviewCount: entry.reviewCount,
                        },
                    },
                },
            })),
        );
    }
}

async function seedReturnsAndNotifications(
    users: Awaited<ReturnType<typeof seedUsers>>,
    products: Awaited<ReturnType<typeof seedCatalog>>,
) {
    const returnStatuses = ['submitted', 'reviewing', 'approved', 'rejected', 'refunded'] as const;
    const reasons = ['damaged', 'wrong', 'not_described', 'changed_mind', 'other'] as const;
    const deliveredOrders = await Order.find({ orderNumber: /^BDS-SEED-D-/ })
        .sort({ orderNumber: 1 })
        .limit(5);

    for (let index = 0; index < deliveredOrders.length; index += 1) {
        const order = deliveredOrders[index];
        await ReturnRequest.findOneAndUpdate(
            { orderId: order._id, email: order.email },
            {
                $set: {
                    orderId: order._id,
                    email: order.email,
                    itemScope: index % 2 === 0 ? 'specific_items' : 'entire_order',
                    reason: reasons[index],
                    details: [
                        'The outer package was intact, but one item had visible damage after opening. Photos and an unboxing video are available.',
                        'The delivered model does not match the model shown on the invoice and order details.',
                        'A listed feature is not available on the delivered unit; requesting verification and resolution.',
                        'The unopened item is no longer required. All original packaging and accessories are available.',
                        'The product develops an intermittent fault during normal use and needs inspection.',
                    ][index],
                    status: returnStatuses[index],
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
    }

    const outOfStockProducts = products.slice(-3);
    await Service.updateMany(
        { _id: { $in: outOfStockProducts.map((product) => product._id) } },
        { $set: { stock: 0 } },
    );
    for (let index = 0; index < outOfStockProducts.length; index += 1) {
        const product = outOfStockProducts[index];
        for (let subscriber = 0; subscriber < 2; subscriber += 1) {
            const user = users[(index * 3 + subscriber) % users.length];
            await StockNotification.findOneAndUpdate(
                { email: user.email, serviceId: product._id, status: 'pending' },
                { $set: { email: user.email, serviceId: product._id, status: 'pending' } },
                { upsert: true, new: true, runValidators: true },
            );
        }
    }
}

async function verifyRelations(products: Awaited<ReturnType<typeof seedCatalog>>) {
    const reviews = await Review.find({ verifiedPurchase: true }).lean();
    const orderIds = [...new Set(reviews.map((review) => String(review.orderId)))];
    const orders = await Order.find({ _id: { $in: orderIds }, status: 'delivered' }).lean();
    const orderMap = new Map(orders.map((order) => [String(order._id), order]));

    const invalidReview = reviews.find((review) => {
        const order = orderMap.get(String(review.orderId));
        return (
            !review.userId ||
            !order ||
            String(order.userId) !== String(review.userId) ||
            !order.items.some((item) => String(item.serviceId) === String(review.serviceId))
        );
    });
    if (invalidReview)
        throw new Error(`Review relation validation failed for ${invalidReview._id}`);

    const unsynchronizedProduct = await Service.findOne({
        _id: { $in: products.map((product) => product._id) },
        $or: [{ reviewCount: { $ne: 3 } }, { averageRating: { $lte: 0 } }],
    });
    if (unsynchronizedProduct) {
        throw new Error(`Rating synchronization failed for ${unsynchronizedProduct.model}`);
    }
}

type SeedOptions = { fresh?: boolean; uri?: string };

export async function runSeed(options: SeedOptions = {}) {
    const isFresh = options.fresh ?? process.argv.includes('--fresh');
    const uri = options.uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bdshop';

    try {
        await mongoose.connect(uri);
        logger.info('Connected to MongoDB');

        if (isFresh) {
            logger.info('Removing existing relational commerce data');
            await clearRelationalCommerceData();
        }

        const users = await seedUsers();
        const products = await seedCatalog();
        await seedAddressesAndCarts(users, products);
        await seedContentCollections(users);
        const orderByPurchase = await seedDeliveredOrders(users, products);
        await seedCurrentOrders(users, products);
        await seedVerifiedReviews(users, products, orderByPurchase);
        await synchronizeRatings();
        await seedReturnsAndNotifications(users, products);
        await seedUploadedAssetLedger(products);
        await verifyRelations(products);

        const summary = {
            products: products.length,
            customers: users.length,
            orders: await Order.countDocuments({ orderNumber: /^BDS-SEED-/ }),
            reviews: await Review.countDocuments({ verifiedPurchase: true }),
            purchasedItems: orderByPurchase.size,
            addresses: await Address.countDocuments({}),
            carts: await Cart.countDocuments({}),
            blogs: await Blog.countDocuments({}),
            teamMembers: await OurTeam.countDocuments({}),
            newsletterSubscribers: await NewsletterSubscriber.countDocuments({}),
            returnRequests: await ReturnRequest.countDocuments({}),
            stockNotifications: await StockNotification.countDocuments({}),
            uploadedAssets: await UploadedAsset.countDocuments({}),
        };
        logger.info(`Relational seed completed: ${JSON.stringify(summary)}`);
        return summary;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    void runSeed().catch((error) => {
        logger.error('Seeding failed', error);
        process.exitCode = 1;
    });
}
