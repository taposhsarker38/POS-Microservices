import api from '../axios';
export const inventoryClient = {
list: async () => (await api.get('/inventory')).data,
adjust: async (id: string, qty: number) => (await api.post(`/inventory/${id}/adjust`, { qty })).data,
};