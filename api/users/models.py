from django.db import models


class Tenant(models.Model):
    """Represents a VR device identified by deviceId"""
    id = models.BigAutoField(primary_key=True)
    device_id = models.TextField(unique=True, db_index=True)
    name = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenants"
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"

    def __str__(self) -> str:
        return f"Tenant({self.device_id})"


class User(models.Model):
    """Represents a user identified by (deviceId + PIN)"""
    id = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="users", db_column="tenant_id")
    pin = models.TextField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "pin"],
                name="users_tenant_id_pin_key"
            )
        ]
        indexes = [
            models.Index(fields=["tenant", "pin"], name="idx_users_tenant_pin"),
        ]

    def __str__(self) -> str:
        return f"User({self.tenant.device_id}, PIN: {self.pin[:2]}***)"
