create table "public"."profiles" (
    "id" uuid not null,
    "github_username" text,
    "avatar_url" text,
    "full_name" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."session_tags" (
    "session_id" uuid not null,
    "tag_id" uuid not null
);


create table "public"."sessions" (
    "id" uuid not null default gen_random_uuid(),
    "track_id" uuid,
    "space_member_id" uuid,
    "comment_url" text,
    "started_at" timestamp with time zone not null,
    "ended_at" timestamp with time zone,
    "skipped_summary" boolean default false
);


create table "public"."space_members" (
    "id" uuid not null default gen_random_uuid(),
    "space_id" uuid,
    "user_id" uuid,
    "role" text not null,
    "nickname" text,
    "joined_at" timestamp with time zone default now(),
    "last_active_at" timestamp with time zone
);


create table "public"."spaces" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "avatar_url" text,
    "plan" text default 'free'::text,
    "github_org_id" bigint,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "space_id" uuid,
    "name" text not null,
    "color" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."tracks" (
    "id" uuid not null default gen_random_uuid(),
    "space_id" uuid,
    "repo_owner" text not null,
    "repo_name" text not null,
    "issue_number" integer not null,
    "title" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX session_tags_pkey ON public.session_tags USING btree (session_id, tag_id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE UNIQUE INDEX space_members_pkey ON public.space_members USING btree (id);

CREATE UNIQUE INDEX spaces_pkey ON public.spaces USING btree (id);

CREATE UNIQUE INDEX spaces_slug_key ON public.spaces USING btree (slug);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_space_id_name_key ON public.tags USING btree (space_id, name);

CREATE UNIQUE INDEX tracks_pkey ON public.tracks USING btree (id);

CREATE UNIQUE INDEX tracks_space_id_repo_owner_repo_name_issue_number_key ON public.tracks USING btree (space_id, repo_owner, repo_name, issue_number);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."session_tags" add constraint "session_tags_pkey" PRIMARY KEY using index "session_tags_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."space_members" add constraint "space_members_pkey" PRIMARY KEY using index "space_members_pkey";

alter table "public"."spaces" add constraint "spaces_pkey" PRIMARY KEY using index "spaces_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."tracks" add constraint "tracks_pkey" PRIMARY KEY using index "tracks_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."session_tags" add constraint "session_tags_session_id_fkey" FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE not valid;

alter table "public"."session_tags" validate constraint "session_tags_session_id_fkey";

alter table "public"."session_tags" add constraint "session_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."session_tags" validate constraint "session_tags_tag_id_fkey";

alter table "public"."sessions" add constraint "sessions_space_member_id_fkey" FOREIGN KEY (space_member_id) REFERENCES space_members(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_space_member_id_fkey";

alter table "public"."sessions" add constraint "sessions_track_id_fkey" FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_track_id_fkey";

alter table "public"."space_members" add constraint "space_members_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text, 'observer'::text]))) not valid;

alter table "public"."space_members" validate constraint "space_members_role_check";

alter table "public"."space_members" add constraint "space_members_space_id_fkey" FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE not valid;

alter table "public"."space_members" validate constraint "space_members_space_id_fkey";

alter table "public"."space_members" add constraint "space_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."space_members" validate constraint "space_members_user_id_fkey";

alter table "public"."spaces" add constraint "spaces_slug_key" UNIQUE using index "spaces_slug_key";

alter table "public"."tags" add constraint "tags_space_id_fkey" FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_space_id_fkey";

alter table "public"."tags" add constraint "tags_space_id_name_key" UNIQUE using index "tags_space_id_name_key";

alter table "public"."tracks" add constraint "tracks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."tracks" validate constraint "tracks_created_by_fkey";

alter table "public"."tracks" add constraint "tracks_space_id_fkey" FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE not valid;

alter table "public"."tracks" validate constraint "tracks_space_id_fkey";

alter table "public"."tracks" add constraint "tracks_space_id_repo_owner_repo_name_issue_number_key" UNIQUE using index "tracks_space_id_repo_owner_repo_name_issue_number_key";

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

grant delete on table "public"."session_tags" to "anon";

grant insert on table "public"."session_tags" to "anon";

grant references on table "public"."session_tags" to "anon";

grant select on table "public"."session_tags" to "anon";

grant trigger on table "public"."session_tags" to "anon";

grant truncate on table "public"."session_tags" to "anon";

grant update on table "public"."session_tags" to "anon";

grant delete on table "public"."session_tags" to "authenticated";

grant insert on table "public"."session_tags" to "authenticated";

grant references on table "public"."session_tags" to "authenticated";

grant select on table "public"."session_tags" to "authenticated";

grant trigger on table "public"."session_tags" to "authenticated";

grant truncate on table "public"."session_tags" to "authenticated";

grant update on table "public"."session_tags" to "authenticated";

grant delete on table "public"."session_tags" to "service_role";

grant insert on table "public"."session_tags" to "service_role";

grant references on table "public"."session_tags" to "service_role";

grant select on table "public"."session_tags" to "service_role";

grant trigger on table "public"."session_tags" to "service_role";

grant truncate on table "public"."session_tags" to "service_role";

grant update on table "public"."session_tags" to "service_role";

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

grant delete on table "public"."space_members" to "anon";

grant insert on table "public"."space_members" to "anon";

grant references on table "public"."space_members" to "anon";

grant select on table "public"."space_members" to "anon";

grant trigger on table "public"."space_members" to "anon";

grant truncate on table "public"."space_members" to "anon";

grant update on table "public"."space_members" to "anon";

grant delete on table "public"."space_members" to "authenticated";

grant insert on table "public"."space_members" to "authenticated";

grant references on table "public"."space_members" to "authenticated";

grant select on table "public"."space_members" to "authenticated";

grant trigger on table "public"."space_members" to "authenticated";

grant truncate on table "public"."space_members" to "authenticated";

grant update on table "public"."space_members" to "authenticated";

grant delete on table "public"."space_members" to "service_role";

grant insert on table "public"."space_members" to "service_role";

grant references on table "public"."space_members" to "service_role";

grant select on table "public"."space_members" to "service_role";

grant trigger on table "public"."space_members" to "service_role";

grant truncate on table "public"."space_members" to "service_role";

grant update on table "public"."space_members" to "service_role";

grant delete on table "public"."spaces" to "anon";

grant insert on table "public"."spaces" to "anon";

grant references on table "public"."spaces" to "anon";

grant select on table "public"."spaces" to "anon";

grant trigger on table "public"."spaces" to "anon";

grant truncate on table "public"."spaces" to "anon";

grant update on table "public"."spaces" to "anon";

grant delete on table "public"."spaces" to "authenticated";

grant insert on table "public"."spaces" to "authenticated";

grant references on table "public"."spaces" to "authenticated";

grant select on table "public"."spaces" to "authenticated";

grant trigger on table "public"."spaces" to "authenticated";

grant truncate on table "public"."spaces" to "authenticated";

grant update on table "public"."spaces" to "authenticated";

grant delete on table "public"."spaces" to "service_role";

grant insert on table "public"."spaces" to "service_role";

grant references on table "public"."spaces" to "service_role";

grant select on table "public"."spaces" to "service_role";

grant trigger on table "public"."spaces" to "service_role";

grant truncate on table "public"."spaces" to "service_role";

grant update on table "public"."spaces" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."tracks" to "anon";

grant insert on table "public"."tracks" to "anon";

grant references on table "public"."tracks" to "anon";

grant select on table "public"."tracks" to "anon";

grant trigger on table "public"."tracks" to "anon";

grant truncate on table "public"."tracks" to "anon";

grant update on table "public"."tracks" to "anon";

grant delete on table "public"."tracks" to "authenticated";

grant insert on table "public"."tracks" to "authenticated";

grant references on table "public"."tracks" to "authenticated";

grant select on table "public"."tracks" to "authenticated";

grant trigger on table "public"."tracks" to "authenticated";

grant truncate on table "public"."tracks" to "authenticated";

grant update on table "public"."tracks" to "authenticated";

grant delete on table "public"."tracks" to "service_role";

grant insert on table "public"."tracks" to "service_role";

grant references on table "public"."tracks" to "service_role";

grant select on table "public"."tracks" to "service_role";

grant trigger on table "public"."tracks" to "service_role";

grant truncate on table "public"."tracks" to "service_role";

grant update on table "public"."tracks" to "service_role";


