// src/types/order.ts

import { Address } from "./user"; 
import { ProdVariant, Product } from "./product";
import { User } from "./user";

/**
 * Interface for a single item within an Order.
 * Note: Products are linked via the variant.
 */
export interface OrderItem {
    id: string;
    order_id: string;
    prod_variant_id: string;
    quantity: number;
    
    actual_price: number;
    offer_price: number | null;
    offer_id: string | null;
    
    created_at: string;
    updated_at: string;
    
    variant: ProdVariant & { product: Product }; 
}

/**
 * Interface for the main Order model.
 */
export interface Order {
    id: string;
    user_id: string;
    address_id: string;
    
    actual_price: number;      
    discount_price: number;    
    shipping_price: number;    
    payable_price: number;     
    
    status: 'Pending Confirmation' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
    payment_mode: 'COD' | 'Card';
    payment_status: 'Pending' | 'Paid' | 'Failed';
    
    is_paid: boolean;
    is_packed: boolean;
    is_shipped: boolean;
    is_delivered: boolean;
    is_cancelled: boolean;
    
    packed_date: string | null;
    shipped_date: string | null;
    delivered_date: string | null;
    cancel_reason: string | null;
    
    created_at: string;
    updated_at: string;
    user?: User;
    address?: Address;
    items?: OrderItem[];
}