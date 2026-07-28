import apiClient from '../apiClient';

export interface LockPayload {
  itemId: string;
  warehouseId: string;
  qty: number;
}

export const reservationService = {
  getAllReservations: async () => {
    const response = await apiClient.get('/reservations');
    return response.data.data;
  },

  getReservationByBookingId: async (bookingId: string) => {
    const response = await apiClient.get(`/reservations/booking/${bookingId}`);
    return response.data.data;
  },

  createReservation: async (bookingId: string) => {
    const response = await apiClient.post('/reservations', { bookingId });
    return response.data;
  },

  suggestSplit: async (reservationId: string) => {
    const response = await apiClient.post('/reservations/suggest-split', { reservationId });
    return response.data.data; // array of suggestions
  },

  lockStock: async (reservationId: string, locks: LockPayload[]) => {
    const response = await apiClient.post(`/reservations/${reservationId}/lock`, { locks });
    return response.data;
  },

  releaseStock: async (reservationId: string) => {
    const response = await apiClient.post(`/reservations/${reservationId}/release`);
    return response.data;
  }
};
