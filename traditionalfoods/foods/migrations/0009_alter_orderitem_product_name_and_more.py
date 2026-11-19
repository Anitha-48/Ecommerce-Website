from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("foods", "0008_orderitem_product_name_orderitem_unit_price_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orderitem",
            name="product_name",
            field=models.CharField(max_length=200),
        ),
        migrations.AlterField(
            model_name="orderitem",
            name="unit_price",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
    ]
