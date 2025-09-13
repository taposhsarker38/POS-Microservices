from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'id','username','email','password','confirm_password',
            'first_name','last_name','phone','company_id','wing_id','role'
        ]

    def validate(self, attrs):
        pwd = attrs.get('password')
        pwd2 = attrs.get('confirm_password')
        if pwd != pwd2:
            raise serializers.ValidationError({"confirm_password": "Password and confirm password do not match."})
        return attrs

    def create(self, validated_data):
        # remove confirm_password before creating user
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.is_active = False  # keep inactive until email verification (if you use that flow)
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','phone','company_id','wing_id','role','email_verified']
# auth-service: apps/users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # add custom claims
        token['username'] = user.get_username()
        token['role'] = getattr(user, 'role', None)
        # token already contains user_id by default
        return token

