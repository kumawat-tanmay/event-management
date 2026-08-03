import apiClient from '../apiClient';

export interface SiteReceiptPayload {
  bookingId: string;
  dispatchId?: string;
  materialCondition?: 'OK' | 'Damaged' | 'Shortage';
  remarks?: string;
  supervisorName?: string;
  photos?: (File | string)[];
}

export interface SiteVerificationPayload {
  bookingId: string;
  remarks?: string;
  photos?: (File | string)[];
  supervisorName?: string;
}

export interface ReturnSettlePayload {
  bookingId: string;
  warehouseId?: string;
  remarks?: string;
  supervisorName?: string;
  photos?: (File | string)[];
  returnItems: Array<{
    item: string;
    name: string;
    code?: string;
    requestedQty: number;
    dispatchedQty: number;
    returnedGoodQty: number;
    returnedDamagedQty: number;
    missingQty: number;
  }>;
}

export const eventExecutionService = {
  getExecutions: async (type?: string) => {
    const response = await apiClient.get('/event-execution', { params: { type } });
    return response.data;
  },

  getExecutionsByBooking: async (bookingId: string) => {
    const response = await apiClient.get(`/event-execution/booking/${bookingId}`);
    return response.data;
  },

  createSiteReceipt: async (payload: SiteReceiptPayload) => {
    const formData = new FormData();
    formData.append('bookingId', payload.bookingId);
    if (payload.dispatchId) formData.append('dispatchId', payload.dispatchId);
    if (payload.materialCondition) formData.append('materialCondition', payload.materialCondition);
    if (payload.remarks) formData.append('remarks', payload.remarks);
    if (payload.supervisorName) formData.append('supervisorName', payload.supervisorName);

    const existingPhotos: string[] = [];
    if (payload.photos) {
      payload.photos.forEach(photo => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        } else if (typeof photo === 'string') {
          existingPhotos.push(photo);
        }
      });
    }
    if (existingPhotos.length > 0) {
      formData.append('existingPhotos', JSON.stringify(existingPhotos));
    }

    const response = await apiClient.post('/event-execution/site-receipt', formData);
    return response.data;
  },

  createSiteVerification: async (payload: SiteVerificationPayload) => {
    const formData = new FormData();
    formData.append('bookingId', payload.bookingId);
    if (payload.remarks) formData.append('remarks', payload.remarks);
    if (payload.supervisorName) formData.append('supervisorName', payload.supervisorName);

    const existingPhotos: string[] = [];
    if (payload.photos) {
      payload.photos.forEach(photo => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        } else if (typeof photo === 'string') {
          existingPhotos.push(photo);
        }
      });
    }
    if (existingPhotos.length > 0) {
      formData.append('existingPhotos', JSON.stringify(existingPhotos));
    }

    const response = await apiClient.post('/event-execution/site-verification', formData);
    return response.data;
  },

  submitReturnAndSettle: async (payload: ReturnSettlePayload) => {
    const formData = new FormData();
    formData.append('bookingId', payload.bookingId);
    if (payload.warehouseId) formData.append('warehouseId', payload.warehouseId);
    if (payload.remarks) formData.append('remarks', payload.remarks);
    if (payload.supervisorName) formData.append('supervisorName', payload.supervisorName);
    formData.append('returnItems', JSON.stringify(payload.returnItems));

    const existingPhotos: string[] = [];
    if (payload.photos) {
      payload.photos.forEach(photo => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        } else if (typeof photo === 'string') {
          existingPhotos.push(photo);
        }
      });
    }
    if (existingPhotos.length > 0) {
      formData.append('existingPhotos', JSON.stringify(existingPhotos));
    }

    const response = await apiClient.post('/event-execution/return-settle', formData);
    return response.data;
  },
};
