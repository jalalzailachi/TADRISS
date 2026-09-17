-- Migration 00021: Optimized aggregations for dashboard analytics

-- Function to get institution stats in a single call (highly efficient)
CREATE OR REPLACE FUNCTION get_institution_stats(p_institution_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_active_students INTEGER;
    v_total_revenue DECIMAL;
    v_avg_attendance DECIMAL;
BEGIN
    -- Count active students
    SELECT COUNT(*) INTO v_active_students 
    FROM profiles 
    WHERE institution_id = p_institution_id AND role = 'student' AND is_active = true;

    -- Sum payments for current month
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
    FROM payments
    WHERE institution_id = p_institution_id 
    AND status = 'completed'
    AND created_at >= date_trunc('month', now());

    -- Calculate attendance rate for last 30 days
    SELECT COALESCE(AVG(CASE WHEN status = 'present' THEN 100 ELSE 0 END), 0) INTO v_avg_attendance
    FROM attendance_records r
    JOIN attendance_sessions s ON r.session_id = s.id
    WHERE s.institution_id = p_institution_id
    AND s.session_date >= now() - INTERVAL '30 days';

    RETURN jsonb_build_object(
        'active_students', v_active_students,
        'monthly_revenue', v_total_revenue,
        'attendance_rate', v_avg_attendance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
