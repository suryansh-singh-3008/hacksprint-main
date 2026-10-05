import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding...');
  
  await db.undoLog.deleteMany();
  await db.voiceLog.deleteMany();
  await db.complianceItem.deleteMany();
  await db.merchantScheme.deleteMany();
  await db.scheme.deleteMany();
  await db.surplusListing.deleteMany();
  await db.offer.deleteMany();
  await db.expense.deleteMany();
  await db.creditEntry.deleteMany();
  await db.customer.deleteMany();
  await db.saleItem.deleteMany();
  await db.sale.deleteMany();
  await db.stockBatch.deleteMany();
  await db.supplier.deleteMany();
  await db.product.deleteMany();
  await db.user.deleteMany();
  await db.merchant.deleteMany();

  const merchant = await db.merchant.create({
    data: {
      name: 'Ramesh Kirana Store',
      city: 'Bangalore',
      annualTurnoverPaise: 395000000,
    }
  });

  console.log('Merchant created:', merchant.id);

  const u = await db.user.create({
    data: {
      merchantId: merchant.id,
      name: 'Ramesh',
      role: 'owner',
    }
  });

  const sharma = await db.supplier.create({ data: { merchantId: merchant.id, name: 'Sharma Wholesale' } });
  const gupta = await db.supplier.create({ data: { merchantId: merchant.id, name: 'Gupta Distributors' } });
  const metro = await db.supplier.create({ data: { merchantId: merchant.id, name: 'Metro Cash & Carry' } });

  const productsData = [
    { name: 'Atta 5kg', price: 22000, cat: 'grains' },
    { name: 'Rice 5kg', price: 35000, cat: 'grains' },
    { name: 'Dal 1kg', price: 12000, cat: 'grains' },
    { name: 'Paneer 500g', price: 18000, cat: 'dairy' },
    { name: 'Curd 500g', price: 3500, cat: 'dairy' },
    { name: 'Milk 1L', price: 6000, cat: 'dairy' },
    { name: 'Maggi', price: 1400, cat: 'snacks' },
    { name: 'Biscuits', price: 2000, cat: 'snacks' },
    { name: 'Chips', price: 1000, cat: 'snacks' },
    { name: 'Tea 500g', price: 25000, cat: 'beverages' },
    { name: 'Coffee 50g', price: 10000, cat: 'beverages' },
    { name: 'Sugar 1kg', price: 4200, cat: 'grains' },
    { name: 'Salt 1kg', price: 2500, cat: 'grains' },
    { name: 'Soap', price: 3500, cat: 'personal care' },
    { name: 'Shampoo', price: 15000, cat: 'personal care' },
    { name: 'Detergent', price: 12000, cat: 'household' },
  ];

  const products = [];
  for (const p of productsData) {
    const prod = await db.product.create({
      data: {
        merchantId: merchant.id,
        name: p.name,
        aliases: JSON.stringify([p.name.toLowerCase()]),
        sellingPricePaise: p.price,
        category: p.cat,
      }
    });
    products.push(prod);
    
    // Low margin fast moving vs low margin slow moving
    let cost = Math.floor(p.price * 0.85); // 15% margin
    if (p.name === 'Maggi') cost = Math.floor(p.price * 0.98); // < 5% margin, fast
    if (p.name === 'Soap') cost = Math.floor(p.price * 0.97); // < 5% margin, slow

    let exp = null;
    if (p.name === 'Paneer 500g') {
      exp = new Date();
      exp.setDate(exp.getDate() + 3); // Expiring in 3 days
    }

    await db.stockBatch.create({
      data: {
        productId: prod.id,
        supplierId: sharma.id,
        qty: 100,
        remainingQty: p.name === 'Paneer 500g' ? 50 : 80,
        unitCostPaise: cost,
        expiryDate: exp,
      }
    });
  }

  const cust = await db.customer.create({
    data: { merchantId: merchant.id, name: 'Ramesh Customer', phone: '9876543210' }
  });

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 65);
  await db.creditEntry.create({
    data: {
      customerId: cust.id,
      amountPaise: 150000,
      type: 'GIVEN',
      note: 'Old udhaar',
      createdAt: sixtyDaysAgo,
    }
  });

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 28);
  await db.complianceItem.create({
    data: {
      merchantId: merchant.id,
      type: 'FSSAI Licence',
      dueDate: thirtyDaysFromNow,
    }
  });

  // some sales today
  const s = await db.sale.create({
    data: {
      merchantId: merchant.id,
      totalPaise: products[0].sellingPricePaise * 2,
    }
  });
  await db.saleItem.create({
    data: {
      saleId: s.id,
      productId: products[0].id,
      qty: 2,
      sellingPricePaise: products[0].sellingPricePaise,
      unitCostPaise: Math.floor(products[0].sellingPricePaise * 0.85),
    }
  });

  console.log('Seeding done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
