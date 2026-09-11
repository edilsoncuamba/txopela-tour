# Generated migration

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=50, unique=True)),
                ('slug', models.SlugField(unique=True)),
                ('icon', models.CharField(default='📍', max_length=10)),
                ('color', models.CharField(default='#0077B6', max_length=7)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name_plural': 'categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Location',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('address', models.CharField(max_length=300)),
                ('latitude', models.DecimalField(decimal_places=8, max_digits=10)),
                ('longitude', models.DecimalField(decimal_places=8, max_digits=11)),
                ('images', models.JSONField(default=list)),
                ('rating', models.DecimalField(decimal_places=1, default=0.0, max_digits=2)),
                ('reviews_count', models.PositiveIntegerField(default=0)),
                ('likes_count', models.PositiveIntegerField(default=0)),
                ('saves_count', models.PositiveIntegerField(default=0)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('is_featured', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='locations', to=settings.AUTH_USER_MODEL)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='locations', to='locations.category')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SavedLocation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saves', to='locations.location')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_locations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('user', 'location')},
            },
        ),
        migrations.CreateModel(
            name='NearbyService',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('service_type', models.CharField(choices=[('hotel', 'Hotel'), ('restaurant', 'Restaurant'), ('guide', 'Tour Guide'), ('shop', 'Shop'), ('transport', 'Transport'), ('other', 'Other')], max_length=20)),
                ('description', models.TextField(blank=True)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('website', models.URLField(blank=True)),
                ('distance_km', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
                ('is_active', models.BooleanField(default=True)),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='nearby_services', to='locations.location')),
            ],
            options={
                'ordering': ['service_type', 'distance_km'],
            },
        ),
        migrations.CreateModel(
            name='LocationImage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('image', models.ImageField(upload_to='locations/%Y/%m/')),
                ('caption', models.CharField(blank=True, max_length=200)),
                ('is_primary', models.BooleanField(default=False)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='location_images', to='locations.location')),
            ],
            options={
                'ordering': ['-is_primary', '-uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='LikedLocation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='locations.location')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='liked_locations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('user', 'location')},
            },
        ),
        migrations.AddIndex(
            model_name='location',
            index=models.Index(fields=['category', 'status'], name='locations_l_categor_idx'),
        ),
        migrations.AddIndex(
            model_name='location',
            index=models.Index(fields=['rating', 'reviews_count'], name='locations_l_rating_idx'),
        ),
        migrations.AddIndex(
            model_name='location',
            index=models.Index(fields=['latitude', 'longitude'], name='locations_l_latitu_idx'),
        ),
    ]
