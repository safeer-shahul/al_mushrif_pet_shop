// src/services/admin/categoryService.ts

import { useApiClient, getCsrfToken } from '@/utils/ApiClient';
import { AnyCategory, CategoryIndexResponse } from '@/types/category';

const CATEGORY_API_ENDPOINT = '/admin/categories';

/**
 * Custom hook to encapsulate all Category API operations.
 */
export const useCategoryService = () => {
  const api = useApiClient();

  /**
   * Fetches all Root and Sub Categories for the Admin list.
   */
  const fetchAllCategories = async (): Promise<AnyCategory[]> => {
    try {
      const response = await api.get<CategoryIndexResponse>(CATEGORY_API_ENDPOINT);

      // Handle 204 No Content / Empty Response
      if (response.status === 204 || !response.data) {
        console.log('No categories found (empty response)');
        return [];
      }

      // Safely destructure with defaults for empty arrays
      const { root_categories = [], sub_categories = [] } = response.data || {};

      // Check if the response has the expected structure
      if (!Array.isArray(root_categories) || !Array.isArray(sub_categories)) {
        console.warn('Unexpected API response structure:', response.data);
        return [];
      }

      // Return empty array if both are empty
      if (root_categories.length === 0 && sub_categories.length === 0) {
        console.log('No categories found in database');
        return [];
      }

      // Consolidate and normalize for the frontend type
      const rootCats = root_categories.map(c => ({ 
          ...c, 
          type: 'root' as const,
          display_name: c.cat_name 
      })) as AnyCategory[];

      const subCats = sub_categories.map(c => ({ 
          ...c, 
          type: 'sub' as const,
          display_name: c.sub_cat_name 
      })) as AnyCategory[];

      return [...rootCats, ...subCats];

    } catch (error: any) {
      // Check if it's a 404 or network error
      if (error.response?.status === 404) {
        console.log('Categories endpoint not found');
        return [];
      }
      
      console.error('API Error in fetchAllCategories:', error);
      throw new Error(error.response?.data?.message || 'Failed to load category data from the API.');
    }
  };
  
  /**
   * Fetches a single category (Root or Sub) by ID.
   */
  const fetchCategoryById = async (id: string): Promise<AnyCategory> => {
    try {
        const response = await api.get<{ category: AnyCategory }>(`${CATEGORY_API_ENDPOINT}/${id}`);
        
        if (!response.data?.category) {
            throw new Error('Invalid category response');
        }
        
        // Normalize the category's name fields for consistent frontend use
        const categoryData = response.data.category;
        const normalizedData = {
            ...categoryData,
            cat_name: 'cat_name' in categoryData ? categoryData.cat_name : ('sub_cat_name' in categoryData ? categoryData.sub_cat_name : ''),
        } as AnyCategory;
        
        return normalizedData;
    } catch (error: any) {
        console.error(`API Error in fetchCategoryById for ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to load category details.');
    }
  };

  /**
   * Creates a new Root or Sub Category.
   */
  const createCategory = async (data: any) => {
    try {
      await getCsrfToken();
      const response = await api.post(CATEGORY_API_ENDPOINT, data);
      return response.data;
    } catch (error: any) {
      console.error('API Error in createCategory:', error);
      throw new Error(error.response?.data?.message || 'Failed to create category.');
    }
  };
  
  /**
   * Updates an existing Category.
   */
  const updateCategory = async (id: string, data: any) => {
    try {
      await getCsrfToken();
      const response = await api.put(`${CATEGORY_API_ENDPOINT}/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`API Error in updateCategory for ID ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update category.');
    }
  };

  /**
   * Deletes a Category (Root or Sub).
   */
  const deleteCategory = async (id: string) => {
    try {
      await getCsrfToken();
      const response = await api.delete(`${CATEGORY_API_ENDPOINT}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`API Error in deleteCategory for ID ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to delete category.');
    }
  };

  return {
    fetchAllCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};