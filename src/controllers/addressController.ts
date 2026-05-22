import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/statusCodes';
import { Address } from '../models/address';
import { User } from '../models/user';
import { logger } from '../utils/logger';

const addressController = {
    getMyAddresses: asyncHandler(async (req: Request, res: Response) => {
        const user = await User.findOne({ email: (req as any).user.email });
        if (!user) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'User not found');
        const addresses = await Address.find({ userId: user._id }).sort({
            isDefault: -1,
            createdAt: -1,
        });
        sendSuccessResponse(res, STATUS_CODES.OK, 'Addresses fetched', addresses);
    }),

    addAddress: asyncHandler(async (req: Request, res: Response) => {
        const user = await User.findOne({ email: (req as any).user.email });
        if (!user) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'User not found');

        const { name, phone, addressLine, district, division, postalCode, isDefault } = req.body;
        if (!name || !phone || !addressLine || !district || !division) {
            return sendErrorResponse(
                res,
                STATUS_CODES.BAD_REQUEST,
                'Name, phone, address, district and division are required',
            );
        }

        if (isDefault) {
            await Address.updateMany({ userId: user._id }, { isDefault: false });
        }

        const count = await Address.countDocuments({ userId: user._id });
        const address = await Address.create({
            userId: user._id,
            name,
            phone,
            addressLine,
            district,
            division,
            postalCode,
            isDefault: isDefault || count === 0,
        });

        logger.info(`Address added for ${user.email}`);
        sendSuccessResponse(res, STATUS_CODES.CREATED, 'Address added successfully', address);
    }),

    updateAddress: asyncHandler(async (req: Request, res: Response) => {
        const user = await User.findOne({ email: (req as any).user.email });
        if (!user) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'User not found');

        const address = await Address.findOne({ _id: req.params.id, userId: user._id });
        if (!address) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'Address not found');

        const { name, phone, addressLine, district, division, postalCode, isDefault } = req.body;
        const updateData = {
            name,
            phone,
            addressLine,
            district,
            division,
            postalCode,
            isDefault,
        } as Record<string, unknown>;

        const hasUpdates = Object.values(updateData).some((value) => value !== undefined);
        if (!hasUpdates) {
            return sendErrorResponse(
                res,
                STATUS_CODES.BAD_REQUEST,
                'At least one field must be provided for update',
            );
        }

        if (isDefault) {
            await Address.updateMany({ userId: user._id }, { isDefault: false });
        }

        Object.keys(updateData).forEach((key) => {
            const value = updateData[key];
            if (value !== undefined) {
                (address as any)[key] = value;
            }
        });
        await address.save();

        sendSuccessResponse(res, STATUS_CODES.OK, 'Address updated', address);
    }),

    deleteAddress: asyncHandler(async (req: Request, res: Response) => {
        const user = await User.findOne({ email: (req as any).user.email });
        if (!user) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'User not found');

        const count = await Address.countDocuments({ userId: user._id });
        if (count <= 1) {
            return sendErrorResponse(
                res,
                STATUS_CODES.BAD_REQUEST,
                'Cannot delete your only address',
            );
        }

        const address = await Address.findOneAndDelete({ _id: req.params.id, userId: user._id });
        if (!address) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'Address not found');

        if (address.isDefault) {
            const next = await Address.findOne({ userId: user._id }).sort({ createdAt: -1 });
            if (next) {
                next.isDefault = true;
                await next.save();
            }
        }

        sendSuccessResponse(res, STATUS_CODES.OK, 'Address deleted');
    }),

    setDefault: asyncHandler(async (req: Request, res: Response) => {
        const user = await User.findOne({ email: (req as any).user.email });
        if (!user) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'User not found');

        await Address.updateMany({ userId: user._id }, { isDefault: false });
        const address = await Address.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { isDefault: true },
            { new: true },
        );
        if (!address) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'Address not found');

        sendSuccessResponse(res, STATUS_CODES.OK, 'Default address updated', address);
    }),
};

export default addressController;
