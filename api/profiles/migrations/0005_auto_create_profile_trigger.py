from django.db import migrations

# SQL to create a trigger that automatically creates a profile when a user signs up
CREATE_TRIGGER_FUNCTION = """
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
"""

CREATE_TRIGGER = """
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
"""

DROP_TRIGGER = "drop trigger if exists on_auth_user_created on auth.users;"
DROP_FUNCTION = "drop function if exists public.handle_new_user();"


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0004_enable_write_rls"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_TRIGGER_FUNCTION, reverse_sql=DROP_FUNCTION),
        migrations.RunSQL(sql=CREATE_TRIGGER, reverse_sql=DROP_TRIGGER),
    ]
