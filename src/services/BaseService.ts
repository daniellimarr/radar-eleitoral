import { supabase } from "@/integrations/supabase/client";
import { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";

export class BaseService {
  protected static async handleResponse<T>(promise: Promise<PostgrestResponse<T>>) {
    const { data, error, count } = await promise;
    if (error) {
      console.error("Service Error:", error);
      return { data: null, error, count };
    }
    return { data, error: null, count };
  }

  protected static getClient() {
    return supabase;
  }
}
