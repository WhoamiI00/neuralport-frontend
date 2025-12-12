from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0002_enable_rls"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="full_name",
        ),
        migrations.RemoveField(
            model_name="profile",
            name="avatar_url",
        ),
        migrations.RemoveField(
            model_name="profile",
            name="created_at",
        ),
        migrations.AddField(
            model_name="profile",
            name="email",
            field=models.TextField(default="", blank=False),
        ),
    ]
