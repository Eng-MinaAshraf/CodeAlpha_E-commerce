/**
 * @fileoverview Supabase initialization module
 * @description تهيئة Supabase وتصدير العميل للواجهة الأمامية
 * @module supabase
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm';

const supabaseUrl = 'https://ebpscvuzeqlatbklqkwo.supabase.co';
const supabaseAnonKey = 'sb_publishable_evHGKFvrUqhOk1uR8rK47g_Se6qOeew';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
