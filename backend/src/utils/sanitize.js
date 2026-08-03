/**
 * Helper to sanitize empty ObjectId fields to prevent Mongoose cast errors
 * Removes fields if they are empty strings or null.
 * 
 * @param {Object} body The request body payload
 * @param {Array<string>} fields List of fields to sanitize (e.g., ['customer', 'quotation'])
 * @returns {Object} Sanitized payload
 */
const sanitizePayload = (body, fields = ['customer', 'quotation', 'assignedSupervisor']) => {
  const payload = { ...body };
  fields.forEach(field => {
    if (payload[field] === '' || payload[field] === null) {
      delete payload[field];
    }
  });
  return payload;
};

module.exports = { sanitizePayload };
