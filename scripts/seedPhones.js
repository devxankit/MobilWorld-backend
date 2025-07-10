// scripts/seedPhones.js
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Phone from '../models/phone.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mobi-world';

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Remove old data
  await User.deleteMany({ email: 'dummyuser@example.com' });
  await Phone.deleteMany({});

  // Create a dummy user
  const user = new User({
    name: 'Dummy User',
    email: 'dummyuser@example.com',
    password: 'password123',
    mobile: '9876543210',
    shopName: 'Dummy Mobile Shop',
    address: {
      street: '123 Main St',
      city: 'Metropolis',
      state: 'State',
      pincode: '123456',
      country: 'India'
    }
  });
  await user.save();

  // Create dummy phones
  const phones = [
    {
      modelNo: 'IPHONE13',
      imei1: '123456789012345',
      imei2: '123456789012346',
      color: 'Black',
      purchasePrice: 50000,
      salePrice: 60000,
      partyName: 'Apple Distributor',
      description: 'Brand new iPhone 13',
      status: 'in_stock',
      images: [
        {
          filename: 'iphone13-black.jpg',
          originalName: 'iphone13-black.jpg',
          mimetype: 'image/jpeg',
          size: 102400,
          uploadDate: new Date()
        }
      ],
      userId: user._id
    },
    {
      modelNo: 'SAMSUNGS21',
      imei1: '223456789012345',
      imei2: '223456789012346',
      color: 'Silver',
      purchasePrice: 40000,
      salePrice: 48000,
      partyName: 'Samsung Dealer',
      description: 'Samsung Galaxy S21, lightly used',
      status: 'sold',
      images: [
        {
          filename: '1751696737795-elias-maurer-UYUS0YEdTC4-unsplash.jpg',
          originalName: 'samsungs21-silver.jpg',
          mimetype: 'image/jpeg',
          size: 110000,
          uploadDate: new Date()
        }
      ],
      soldTo: {
        customerName: 'John Doe',
        customerMobile: '9123456789',
        customerAddress: '456 Side St, City'
      },
      soldDate: new Date(),
      userId: user._id
    },
    {
      modelNo: 'ONEPLUS9',
      imei1: '323456789012345',
      imei2: '323456789012346',
      color: 'Blue',
      purchasePrice: 35000,
      salePrice: 42000,
      partyName: 'OnePlus Store',
      description: 'OnePlus 9, excellent condition',
      status: 'in_stock',
      images: [
        {
          filename: 'oneplus9-blue.jpg',
          originalName: 'oneplus9-blue.jpg',
          mimetype: 'image/jpeg',
          size: 98000,
          uploadDate: new Date()
        }
      ],
      userId: user._id
    }
  ];

  // Insert phones one by one to trigger pre-save middleware
  for (const phone of phones) {
    await Phone.create(phone);
  }
  console.log('Dummy user and phones inserted!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
}); 