from django.db import migrations

SQL_INSERT_POLICY = (
    "create policy \"Authenticated users can insert their profile\" "
    "on profiles for insert with check ((auth.uid()) = id);"
)
SQL_UPDATE_POLICY = (
    "create policy \"Authenticated users can update their profile\" "
    "on profiles for update using ((auth.uid()) = id) "
    "with check ((auth.uid()) = id);"
)
DROP_INSERT_POLICY = (
    "drop policy if exists \"Authenticated users can insert their profile\" "
    "on profiles;"
)
DROP_UPDATE_POLICY = (
    "drop policy if exists \"Authenticated users can update their profile\" "
    "on profiles;"
)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0003_slim_profile"),
    ]

    operations = [
        migrations.RunSQL(sql=SQL_INSERT_POLICY, reverse_sql=DROP_INSERT_POLICY),
        migrations.RunSQL(sql=SQL_UPDATE_POLICY, reverse_sql=DROP_UPDATE_POLICY),
    ]
