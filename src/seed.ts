import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/user';
import { Service } from './models/services';
import { logger } from './utils/logger';

dotenv.config();

const users = [
    {
        email: 'admin@bdshop.com',
        displayName: 'Admin User',
        password: 'Admin1234!',
        role: 'admin',
        phone: '01700000000',
        district: 'Dhaka',
        division: 'Dhaka',
        isActive: true,
    },
    {
        email: 'rahim@gmail.com',
        displayName: 'Rahim Islam',
        password: 'Test1234!',
        role: 'user',
        phone: '01800000000',
        district: 'Dhaka',
        division: 'Dhaka',
        isActive: true,
    },
    {
        email: 'karim@gmail.com',
        displayName: 'Karim Rahman',
        password: 'Test1234!',
        role: 'user',
        phone: '01900000000',
        district: 'Chittagong',
        division: 'Chittagong',
        isActive: true,
    },
];

const products = [
    {
        name: 'Samsung',
        model: 'Galaxy S24 Ultra',
        category: 'Electronics',
        price: 129999,
        originalPrice: 159999,
        stock: 45,
        description:
            'The ultimate smartphone with advanced AI features, a built-in S Pen, and an incredible quad-camera system. Perfect for power users and creators.',
        config: '12GB RAM, 512GB Storage',
        madeIn: 'Vietnam',
        images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.9,
        reviewCount: 340,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: true,
        tags: ['smartphone', 'flagship'],
    },
    {
        name: 'Apple',
        model: 'iPhone 15 Pro',
        category: 'Electronics',
        price: 149999,
        originalPrice: 169999,
        stock: 30,
        description:
            'Forged in titanium and featuring the groundbreaking A17 Pro chip. Experience next-level gaming and professional-grade photography.',
        config: '8GB RAM, 256GB Storage',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.8,
        reviewCount: 280,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: true,
        tags: ['smartphone', 'apple'],
    },
    {
        name: 'Apple',
        model: 'MacBook Air M2',
        category: 'Electronics',
        price: 139999,
        originalPrice: 154999,
        stock: 25,
        description:
            'Supercharged by M2. Strikingly thin and fast so you can work, play, or create anywhere. Features an all-day battery life.',
        config: '8GB RAM, 256GB SSD',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.9,
        reviewCount: 150,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['laptop', 'apple'],
    },
    {
        name: 'Sony',
        model: 'WH-1000XM5 Headphones',
        category: 'Electronics',
        price: 34999,
        originalPrice: 42999,
        stock: 60,
        description:
            'Industry-leading noise cancellation headphones. Magnificent sound, crystal clear hands-free calling, and up to 30 hours of battery life.',
        config: 'Wireless, Noise Cancelling',
        madeIn: 'Malaysia',
        images: [
            'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.7,
        reviewCount: 210,
        isFeatured: false,
        isFlashDeal: true,
        discountPercent: 18,
        isNewArrival: false,
        tags: ['audio', 'headphones'],
    },
    {
        name: 'Samsung',
        model: '65" QLED 4K Smart TV',
        category: 'Electronics',
        price: 189999,
        originalPrice: 229999,
        stock: 15,
        description:
            'Billion stay-true shades of breathtaking color. Quantum Processor 4K ensures you always get full 4K resolution.',
        config: '65 inch, QLED 4K',
        madeIn: 'Vietnam',
        images: [
            'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.8,
        reviewCount: 85,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['tv', 'home-appliance'],
    },
    {
        name: 'Dell',
        model: 'XPS 15 Laptop',
        category: 'Electronics',
        price: 119999,
        originalPrice: 139999,
        stock: 20,
        description:
            'The perfect balance of power and portability. Stunning InfinityEdge display and 13th Gen Intel Core processors.',
        config: 'Core i7, 16GB RAM, 512GB SSD',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.6,
        reviewCount: 95,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['laptop', 'windows'],
    },
    {
        name: 'Apple',
        model: 'iPad Pro 12.9"',
        category: 'Electronics',
        price: 99999,
        originalPrice: 119999,
        stock: 40,
        description:
            'The ultimate iPad experience. Astonishing performance, incredibly advanced displays, and superfast wireless connectivity.',
        config: 'M2 Chip, 128GB',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.9,
        reviewCount: 112,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['tablet', 'apple'],
    },
    {
        name: 'Canon',
        model: 'EOS R50 Camera',
        category: 'Electronics',
        price: 74999,
        originalPrice: 89999,
        stock: 12,
        description:
            'Compact, lightweight, and perfect for content creators. Shoot spectacular 4K video and high-resolution stills.',
        config: 'Body + 18-45mm Lens',
        madeIn: 'Japan',
        images: [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.5,
        reviewCount: 65,
        isFeatured: false,
        isFlashDeal: true,
        discountPercent: 16,
        isNewArrival: false,
        tags: ['camera', 'photography'],
    },
    {
        name: 'JBL',
        model: 'Flip 6 Speaker',
        category: 'Electronics',
        price: 12999,
        originalPrice: 15999,
        stock: 100,
        description:
            'Bold JBL Original Pro Sound. IP67 waterproof and dustproof, so you can bring your speaker anywhere.',
        config: 'Bluetooth, Waterproof',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.7,
        reviewCount: 320,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['audio', 'speaker'],
    },
    {
        name: 'Xiaomi',
        model: 'Smart Watch Pro',
        category: 'Electronics',
        price: 8999,
        originalPrice: 11999,
        stock: 150,
        description:
            'Your ultimate fitness companion. Features heart rate tracking, SpO2 monitoring, and 14-day battery life.',
        config: 'AMOLED Display',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.3,
        reviewCount: 180,
        isFeatured: false,
        isFlashDeal: true,
        discountPercent: 25,
        isNewArrival: false,
        tags: ['wearable', 'smartwatch'],
    },

    {
        name: 'Honda',
        model: 'CB Hornet 160R',
        category: 'Vehicles',
        price: 229999,
        originalPrice: 249999,
        stock: 5,
        description:
            'Raw, real, and ripped. The CB Hornet 160R is built for the street fighter in you. Aggressive styling with a powerful 160cc engine.',
        config: '162.7cc, ABS',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1558981033-0f0309284409?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.6,
        reviewCount: 120,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['bike', 'motorcycle'],
    },
    {
        name: 'Yamaha',
        model: 'FZS V3',
        category: 'Vehicles',
        price: 219999,
        originalPrice: 239999,
        stock: 8,
        description:
            'The Lord of the Streets. Features a muscular design, comfortable riding posture, and excellent fuel efficiency.',
        config: '149cc, FI',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.5,
        reviewCount: 150,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['bike', 'motorcycle'],
    },
    {
        name: 'Bajaj',
        model: 'Pulsar NS200',
        category: 'Vehicles',
        price: 259999,
        originalPrice: 289999,
        stock: 4,
        description:
            'Naked sports aggressiveness combined with liquid-cooled performance. The ultimate thrill machine.',
        config: '199.5cc, Liquid Cooled',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.7,
        reviewCount: 95,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['bike', 'sports'],
    },
    {
        name: 'TVS',
        model: 'Apache RTR 160',
        category: 'Vehicles',
        price: 199999,
        originalPrice: 219999,
        stock: 12,
        description:
            'Race-derived performance. Features SmartXonnect technology and aggressive street fighter styling.',
        config: '159.7cc, 4V',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.4,
        reviewCount: 210,
        isFeatured: false,
        isFlashDeal: true,
        discountPercent: 9,
        isNewArrival: false,
        tags: ['bike', 'motorcycle'],
    },
    {
        name: 'Hero',
        model: 'Hunk 150R',
        category: 'Vehicles',
        price: 179999,
        originalPrice: 195999,
        stock: 15,
        description:
            'The muscular legend returns. Reliable performance, comfortable seating, and robust build quality.',
        config: '149.2cc',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1498887960847-2a5e46312788?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.2,
        reviewCount: 85,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['bike', 'motorcycle'],
    },
    {
        name: 'Suzuki',
        model: 'Gixxer SF',
        category: 'Vehicles',
        price: 239999,
        originalPrice: 259999,
        stock: 6,
        description:
            'Born of greatness. Fully faired sports bike with aerodynamic design and thrilling performance.',
        config: '155cc, FI, ABS',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1614165936126-2ed18e471b3b?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.6,
        reviewCount: 130,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['bike', 'sports'],
    },
    {
        name: 'Royal Enfield',
        model: 'Meteor 350',
        category: 'Vehicles',
        price: 449999,
        originalPrice: 489999,
        stock: 3,
        description:
            'Cruise easy. The Meteor represents the eternal essence of riding, the spirit of the cruise.',
        config: '349cc, Cruiser',
        madeIn: 'India',
        images: [
            'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.8,
        reviewCount: 45,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: true,
        tags: ['bike', 'cruiser'],
    },
    {
        name: 'KTM',
        model: 'Duke 200',
        category: 'Vehicles',
        price: 349999,
        originalPrice: 379999,
        stock: 5,
        description:
            'Lightweight, powerful, and packed with cutting-edge technology. The ultimate street brawler.',
        config: '199.5cc, Liquid Cooled',
        madeIn: 'Austria',
        images: [
            'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.9,
        reviewCount: 88,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['bike', 'naked'],
    },

    {
        name: 'Generic',
        model: 'Premium Leather Wallet',
        category: 'Accessories',
        price: 2499,
        originalPrice: 3299,
        stock: 120,
        description:
            'Handcrafted genuine leather wallet with RFID blocking technology. Slim design fits perfectly in any pocket.',
        config: 'Genuine Leather, 8 Card Slots',
        madeIn: 'Bangladesh',
        images: [
            'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.5,
        reviewCount: 56,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['wallet', 'leather'],
    },
    {
        name: 'Ray-Ban',
        model: 'Aviator Sunglasses',
        category: 'Accessories',
        price: 3999,
        originalPrice: 5499,
        stock: 45,
        description:
            'Classic aviator styling with exceptional quality, performance, and comfort. 100% UV protection.',
        config: 'Polarized, Metal Frame',
        madeIn: 'Italy',
        images: [
            'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.7,
        reviewCount: 110,
        isFeatured: false,
        isFlashDeal: true,
        discountPercent: 27,
        isNewArrival: false,
        tags: ['sunglasses', 'fashion'],
    },
    {
        name: 'Generic',
        model: 'Smartwatch Silicon Band Set',
        category: 'Accessories',
        price: 1299,
        originalPrice: 1999,
        stock: 200,
        description:
            'Set of 3 colorful, breathable silicone replacement bands for 22mm smartwatches. Perfect for sports and daily wear.',
        config: '3-Pack, 22mm',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.1,
        reviewCount: 89,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['watchband', 'accessories'],
    },
    {
        name: 'Arctic Hunter',
        model: 'Waterproof Laptop Backpack',
        category: 'Accessories',
        price: 4999,
        originalPrice: 5999,
        stock: 35,
        description:
            'Durable, water-resistant backpack with dedicated compartments for a 15.6" laptop and tablet. Built-in USB charging port.',
        config: '15.6" Laptop, Waterproof',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.8,
        reviewCount: 140,
        isFeatured: true,
        isFlashDeal: false,
        isNewArrival: true,
        tags: ['bag', 'backpack'],
    },
    {
        name: 'Spigen',
        model: 'iPhone 15 Case Pack',
        category: 'Accessories',
        price: 999,
        originalPrice: 1499,
        stock: 150,
        description:
            'Ultra-thin, crystal clear cases that protect your phone while showing off its original color. Includes 3 pieces.',
        config: 'Clear TPU, 3pcs',
        madeIn: 'South Korea',
        images: [
            'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.6,
        reviewCount: 220,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['case', 'iphone'],
    },
    {
        name: 'Anker',
        model: '65W Wireless Charging Pad',
        category: 'Accessories',
        price: 3499,
        originalPrice: 4599,
        stock: 80,
        description:
            'High-speed wireless charging pad. Compatible with all Qi-enabled devices. Sleek aluminum design.',
        config: '65W Fast Charge',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.7,
        reviewCount: 95,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['charger', 'wireless'],
    },
    {
        name: 'Baseus',
        model: '7-in-1 USB-C Hub',
        category: 'Accessories',
        price: 4299,
        originalPrice: 5499,
        stock: 50,
        description:
            'Expand your laptop capabilities with 4K HDMI, 3 USB 3.0 ports, SD/TF card readers, and 100W PD charging.',
        config: 'USB-C, 7 Ports',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.8,
        reviewCount: 160,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['hub', 'usb-c'],
    },
    {
        name: 'Soundcore',
        model: 'TWS Bluetooth Earbuds Pro',
        category: 'Accessories',
        price: 5999,
        originalPrice: 7999,
        stock: 110,
        description:
            'True wireless earbuds with active noise cancellation, custom EQ, and 32-hour playtime with the charging case.',
        config: 'ANC, Bluetooth 5.2',
        madeIn: 'China',
        images: [
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
        ],
        rating: 4.9,
        reviewCount: 310,
        isFeatured: false,
        isFlashDeal: false,
        isNewArrival: false,
        tags: ['audio', 'earbuds'],
    },
];

async function seed() {
    const isFresh = process.argv.includes('--fresh');
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bdshop';

    try {
        await mongoose.connect(uri);
        logger.info('📦 Connected to MongoDB');

        if (isFresh) {
            logger.info('🧹 Dropping existing collections...');
            await User.deleteMany({});
            await Service.deleteMany({});
        }

        logger.info('👤 Seeding users...');
        for (const u of users) {
            const existing = await User.findOne({ email: u.email });
            if (!existing) {
                await User.create(u);
            }
        }

        logger.info('🛍️ Seeding products...');
        for (const p of products) {
            const productData = {
                ...p,
                averageRating: p.rating,
            };
            const existing = await Service.findOne({ model: p.model });
            if (!existing) {
                await Service.create({
                    ...productData,
                    img: p.images[0],
                });
            }
        }

        logger.info('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
