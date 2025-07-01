
-- Add the missing job_seeker role for the current test user
INSERT INTO public.user_roles (user_id, role)
VALUES ('f1c51aae-0e4b-497e-924c-d904ef93cd43', 'job_seeker'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Set their role preference to job_seeker
INSERT INTO public.user_role_preferences (user_id, preferred_role)
VALUES ('f1c51aae-0e4b-497e-924c-d904ef93cd43', 'job_seeker'::app_role)
ON CONFLICT (user_id) DO UPDATE SET preferred_role = 'job_seeker'::app_role;
