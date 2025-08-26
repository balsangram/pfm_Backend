import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Order from '../../models/catalog/order.model.js';
import Manager from '../../models/manager/manager.model.js';

// GET /store/orders
// Returns live orders for the store's linked manager
export const getStoreLiveOrders = asyncHandler(async (req, res) => {
  // req.user is a Store document (enforced by verifyRole("store"))
  const storeId = req.user._id;

  // Find the manager associated with this store
  const manager = await Manager.findOne({ store: storeId }).select('_id').lean();
  if (!manager) {
    throw new ApiError(404, 'No manager linked to this store');
  }

  const { status } = req.query;

  const liveStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit'];

  const filter = {
    manager: manager._id,
    status: { $in: liveStatuses },
  };

  if (status && liveStatuses.includes(status)) {
    filter.status = status;
  }

  const liveOrders = await Order.find(filter)
    .populate('deliveryPartner', 'name phone')
    .sort({ isUrgent: -1, createdAt: 1 })
    .select('_id clientName location pincode orderDetails amount status pickedUpBy createdAt isUrgent')
    .lean();

  const ordersByStatus = {
    pending: [],
    confirmed: [],
    preparing: [],
    ready: [],
    picked_up: [],
    in_transit: [],
  };

  liveOrders.forEach((order) => {
    if (ordersByStatus[order.status]) {
      ordersByStatus[order.status].push(order);
    }
  });

  const summary = {
    total: liveOrders.length,
    pending: ordersByStatus.pending.length,
    confirmed: ordersByStatus.confirmed.length,
    preparing: ordersByStatus.preparing.length,
    ready: ordersByStatus.ready.length,
    picked_up: ordersByStatus.picked_up.length,
    in_transit: ordersByStatus.in_transit.length,
    urgent: liveOrders.filter((o) => o.isUrgent).length,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { orders: liveOrders, ordersByStatus, summary, lastUpdated: new Date().toISOString() }, 'Store live orders retrieved successfully'));
});
