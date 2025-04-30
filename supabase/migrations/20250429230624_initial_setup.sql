create table "public"."labels" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "color" text not null,
    "description" text
);


create table "public"."organization_members" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid,
    "user_id" uuid,
    "role" text not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."organizations" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "github_org_id" text,
    "github_org_name" text,
    "creator_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."profiles" (
    "id" uuid not null,
    "display_name" text,
    "avatar_url" text,
    "github_username" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."session_labels" (
    "id" uuid not null default uuid_generate_v4(),
    "session_id" uuid,
    "label_id" uuid
);


create table "public"."session_participants" (
    "id" uuid not null default uuid_generate_v4(),
    "session_id" uuid,
    "user_id" uuid
);


create table "public"."sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid,
    "github_issue_link" text not null,
    "notes" text,
    "start_time" timestamp with time zone not null default now(),
    "end_time" timestamp with time zone,
    "status" text not null,
    "creator_id" uuid not null,
    "total_duration" interval default '00:00:00'::interval,
    "last_paused_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX labels_name_key ON public.labels USING btree (name);

CREATE UNIQUE INDEX labels_pkey ON public.labels USING btree (id);

CREATE UNIQUE INDEX organization_members_organization_id_user_id_key ON public.organization_members USING btree (organization_id, user_id);

CREATE UNIQUE INDEX organization_members_pkey ON public.organization_members USING btree (id);

CREATE UNIQUE INDEX organizations_github_org_id_key ON public.organizations USING btree (github_org_id);

CREATE UNIQUE INDEX organizations_name_key ON public.organizations USING btree (name);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX session_labels_pkey ON public.session_labels USING btree (id);

CREATE UNIQUE INDEX session_labels_session_id_label_id_key ON public.session_labels USING btree (session_id, label_id);

CREATE UNIQUE INDEX session_participants_pkey ON public.session_participants USING btree (id);

CREATE UNIQUE INDEX session_participants_session_id_user_id_key ON public.session_participants USING btree (session_id, user_id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

alter table "public"."labels" add constraint "labels_pkey" PRIMARY KEY using index "labels_pkey";

alter table "public"."organization_members" add constraint "organization_members_pkey" PRIMARY KEY using index "organization_members_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."session_labels" add constraint "session_labels_pkey" PRIMARY KEY using index "session_labels_pkey";

alter table "public"."session_participants" add constraint "session_participants_pkey" PRIMARY KEY using index "session_participants_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."labels" add constraint "labels_name_key" UNIQUE using index "labels_name_key";

alter table "public"."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_user_id_key" UNIQUE using index "organization_members_organization_id_user_id_key";

alter table "public"."organization_members" add constraint "organization_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text]))) not valid;

alter table "public"."organization_members" validate constraint "organization_members_role_check";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey";

alter table "public"."organizations" add constraint "organizations_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES auth.users(id) not valid;

alter table "public"."organizations" validate constraint "organizations_creator_id_fkey";

alter table "public"."organizations" add constraint "organizations_github_org_id_key" UNIQUE using index "organizations_github_org_id_key";

alter table "public"."organizations" add constraint "organizations_name_key" UNIQUE using index "organizations_name_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."session_labels" add constraint "session_labels_label_id_fkey" FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE not valid;

alter table "public"."session_labels" validate constraint "session_labels_label_id_fkey";

alter table "public"."session_labels" add constraint "session_labels_session_id_fkey" FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE not valid;

alter table "public"."session_labels" validate constraint "session_labels_session_id_fkey";

alter table "public"."session_labels" add constraint "session_labels_session_id_label_id_key" UNIQUE using index "session_labels_session_id_label_id_key";

alter table "public"."session_participants" add constraint "session_participants_session_id_fkey" FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE not valid;

alter table "public"."session_participants" validate constraint "session_participants_session_id_fkey";

alter table "public"."session_participants" add constraint "session_participants_session_id_user_id_key" UNIQUE using index "session_participants_session_id_user_id_key";

alter table "public"."session_participants" add constraint "session_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."session_participants" validate constraint "session_participants_user_id_fkey";

alter table "public"."sessions" add constraint "sessions_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES auth.users(id) not valid;

alter table "public"."sessions" validate constraint "sessions_creator_id_fkey";

alter table "public"."sessions" add constraint "sessions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_organization_id_fkey";

alter table "public"."sessions" add constraint "sessions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text]))) not valid;

alter table "public"."sessions" validate constraint "sessions_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_organization_member(p_organization_id uuid, p_user_id uuid, p_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID = auth.uid();
  v_is_owner BOOLEAN;
BEGIN
  -- Check if the current user is an owner of the organization
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id 
    AND user_id = v_user_id 
    AND role = 'owner'
  ) INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Only organization owners can add members';
  END IF;
  
  -- Add the member
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, p_user_id, p_role);
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_session_labels(p_session_id uuid, p_labels uuid[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Add labels
  INSERT INTO session_labels (session_id, label_id)
  SELECT p_session_id, unnest(p_labels)
  ON CONFLICT (session_id, label_id) DO NOTHING;
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_session(p_session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_duration INTERVAL;
BEGIN
  -- Calculate final duration
  SELECT 
    CASE 
      WHEN status = 'paused' THEN total_duration
      WHEN status = 'active' THEN 
        CASE
          WHEN last_paused_at IS NULL THEN now() - start_time
          ELSE now() - last_paused_at + total_duration
        END
    END
  INTO v_duration
  FROM sessions
  WHERE id = p_session_id AND status IN ('active', 'paused');

  -- Update session
  UPDATE sessions
  SET 
    status = 'completed',
    end_time = NOW(),
    total_duration = v_duration,
    updated_at = NOW()
  WHERE id = p_session_id AND status IN ('active', 'paused');

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_github_org_id text, p_github_org_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_organization_id UUID;
  v_user_id UUID = auth.uid();
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, github_org_id, github_org_name, creator_id)
  VALUES (p_name, p_github_org_id, p_github_org_name, v_user_id)
  RETURNING id INTO v_organization_id;
  
  -- Add creator as owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_organization_id, v_user_id, 'owner');
  
  RETURN v_organization_id;
END;
$function$
;

create or replace view "public"."dashboard_summary" as  SELECT u.display_name,
    l.name AS label,
    date_trunc('day'::text, s.start_time) AS day,
    date_trunc('week'::text, s.start_time) AS week,
    date_trunc('month'::text, s.start_time) AS month,
    (EXTRACT(epoch FROM sum(
        CASE
            WHEN (s.status = 'completed'::text) THEN s.total_duration
            WHEN (s.status = 'paused'::text) THEN s.total_duration
            WHEN (s.status = 'active'::text) THEN ((CURRENT_TIMESTAMP - COALESCE(s.last_paused_at, s.start_time)) + s.total_duration)
            ELSE NULL::interval
        END)) / (3600)::numeric) AS total_hours
   FROM ((((sessions s
     JOIN session_participants sp ON ((s.id = sp.session_id)))
     JOIN profiles u ON ((sp.user_id = u.id)))
     LEFT JOIN session_labels sl ON ((s.id = sl.session_id)))
     LEFT JOIN labels l ON ((sl.label_id = l.id)))
  GROUP BY u.display_name, l.name, (date_trunc('day'::text, s.start_time)), (date_trunc('week'::text, s.start_time)), (date_trunc('month'::text, s.start_time));


CREATE OR REPLACE FUNCTION public.handle_github_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  github_user_record RECORD;
BEGIN
  -- Get GitHub user data from the webhook payload
  SELECT 
    raw_user_meta_data->>'id' as github_id,
    raw_user_meta_data->>'user_name' as username,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    raw_user_meta_data->>'name' as full_name
  INTO github_user_record
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Update profile with GitHub information
  UPDATE profiles
  SET 
    display_name = COALESCE(github_user_record.full_name, github_user_record.username),
    avatar_url = github_user_record.avatar_url,
    github_username = github_user_record.username,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url, github_username)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'
  );
  RETURN NEW;
END;
$function$
;

create or replace view "public"."organization_memberships" as  SELECT o.id AS organization_id,
    o.name AS organization_name,
    o.github_org_name,
    u.id AS user_id,
    p.display_name,
    om.role
   FROM (((organization_members om
     JOIN organizations o ON ((om.organization_id = o.id)))
     JOIN auth.users u ON ((om.user_id = u.id)))
     JOIN profiles p ON ((u.id = p.id)));


CREATE OR REPLACE FUNCTION public.pause_session(p_session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_duration INTERVAL;
BEGIN
  -- Calculate duration since start or last unpause
  SELECT 
    CASE 
      WHEN last_paused_at IS NULL THEN now() - start_time 
      ELSE now() - last_paused_at + total_duration
    END
  INTO v_duration
  FROM sessions
  WHERE id = p_session_id AND status = 'active';

  -- Update session status and total_duration
  UPDATE sessions
  SET 
    status = 'paused',
    total_duration = v_duration,
    last_paused_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id AND status = 'active';

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resume_session(p_session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_active_sessions TEXT[];
  v_participants UUID[];
BEGIN
  -- Get all participants of this session
  SELECT array_agg(user_id)
  INTO v_participants
  FROM session_participants
  WHERE session_id = p_session_id;
  
  -- Check if any participant has another active session
  SELECT array_agg(profiles.display_name)
  INTO v_active_sessions
  FROM auth.users
  JOIN profiles ON auth.users.id = profiles.id
  WHERE auth.users.id = ANY(v_participants)
  AND EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = auth.users.id 
    AND s.status = 'active'
    AND s.id <> p_session_id
  );

  IF array_length(v_active_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have active sessions: %', array_to_string(v_active_sessions, ', ');
  END IF;

  UPDATE sessions
  SET 
    status = 'active',
    last_paused_at = NULL,
    updated_at = NOW()
  WHERE id = p_session_id AND status = 'paused';

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.start_session(p_organization_id uuid, p_github_issue_link text, p_notes text, p_participants uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_session_id UUID;
  v_user_id UUID = auth.uid();
  v_active_sessions TEXT[];
BEGIN
  -- Check if any participant has an active session
  SELECT array_agg(profiles.display_name)
  INTO v_active_sessions
  FROM auth.users
  JOIN profiles ON auth.users.id = profiles.id
  WHERE auth.users.id = ANY(p_participants)
  AND EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = auth.users.id AND s.status = 'active'
  );

  IF array_length(v_active_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have active sessions: %', array_to_string(v_active_sessions, ', ');
  END IF;

  -- Create the session
  INSERT INTO sessions (organization_id, github_issue_link, notes, status, creator_id)
  VALUES (p_organization_id, p_github_issue_link, p_notes, 'active', v_user_id)
  RETURNING id INTO v_session_id;

  -- Add participants (including creator who is the first participant)
  INSERT INTO session_participants (session_id, user_id)
  SELECT v_session_id, unnest(p_participants);

  RETURN v_session_id;
END;
$function$
;

create or replace view "public"."user_sessions" as  SELECT s.id,
    s.organization_id,
    s.github_issue_link,
    s.notes,
    s.start_time,
    s.end_time,
    s.status,
    s.creator_id,
    s.total_duration,
    s.last_paused_at,
    s.created_at,
    s.updated_at,
    sp.user_id,
    p.display_name AS participant_name,
    o.name AS organization_name,
    array_agg(DISTINCT l.name) AS labels,
        CASE
            WHEN (s.status = 'active'::text) THEN (EXTRACT(epoch FROM ((CURRENT_TIMESTAMP - COALESCE(s.last_paused_at, s.start_time)) + s.total_duration)) / (3600)::numeric)
            ELSE (EXTRACT(epoch FROM s.total_duration) / (3600)::numeric)
        END AS hours
   FROM (((((sessions s
     JOIN session_participants sp ON ((s.id = sp.session_id)))
     JOIN profiles p ON ((sp.user_id = p.id)))
     JOIN organizations o ON ((s.organization_id = o.id)))
     LEFT JOIN session_labels sl ON ((s.id = sl.session_id)))
     LEFT JOIN labels l ON ((sl.label_id = l.id)))
  GROUP BY s.id, sp.user_id, p.display_name, o.name;


grant delete on table "public"."labels" to "anon";

grant insert on table "public"."labels" to "anon";

grant references on table "public"."labels" to "anon";

grant select on table "public"."labels" to "anon";

grant trigger on table "public"."labels" to "anon";

grant truncate on table "public"."labels" to "anon";

grant update on table "public"."labels" to "anon";

grant delete on table "public"."labels" to "authenticated";

grant insert on table "public"."labels" to "authenticated";

grant references on table "public"."labels" to "authenticated";

grant select on table "public"."labels" to "authenticated";

grant trigger on table "public"."labels" to "authenticated";

grant truncate on table "public"."labels" to "authenticated";

grant update on table "public"."labels" to "authenticated";

grant delete on table "public"."labels" to "service_role";

grant insert on table "public"."labels" to "service_role";

grant references on table "public"."labels" to "service_role";

grant select on table "public"."labels" to "service_role";

grant trigger on table "public"."labels" to "service_role";

grant truncate on table "public"."labels" to "service_role";

grant update on table "public"."labels" to "service_role";

grant delete on table "public"."organization_members" to "anon";

grant insert on table "public"."organization_members" to "anon";

grant references on table "public"."organization_members" to "anon";

grant select on table "public"."organization_members" to "anon";

grant trigger on table "public"."organization_members" to "anon";

grant truncate on table "public"."organization_members" to "anon";

grant update on table "public"."organization_members" to "anon";

grant delete on table "public"."organization_members" to "authenticated";

grant insert on table "public"."organization_members" to "authenticated";

grant references on table "public"."organization_members" to "authenticated";

grant select on table "public"."organization_members" to "authenticated";

grant trigger on table "public"."organization_members" to "authenticated";

grant truncate on table "public"."organization_members" to "authenticated";

grant update on table "public"."organization_members" to "authenticated";

grant delete on table "public"."organization_members" to "service_role";

grant insert on table "public"."organization_members" to "service_role";

grant references on table "public"."organization_members" to "service_role";

grant select on table "public"."organization_members" to "service_role";

grant trigger on table "public"."organization_members" to "service_role";

grant truncate on table "public"."organization_members" to "service_role";

grant update on table "public"."organization_members" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."session_labels" to "anon";

grant insert on table "public"."session_labels" to "anon";

grant references on table "public"."session_labels" to "anon";

grant select on table "public"."session_labels" to "anon";

grant trigger on table "public"."session_labels" to "anon";

grant truncate on table "public"."session_labels" to "anon";

grant update on table "public"."session_labels" to "anon";

grant delete on table "public"."session_labels" to "authenticated";

grant insert on table "public"."session_labels" to "authenticated";

grant references on table "public"."session_labels" to "authenticated";

grant select on table "public"."session_labels" to "authenticated";

grant trigger on table "public"."session_labels" to "authenticated";

grant truncate on table "public"."session_labels" to "authenticated";

grant update on table "public"."session_labels" to "authenticated";

grant delete on table "public"."session_labels" to "service_role";

grant insert on table "public"."session_labels" to "service_role";

grant references on table "public"."session_labels" to "service_role";

grant select on table "public"."session_labels" to "service_role";

grant trigger on table "public"."session_labels" to "service_role";

grant truncate on table "public"."session_labels" to "service_role";

grant update on table "public"."session_labels" to "service_role";

grant delete on table "public"."session_participants" to "anon";

grant insert on table "public"."session_participants" to "anon";

grant references on table "public"."session_participants" to "anon";

grant select on table "public"."session_participants" to "anon";

grant trigger on table "public"."session_participants" to "anon";

grant truncate on table "public"."session_participants" to "anon";

grant update on table "public"."session_participants" to "anon";

grant delete on table "public"."session_participants" to "authenticated";

grant insert on table "public"."session_participants" to "authenticated";

grant references on table "public"."session_participants" to "authenticated";

grant select on table "public"."session_participants" to "authenticated";

grant trigger on table "public"."session_participants" to "authenticated";

grant truncate on table "public"."session_participants" to "authenticated";

grant update on table "public"."session_participants" to "authenticated";

grant delete on table "public"."session_participants" to "service_role";

grant insert on table "public"."session_participants" to "service_role";

grant references on table "public"."session_participants" to "service_role";

grant select on table "public"."session_participants" to "service_role";

grant trigger on table "public"."session_participants" to "service_role";

grant truncate on table "public"."session_participants" to "service_role";

grant update on table "public"."session_participants" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";

create policy "Everyone can view labels"
on "public"."labels"
as permissive
for select
to public
using (true);


create policy "Owners can manage organization members"
on "public"."organization_members"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM organization_members organization_members_1
  WHERE ((organization_members_1.organization_id = organization_members_1.organization_id) AND (organization_members_1.user_id = auth.uid()) AND (organization_members_1.role = 'owner'::text)))));


create policy "Users can view organization members"
on "public"."organization_members"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM organization_members om
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid())))));


create policy "Owners can manage their organizations"
on "public"."organizations"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = organizations.id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'owner'::text)))));


create policy "Users can view organizations they belong to"
on "public"."organizations"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = organizations.id) AND (organization_members.user_id = auth.uid())))));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((id = auth.uid()));


create policy "Users can view all profiles"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Users can manage session labels"
on "public"."session_labels"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (sessions s
     JOIN session_participants sp ON ((s.id = sp.session_id)))
  WHERE ((s.id = session_labels.session_id) AND (sp.user_id = auth.uid())))));


create policy "Users can manage session participants"
on "public"."session_participants"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM sessions
  WHERE ((sessions.id = session_participants.session_id) AND (sessions.creator_id = auth.uid())))));


create policy "Users can update their non-completed sessions"
on "public"."sessions"
as permissive
for update
to public
using (((creator_id = auth.uid()) AND (status <> 'completed'::text)));


create policy "Users can view sessions they participate in"
on "public"."sessions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM session_participants
  WHERE ((session_participants.session_id = sessions.id) AND (session_participants.user_id = auth.uid())))));



