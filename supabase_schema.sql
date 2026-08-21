-- ReviveX Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your database tables, triggers, and RLS policies.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. COMPANIES TABLE
create table if not exists public.companies (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    contact_person text,
    mobile_number text,
    email text,
    location text,
    gst_number text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. PROFILES TABLE (Linked to Supabase auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    role text not null default 'client_user' check (role in (
        'super_admin',
        'operations_executive',
        'client_relationship_executive',
        'field_executive',
        'repair_technical_executive',
        'accounts_inventory_executive',
        'client_user'
    )),
    company_id uuid references public.companies(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. REQUESTS TABLE
create table if not exists public.requests (
    id uuid default uuid_generate_v4() primary key,
    company_id uuid references public.companies(id) on delete cascade not null,
    client_user_id uuid references public.profiles(id) on delete set null,
    request_type text not null check (request_type in (
        'e_waste_disposal',
        'scrap_collection',
        'tender_project',
        'repairing',
        'spare_parts_requirement',
        'material_purchase_sale'
    )),
    status text not null default 'submitted' check (status in (
        'submitted',
        'under_review',
        'staff_assigned',
        'inspection_scheduled',
        'quotation_pending',
        'approved',
        'pickup_scheduled',
        'material_collected',
        'under_processing',
        'in_progress',
        'completed',
        'closed'
    )),
    pickup_location text not null,
    preferred_date date,
    site_requirements text,
    special_instructions text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. PROJECTS TABLE
create table if not exists public.projects (
    id uuid default uuid_generate_v4() primary key,
    request_id uuid references public.requests(id) on delete cascade unique not null,
    title text not null,
    status text not null default 'active' check (status in ('active', 'completed', 'closed')),
    assigned_staff_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. MATERIALS TABLE
create table if not exists public.materials (
    id uuid default uuid_generate_v4() primary key,
    request_id uuid references public.requests(id) on delete cascade not null,
    project_id uuid references public.projects(id) on delete set null,
    category text not null check (category in (
        'copper',
        'aluminium',
        'iron',
        'e_waste',
        'wood',
        'other_scrap'
    )),
    description text,
    quantity numeric default 0 not null,
    weight numeric default 0 not null, -- in kg
    units text not null default 'kg' check (units in ('kg', 'tons', 'units')),
    segregation_status text not null default 'pending' check (segregation_status in ('pending', 'segregated', 'processed')),
    processing_path text check (processing_path in (
        'recycling_disposal',
        'repairing_refurbishment',
        'spare_parts_recovery',
        'spare_parts_repairing_supply',
        'resale_reuse'
    ))
);

-- 6. COLLECTIONS (LOGISTICS) TABLE
create table if not exists public.collections (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade unique not null,
    scheduled_date timestamptz,
    collected_date timestamptz,
    driver_name text,
    vehicle_number text,
    status text not null default 'scheduled' check (status in ('scheduled', 'in_transit', 'collected', 'verified'))
);

-- 7. INVENTORY TABLE
create table if not exists public.inventory (
    id uuid default uuid_generate_v4() primary key,
    category text not null check (category in (
        'copper',
        'aluminium',
        'iron',
        'e_waste',
        'wood',
        'recovered_spare_parts',
        'refurbished_products'
    )),
    name text not null,
    quantity numeric default 0 not null,
    weight numeric default 0 not null,
    units text not null default 'kg',
    status text not null default 'available' check (status in ('available', 'reserved', 'dispatched')),
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. REPAIRS TABLE
create table if not exists public.repairs (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    product_name text not null,
    serial_number text,
    diagnosis text,
    status text not null default 'intake' check (status in (
        'intake',
        'diagnosis',
        'awaiting_parts',
        'repairing',
        'testing',
        'completed',
        'delivered'
    )),
    warranty_months integer default 0,
    warranty_start_date date,
    warranty_end_date date
);

-- 9. DOCUMENTS TABLE
create table if not exists public.documents (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade,
    request_id uuid references public.requests(id) on delete cascade,
    name text not null,
    type text not null check (type in (
        'collection_receipt',
        'pickup_confirmation',
        'weight_report',
        'recycling_certificate',
        'completion_certificate',
        'repair_report',
        'before_after_report',
        'warranty_info',
        'quotation',
        'delivery_challan',
        'invoice',
        'project_completion_report',
        'recovery_report',
        'financial_summary',
        'closure_report'
    )),
    file_url text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. NOTIFICATIONS TABLE
create table if not exists public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text not null,
    is_read boolean default false not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 11. AUDIT LOGS TABLE
create table if not exists public.activity_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    action text not null,
    details text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==========================================

-- Get the role of the currently authenticated user
create or replace function public.get_auth_role()
returns text as $$
    select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- Check if current user is an admin or staff member
create or replace function public.is_admin_or_staff()
returns boolean as $$
    select coalesce(
        (select role in (
            'super_admin',
            'operations_executive',
            'client_relationship_executive',
            'field_executive',
            'repair_technical_executive',
            'accounts_inventory_executive'
        ) from public.profiles where id = auth.uid()),
        false
    );
$$ language sql security definer;

-- Get the company_id of the currently authenticated user
create or replace function public.get_auth_company_id()
returns uuid as $$
    select company_id from public.profiles where id = auth.uid();
$$ language sql security definer;


-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.projects enable row level security;
alter table public.materials enable row level security;
alter table public.collections enable row level security;
alter table public.inventory enable row level security;
alter table public.repairs enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;


-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- 1. COMPANIES POLICIES
create policy "Allow staff to manage companies" on public.companies
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view own company" on public.companies
    for select using (id = public.get_auth_company_id());

-- 2. PROFILES POLICIES
create policy "Allow users to manage own profile" on public.profiles
    for all using (id = auth.uid());

create policy "Allow staff to view all profiles" on public.profiles
    for select using (public.is_admin_or_staff());

-- 3. REQUESTS POLICIES
create policy "Allow staff to manage all requests" on public.requests
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view their company requests" on public.requests
    for select using (company_id = public.get_auth_company_id());

create policy "Allow clients to insert their own requests" on public.requests
    for insert with check (company_id = public.get_auth_company_id());

-- 4. PROJECTS POLICIES
create policy "Allow staff to manage all projects" on public.projects
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view their company projects" on public.projects
    for select using (
        request_id in (select id from public.requests where company_id = public.get_auth_company_id())
    );

-- 5. MATERIALS POLICIES
create policy "Allow staff to manage all materials" on public.materials
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view their company request/project materials" on public.materials
    for select using (
        request_id in (select id from public.requests where company_id = public.get_auth_company_id())
    );

-- 6. COLLECTIONS POLICIES
create policy "Allow staff to manage all collections" on public.collections
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view their collections" on public.collections
    for select using (
        project_id in (
            select p.id from public.projects p
            join public.requests r on p.request_id = r.id
            where r.company_id = public.get_auth_company_id()
        )
    );

-- 7. INVENTORY POLICIES
create policy "Allow staff to manage all inventory" on public.inventory
    for all using (public.is_admin_or_staff());

create policy "Allow anyone to view inventory" on public.inventory
    for select using (true);

-- 8. REPAIRS POLICIES
create policy "Allow staff to manage all repairs" on public.repairs
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view their project repairs" on public.repairs
    for select using (
        project_id in (
            select p.id from public.projects p
            join public.requests r on p.request_id = r.id
            where r.company_id = public.get_auth_company_id()
        )
    );

-- 9. DOCUMENTS POLICIES
create policy "Allow staff to manage all documents" on public.documents
    for all using (public.is_admin_or_staff());

create policy "Allow clients to view their project/request documents" on public.documents
    for select using (
        request_id in (select id from public.requests where company_id = public.get_auth_company_id())
    );

-- 10. NOTIFICATIONS POLICIES
create policy "Allow users to view own notifications" on public.notifications
    for select using (user_id = auth.uid());

create policy "Allow users to update own notifications" on public.notifications
    for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 11. ACTIVITY LOGS POLICIES
create policy "Allow admins to view activity logs" on public.activity_logs
    for select using (public.get_auth_role() = 'super_admin');

create policy "Allow users to insert activity logs" on public.activity_logs
    for insert with check (user_id = auth.uid());


-- ==========================================
-- AUTOMATION TRIGGERS & PROCEDURES
-- ==========================================

-- Trigger to auto-create user profile when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, role, company_id)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', 'Client User'),
        coalesce(new.raw_user_meta_data->>'role', 'client_user'),
        case 
            when (new.raw_user_meta_data->>'company_id') is not null then (new.raw_user_meta_data->>'company_id')::uuid
            else null
        end
    );
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- Trigger to notify client on request status changes
create or replace function public.notify_on_request_status_change()
returns trigger as $$
declare
    client_uid uuid;
    req_type_formatted text;
begin
    if (old.status is null or old.status <> new.status) then
        client_uid := new.client_user_id;
        
        if client_uid is null then
            -- Fallback: select first user in the company
            select id into client_uid from public.profiles where company_id = new.company_id limit 1;
        end if;

        req_type_formatted := initcap(replace(new.request_type, '_', ' '));

        if client_uid is not null then
            insert into public.notifications (user_id, title, message)
            values (
                client_uid,
                'Request Status Updated',
                'Your ' || req_type_formatted || ' request (ID: ' || substring(new.id::text, 1, 8) || ') is now: ' || initcap(replace(new.status, '_', ' '))
            );
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists on_request_status_update on public.requests;

create trigger on_request_status_update
    after update on public.requests
    for each row execute procedure public.notify_on_request_status_change();


-- Trigger to automatically create a Project when a Request is Approved
create or replace function public.create_project_on_approval()
returns trigger as $$
declare
    company_name text;
begin
    if (new.status = 'approved' and (old.status is null or old.status <> 'approved')) then
        select name into company_name from public.companies where id = new.company_id;
        
        insert into public.projects (request_id, title, status)
        values (
            new.id,
            coalesce(company_name, 'Client') || ' - ' || initcap(replace(new.request_type, '_', ' ')),
            'active'
        )
        on conflict (request_id) do nothing;
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists on_request_approval_create_project on public.requests;

create trigger on_request_approval_create_project
    after update on public.requests
    for each row execute procedure public.create_project_on_approval();
