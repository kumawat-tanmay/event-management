const Joi = require('joi');

const createDispatchSchema = Joi.object({
  bookingId: Joi.string().required().messages({
    'string.empty': 'Booking ID is required',
    'any.required': 'Booking ID is required'
  }),
  warehouseId: Joi.string().required().messages({
    'string.empty': 'Warehouse ID is required',
    'any.required': 'Warehouse ID is required'
  }),
  vehicleId: Joi.string().allow('', null).optional(),
  driverId: Joi.string().allow('', null).optional(),
  items: Joi.array().items(
    Joi.object({
      item: Joi.string().required(),
      dispatchedQty: Joi.number().min(0).required().messages({
        'number.min': 'Dispatched quantity cannot be negative',
        'any.required': 'Dispatched quantity is required'
      })
    })
  ).min(1).required().messages({
    'array.min': 'At least one item is required for dispatch',
    'any.required': 'Items are required for dispatch'
  }),
  notes: Joi.string().allow('', null).optional()
});

const createTransferSchema = Joi.object({
  fromWarehouse: Joi.string().required().messages({
    'string.empty': 'Source Warehouse is required',
    'any.required': 'Source Warehouse is required'
  }),
  toWarehouse: Joi.string().required().messages({
    'string.empty': 'Destination Warehouse is required',
    'any.required': 'Destination Warehouse is required'
  }),
  vehicleId: Joi.string().allow('', null).optional(),
  driverId: Joi.string().allow('', null).optional(),
  items: Joi.array().items(
    Joi.object({
      item: Joi.string().required(),
      quantity: Joi.number().min(1).required().messages({
        'number.min': 'Transfer quantity must be at least 1',
        'any.required': 'Transfer quantity is required'
      })
    })
  ).min(1).required().messages({
    'array.min': 'At least one item is required for transfer',
    'any.required': 'Items are required for transfer'
  }),
  notes: Joi.string().allow('', null).optional()
});

module.exports = {
  createDispatchSchema,
  createTransferSchema
};
