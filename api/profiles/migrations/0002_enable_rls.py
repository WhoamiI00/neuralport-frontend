from django.db import migrations

SQL_ENABLE_RLS = "alter table profiles enable row level security;"
SQL_DISABLE_RLS = "alter table profiles disable row level security;"
POLICY_SQL = (
    "create policy \"Authenticated users can select their profile\" "
    "on profiles for select using ((select auth.uid()) = id);"
)
DROP_POLICY_SQL = (
    "drop policy if exists \"Authenticated users can select their profile\" "
    "on profiles;"
)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(sql=SQL_ENABLE_RLS, reverse_sql=SQL_DISABLE_RLS),
        migrations.RunSQL(sql=POLICY_SQL, reverse_sql=DROP_POLICY_SQL),
    ]
