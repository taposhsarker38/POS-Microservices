import api from '../axios';
export const companyClient = {
list: async () => (await api.get('/companies')).data,
get: async (id: string) => (await api.get(`/companies/${id}`)).data,
update: async (id: string, payload: any) => (await api.put(`/companies/${id}`, payload)).data,
};