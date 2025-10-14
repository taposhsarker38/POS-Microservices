from rest_framework import serializers
from .models import Permission, Role, AuditLog, User
from django.contrib.auth.password_validation import validate_password

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id','code','description','created_at']

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(many=True, write_only=True, queryset=Permission.objects.all(), source='permissions')
    class Meta:
        model = Role
        fields = ['id','name','description','permissions','permission_ids','created_at']

class AuditCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'actor_id','actor_username','service','action','resource_type','resource_id','details','ip_address','created_at']
        read_only_fields = ['id','created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ['id','username','email','password','confirm_password','first_name','last_name','phone','company_id','wing_id']
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password":"Password and confirm_password must match"})
        return attrs
    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.is_active = False
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_superuser',
            'is_active',
            'role',
            'permissions',
            'company_id',
        ]
        read_only_fields = ['id', 'is_superuser']

class PreferencesSerializer(serializers.Serializer):
    accent = serializers.CharField(allow_blank=True, required=False)
    dark_mode = serializers.BooleanField(required=False)
    collapsed_sidebar = serializers.BooleanField(required=False)
