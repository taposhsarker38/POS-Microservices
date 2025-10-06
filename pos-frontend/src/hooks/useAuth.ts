import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';


export function useMe() {
return useQuery(['me'], async () => {
const { data } = await api.get('/auth/me');
return data;
}, { staleTime: 60_000 });
}