-- Create a new tenant for isolation testing
INSERT INTO tenants (id, name, status, contact_limit)
VALUES ('b0000000-0000-0000-0000-000000000002', 'Gabinete de Teste Isolado', 'ativo', 1000);

-- Update the profile of the regular user to belong to the new tenant
UPDATE profiles
SET tenant_id = 'b0000000-0000-0000-0000-000000000002'
WHERE user_id = '471d1d2d-1f30-4530-9c34-325afb1ce059';

-- Update the user role for the regular user to be associated with the new tenant
UPDATE user_roles
SET tenant_id = 'b0000000-0000-0000-0000-000000000002'
WHERE user_id = '471d1d2d-1f30-4530-9c34-325afb1ce059' AND role = 'admin_gabinete';

-- Create a dummy contact in the new tenant to verify isolation
INSERT INTO contacts (id, name, tenant_id, engagement, registered_by)
VALUES (gen_random_uuid(), 'Eleitor do Gabinete 2', 'b0000000-0000-0000-0000-000000000002', 'nao_trabalhado', '471d1d2d-1f30-4530-9c34-325afb1ce059');