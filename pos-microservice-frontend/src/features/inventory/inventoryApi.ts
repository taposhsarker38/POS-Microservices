import api from '../../lib/api'
export async function reserveStock(payload:any){
  return api.post(`${process.env.NEXT_PUBLIC_INVENTORY_URL}/api/v1/stock/reserve/`, payload)
}
export async function listProducts(){
  return api.get(`${process.env.NEXT_PUBLIC_INVENTORY_URL}/api/v1/products/`)
}
