from django.db import models
from datetime import timedelta
from django.utils import timezone


class Tenant(models.Model):
    """Represents a VR device identified by deviceId"""
    id = models.BigAutoField(primary_key=True)
    device_id = models.TextField(unique=True, db_index=True)
    name = models.TextField(null=True, blank=True)
    admin_password = models.TextField(null=True, blank=True)  # Set by first user
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


class Session(models.Model):
    """Persistent session storage for authentication tokens"""
    id = models.BigAutoField(primary_key=True)
    token = models.TextField(unique=True, db_index=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, db_column="tenant_id")
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, db_column="user_id")
    device_id = models.TextField()
    pin = models.TextField()
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "sessions"
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        indexes = [
            models.Index(fields=["token"], name="idx_sessions_token"),
            models.Index(fields=["expires_at"], name="idx_sessions_expires_at"),
        ]

    def __str__(self) -> str:
        return f"Session({self.token[:20]}..., expires: {self.expires_at})"

    def is_valid(self) -> bool:
        """Check if session is still valid"""
        now = timezone.now()
        # Handle both naive and aware datetimes
        expires = self.expires_at
        if timezone.is_naive(expires):
            expires = timezone.make_aware(expires)
        return now < expires

    @classmethod
    def create_session(cls, token: str, tenant, user=None, device_id=None, pin=None, is_admin=False, hours=24):
        """Create a new session with expiration"""
        return cls.objects.create(
            token=token,
            tenant=tenant,
            user=user,
            device_id=device_id or tenant.device_id,
            pin=pin,
            is_admin=is_admin,
            expires_at=timezone.now() + timedelta(hours=hours)
        )

    @classmethod
    def get_valid_session(cls, token: str):
        """Get session if valid, delete if expired"""
        try:
            session = cls.objects.select_related('tenant', 'user__tenant').get(token=token)
            if session.is_valid():
                return session
            else:
                session.delete()  # Clean up expired session
                return None
        except cls.DoesNotExist:
            return None
