const LogManagement = require('../models/logsManagement');

exports.createLog = async (logData) => {
    return await LogManagement.create(logData);
};

exports.getAllLogs = async (page, limit, startDate, endDate) => {
    const skip = (page - 1) * limit;

    const filter = {};
    if (startDate && endDate) {
        filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate).setHours(23, 59, 59, 999) };
    } else if (startDate) {
        filter.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
        filter.timestamp = { $lte: new Date(endDate).setHours(23, 59, 59, 999) };
    }

    const logs = await LogManagement.find(filter)
        .populate({ path: "customerId", select: "display_name contact_number email mobile" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    const totalLogs = await LogManagement.countDocuments(filter);

    return { totalLogs, logs };
};


exports.getLogsByCustomer = async (customerId, page, limit) => {
    const skip = (page - 1) * limit;

    const logs = await LogManagement.find({ customerId })
        .populate({ path: "customerId", select: "display_name contact_number email mobile" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    const totalCustomer = await LogManagement.countDocuments({ customerId });

    return { totalCustomer, logs };
};

// exports.getLogsByProduct = async (productId, page, limit, startDate, endDate) => {
//     const skip = (page - 1) * limit;

//     const filter = {
//         products: productId,
//     };

//     if (startDate && endDate) {
//         filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate).setHours(23, 59, 59, 999) };
//     } else if (startDate) {
//         filter.timestamp = { $gte: new Date(startDate) };
//     } else if (endDate) {
//         filter.timestamp = { $lte: new Date(endDate).setHours(23, 59, 59, 999) };
//     }

//     const logs = await LogManagement.find(filter)
//         .populate({ path: "customerId", select: "display_name contact_number email mobile" })
//         .populate({ path: "userId", select: "user_name mobile_number" })
//         .populate({ path: "products", select: "productCode" })
//         .sort({ timestamp: -1 })
//         .skip(skip)
//         .limit(limit);

//     const totalProducts = await LogManagement.countDocuments(filter);

//     return { totalProducts, logs };
// };

exports.getLogsByProduct = async (productId, startDate, endDate) => {
    const filter = {
        products: productId,
    };

    if (startDate && endDate) {
        filter.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate).setHours(23, 59, 59, 999),
        };
    } else if (startDate) {
        filter.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
        filter.timestamp = {
            $lte: new Date(endDate).setHours(23, 59, 59, 999),
        };
    }

    const logs = await LogManagement.find(filter)
        .populate({ path: "customerId", select: "display_name contact_number email mobile" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 });

    return { total: logs.length, logs };
};



exports.getLogsByUser = async (userId, page, limit) => {
    const skip = (page - 1) * limit;

    const logs = await LogManagement.find({ userId })
        .populate({ path: "customerId", select: "display_name contact_number email mobile" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    const totalUsers = await LogManagement.countDocuments({ userId });

    return { totalUsers, logs };
};
