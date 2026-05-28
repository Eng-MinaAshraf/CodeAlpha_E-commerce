-- ========================================================
-- جدول طلبات استعادة كلمة المرور لموظفي التوصيل
-- Password Recovery Requests for Delivery Staff
-- ========================================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS password_recovery_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES delivery_staff(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    agent_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    viewed BOOLEAN DEFAULT FALSE
);

-- إضافة فهارس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_password_recovery_requests_agent_id ON password_recovery_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_password_recovery_requests_status ON password_recovery_requests(status);
